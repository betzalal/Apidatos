const testData = async () => {
    const cliente = {
        nombre_empresa: "Tech Solutions",
        nit: "123456789",
        marca: "TechSol",
        dedicacion: "Desarrollo de Software",
        usuario: "admin_tech",
        contrasena: "secreta123",
        correo_electronico: "contacto@techsolutions.com",
        nombre_completo: "Juan Pérez",
        preguntas_respuestas: [
            { pregunta: "¿Cuántos empleados tiene?", respuestas: ["10-50"] },
            { pregunta: "¿Cuál es su principal mercado?", respuestas: ["Nacional"] },
            { pregunta: "¿Usa software de gestión actual?", respuestas: ["Sí"] },
            { pregunta: "¿Presupuesto anual TI?", respuestas: ["$10k-$50k"] },
            { pregunta: "¿Interés en migrar a la nube?", respuestas: ["Muy Interesado"] }
        ]
    };

    const mensual = {
        ventas_totales: 45000.50,
        ganancias: 15200.75,
        productos_vendidos: 320
    };

    console.log('Enviando datos de cliente...');
    await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
    });

    console.log('Enviando datos mensuales...');
    await fetch('http://localhost:3000/api/mensual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensual)
    });

    console.log('Datos de prueba enviados existosamente.');
};

testData();
