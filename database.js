const Database = require('better-sqlite3');
const path = require('path');

const fs = require('fs');

// Inicializamos la base de datos asegurando que esté en una carpeta montable para Docker
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'data.db');
const db = new Database(dbPath, { verbose: console.log });

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_empresa TEXT,
    nit TEXT,
    marca TEXT,
    dedicacion TEXT,
    usuario TEXT,
    contrasena TEXT,
    preguntas_respuestas TEXT, 
    nombre_completo TEXT,
    correo_electronico TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS estadisticas_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ventas_totales REAL,
    ganancias REAL,
    productos_vendidos INTEGER,
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nit TEXT,
    fecha_venta DATETIME,
    nombre_producto TEXT,
    cantidad INTEGER,
    precio REAL,
    region TEXT,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Funciones para interactuar con la BD
const insertarCliente = (data) => {
  const stmt = db.prepare(`
    INSERT INTO clientes (
      nombre_empresa, nit, marca, dedicacion, usuario, contrasena, 
      preguntas_respuestas, nombre_completo, correo_electronico
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    data.nombre_empresa,
    data.nit,
    data.marca,
    data.dedicacion,
    data.usuario,
    data.contrasena,
    JSON.stringify(data.preguntas_respuestas || []),
    data.nombre_completo,
    data.correo_electronico
  );

  return { id: info.lastInsertRowid, ...data };
};

const obtenerClientes = () => {
  const stmt = db.prepare('SELECT * FROM clientes ORDER BY fecha_creacion DESC');
  return stmt.all();
};

const insertarMensual = (data) => {
  const stmt = db.prepare(`
    INSERT INTO estadisticas_mensuales (
      ventas_totales, ganancias, productos_vendidos
    ) VALUES (?, ?, ?)
  `);

  const info = stmt.run(
    data.ventas_totales,
    data.ganancias,
    data.productos_vendidos
  );

  return { id: info.lastInsertRowid, ...data };
};

const obtenerMensuales = () => {
  const stmt = db.prepare('SELECT * FROM estadisticas_mensuales ORDER BY fecha_reporte DESC');
  return stmt.all();
};

// ========================
// OLAP Sales Data Hub
// ========================

// Transacción resiliente para insertar miles de ventas de golpe sin bloquear SQLite
const insertarVentasBatch = (nit, ventas) => {
  const insert = db.prepare(`
    INSERT INTO ventas (cliente_nit, fecha_venta, nombre_producto, cantidad, precio, region)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((vtas) => {
    let count = 0;
    for (const vta of vtas) {
      insert.run(nit, vta.fecha_venta, vta.nombre_producto, vta.cantidad, vta.precio, vta.region || 'Desconocida');
      count++;
    }
    return count;
  });

  return insertMany(ventas);
};

// Obtener detalles de subida de un cliente
const obtenerResumenSubidasPorCliente = () => {
  // Cuántos archivos/lotes subió cada NIT y la última fecha
  const stmt = db.prepare(`
    SELECT cliente_nit, 
           COUNT(DISTINCT substr(fecha_subida, 1, 13)) as subidas, 
           MAX(fecha_subida) as ultima_subida 
    FROM ventas 
    GROUP BY cliente_nit
  `);
  return stmt.all();
};

// OLAP: Agrupaciones de Tiempo (Time-Series) -> Sumamos precio * cantidad = Ingreso
const olapTiempo = () => {
  const stmt = db.prepare(`
    SELECT substr(fecha_venta, 1, 10) as fecha, SUM(cantidad * precio) as ingresos, SUM(cantidad) as items
    FROM ventas
    GROUP BY substr(fecha_venta, 1, 10)
    ORDER BY fecha ASC
  `);
  return stmt.all();
};

// OLAP: Agrupaciones por Región (Geographic)
const olapRegiones = () => {
  const stmt = db.prepare(`
    SELECT region, SUM(cantidad * precio) as volumen_dinero, SUM(cantidad) as productos_vendidos
    FROM ventas
    GROUP BY region
    ORDER BY volumen_dinero DESC
  `);
  return stmt.all();
};

// OLAP: Rendimiento de Productos
const olapProductos = () => {
  const stmt = db.prepare(`
    SELECT nombre_producto, SUM(cantidad) as total_cantidad, AVG(precio) as precio_promedio, SUM(cantidad * precio) as rentabilidad
    FROM ventas
    GROUP BY nombre_producto
    ORDER BY rentabilidad DESC
  `);
  return stmt.all();
};

// OLAP: Filtros Geográficos Dinámicos (Sub-pestañas mapa)
const olapMapaGeografico = (filtroTipo, filtroValor) => {
  let query = `
    SELECT region, SUM(cantidad * precio) as volumen_dinero, SUM(cantidad) as productos_vendidos
    FROM ventas
  `;
  const params = [];

  if (filtroTipo === 'producto' && filtroValor) {
    query += ` WHERE nombre_producto = ? `;
    params.push(filtroValor);
  } else if (filtroTipo === 'monto_mayor' && filtroValor) {
    query += ` WHERE (precio * cantidad) >= ? `;
    params.push(Number(filtroValor));
  } else if (filtroTipo === 'monto_menor' && filtroValor) {
    query += ` WHERE (precio * cantidad) <= ? `;
    params.push(Number(filtroValor));
  }

  query += ` GROUP BY region ORDER BY volumen_dinero DESC `;

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

module.exports = {
  db,
  insertarCliente,
  obtenerClientes,
  insertarMensual,
  obtenerMensuales,
  insertarVentasBatch,
  obtenerResumenSubidasPorCliente,
  olapTiempo,
  olapRegiones,
  olapProductos,
  olapMapaGeografico
};
