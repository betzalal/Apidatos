const wait = ms => new Promise(res => setTimeout(res, ms));
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const http = require('http');

const productos = ["Licencia Premium", "Servicio Base", "Soporte 24/7", "Plugin X", "Hardware Node"];
const precios = [99.99, 29.99, 150.00, 15.00, 300.00];
const regiones = ["Norte", "Sur", "Este", "Oeste", "Centro"];

// Generar una fecha entre los pasados 6 meses
const randomDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - getRandomInt(0, 180));
    return d.toISOString();
};

const nits = ["1000", "2000", "3000", "4000"];

const makeRequest = (path, method, data = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {}
        };

        if (data) {
            const payload = JSON.stringify(data);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error("RAW RESPONSE: ", body.substring(0, 100));
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

const testSales = async () => {
    console.log('--- Iniciando inyección masiva de ventas simuladas (OLAP Test) ---');

    // Vamos a inyectar batches más pequeños para no romper el parser local
    for (let n of nits) {
        const bulkSales = [];

        for (let i = 0; i < 100; i++) {
            const prodIndex = getRandomInt(0, productos.length - 1);

            bulkSales.push({
                fecha_venta: randomDate(),
                nombre_producto: productos[prodIndex],
                cantidad: getRandomInt(1, 10),
                precio: precios[prodIndex],
                region: regiones[getRandomInt(0, regiones.length - 1)]
            });
        }

        const payload = {
            cliente_nit: n,
            ventas: bulkSales
        };

        const result = await makeRequest('/api/ventas', 'POST', payload);
        console.log(`NIT ${n}: `, result);
        await wait(500); // 500ms delay 
    }

    console.log('--- Fin de inyección. Probando Endpoints OLAP ---');

    const olapTest1 = await makeRequest('/api/olap/regiones', 'GET');
    console.log("Regiones (TOP):", olapTest1.slice(0, 2));

    const olapTest2 = await makeRequest('/api/olap/productos', 'GET');
    console.log("Productos (TOP):", olapTest2.slice(0, 2));
};

testSales();
