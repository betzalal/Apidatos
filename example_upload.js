/**
 * SCRIPT DE EJEMPLO PARA APLICACIONES CLIENTE (Tus otras apps)
 * Así es cómo deben enviar la información de ventas al Hub.
 */

const API_URL = 'http://144.91.118.73:4005/api/ventas'; // Cambiar a http://localhost:3000/api/ventas en desarrollo local
const API_KEY = 'betzalal_secreto_2024'; // Debe coincidir con el .env del servidor

async function enviarVentasAlHub() {
    // Ejemplo de lote de ventas que tu app generó hoy
    const loteDeVentas = {
        cliente_nit: "999888777", // NIT de la tienda/cliente enviando
        ventas: [
            {
                fecha_venta: new Date().toISOString(),
                nombre_producto: "Bolsa de Cemento Viacha",
                cantidad: 15,
                precio: 55.50,
                region: "La Paz"
            },
            {
                fecha_venta: new Date().toISOString(),
                nombre_producto: "Fierro Corrugado 12mm",
                cantidad: 100,
                precio: 60.00,
                region: "Cochabamba"
            }
        ]
    };

    console.log('Enviando datos al Data Hub...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY // Cabecera de seguridad obligatoria
            },
            body: JSON.stringify(loteDeVentas)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('¡Éxito! Respuesta del Servidor:', data);
    } catch (error) {
        console.error('Fallo al enviar al Hub:', error.message);
    }
}

enviarVentasAlHub();
