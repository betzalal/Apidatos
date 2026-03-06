require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const app = express();
const server = http.createServer(app);

// 1. Seguridad: Cabeceras HTTP Seguras
app.use(helmet());

// 2. Seguridad: Rate Limiting Global (Prevención de DDoS básica)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // Limita a cada IP a 500 peticiones por ventana
    message: { error: 'Demasiadas peticiones desde esta IP. Inténtelo más tarde.' }
});
app.use(limiter);

// 3. Rate Limiting Agresivo para Ingesta de Datos
const ingestionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 50, // 50 subidas de JSON por minuto
    message: { error: 'Límite de ingesta superado. Reduzca la frecuencia de envío.' }
});

// Configuración de CORS
app.use(cors({
    origin: '*', // En producción podrías restringir esto a la IP del frontend
    methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '5mb' })); // Límite de payload de 5MB por si envían JSONs muy grandes

// 4. Seguridad: Middleware de Autenticación de API Key
const apiKeyMiddleware = (req, res, next) => {
    // Si no hay API Key configurada en .env, dejamos pasar (Modo Desarrollo Seguro)
    const expectedKey = process.env.API_KEY || 'mi_llave_secreta_default';
    const clientKey = req.headers['x-api-key'];

    if (!clientKey || clientKey !== expectedKey) {
        return res.status(401).json({ error: 'Acceso Denegado: API Key inválida o faltante (x-api-key)' });
    }
    next();
};

// Configuración de WebSockets
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Cuando un cliente/dashboard se conecta al WebSocket
io.on('connection', (socket) => {
    console.log('Nuevo dashboard conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('Dashboard desconectado:', socket.id);
    });
});

// Rutas de la API (Endpoints) - PÚBLICAS (Lectura UI Dashboard)
app.get('/api/clientes', (req, res) => {
    try {
        const clientes = db.obtenerClientes();
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

app.post('/api/clientes', apiKeyMiddleware, ingestionLimiter, (req, res) => {
    try {
        const nuevoCliente = db.insertarCliente(req.body);
        // Emitir el evento de nuevo cliente a todos los dashboards conectados
        io.emit('nuevo_cliente', nuevoCliente);
        res.status(201).json({ message: 'Cliente registrado con éxito', data: nuevoCliente });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar cliente' });
    }
});

app.get('/api/mensual', (req, res) => {
    try {
        const registros = db.obtenerMensuales();
        res.json(registros);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener registros mensuales' });
    }
});

app.post('/api/mensual', apiKeyMiddleware, ingestionLimiter, (req, res) => {
    try {
        const nuevoMensual = db.insertarMensual(req.body);
        // Emitir el evento de actualización mensual a todos los dashboards conectados
        io.emit('nuevo_mensual', nuevoMensual);
        res.status(201).json({ message: 'Registro mensual guardado con éxito', data: nuevoMensual });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar estadísticas mensuales' });
    }
});

// =====================================
// DATA HUB: Rutas Ventas (OLAP Ingestion)
// =====================================

app.post('/api/ventas', apiKeyMiddleware, ingestionLimiter, (req, res) => {
    try {
        // req.body debe ser { cliente_nit: '12345', ventas: [{fecha_venta, nombre_producto, cantidad, precio, region}] }
        const payload = req.body;

        if (!payload.cliente_nit || !Array.isArray(payload.ventas)) {
            return res.status(400).json({ error: 'Formato incorrecto. Se requiere cliente_nit y un array de ventas' });
        }

        const cont = db.insertarVentasBatch(payload.cliente_nit, payload.ventas);
        console.log(`[HUBSYNC] Recibidas ${cont} ventas del NIT ${payload.cliente_nit}`);

        // Emitir evento para el Web Socket para refrescos en vivo
        io.emit('nueva_venta_batch', { nit: payload.cliente_nit, cantidad_insertada: cont });

        res.status(201).json({ success: true, insertadas: cont });
    } catch (error) {
        console.error('Error al guardar ventas:', error);
        res.status(500).json({ error: 'Error del servidor al procesar el lote de ventas' });
    }
});

app.get('/api/ventas/historial_subidas', (req, res) => {
    try {
        const data = db.obtenerResumenSubidasPorCliente();
        res.json(data);
    } catch (error) {
        console.error('Error al obtener resumen de subidas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// =====================================
// DATA HUB: Endpoints Analíticos (OLAP)
// =====================================

app.get('/api/olap/tiempo', (req, res) => {
    try {
        res.json(db.olapTiempo());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/olap/regiones', (req, res) => {
    try {
        res.json(db.olapRegiones());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/olap/productos', (req, res) => {
    try {
        res.json(db.olapProductos());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/olap/mapa', (req, res) => {
    try {
        const { filtroTipo, filtroValor } = req.query;
        res.json(db.olapMapaGeografico(filtroTipo, filtroValor));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Puerto de ejecución
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de recepción escuchando en http://localhost:${PORT}`);
});
