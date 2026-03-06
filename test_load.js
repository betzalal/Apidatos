const wait = ms => new Promise(res => setTimeout(res, ms));

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const empresas = ["Alpha Tech", "Omega Corp", "Nexus Systems", "DataFlow Inc.", "Cloud Nine LLC", "Global Trade SA", "NextGen Solutions", "Pinnacle Group"];
const rubros = ["Tecnología", "Salud", "Educación", "Logística", "Finanzas"];
const nombres = ["Carlos", "María", "David", "Lucía", "Ana", "Jorge", "Miguel", "Sofía"];

const testData = async () => {
    console.log('--- Iniciando prueba de carga leve (10 clientes aleatorios) ---');

    for (let i = 0; i < 10; i++) {
        const d = new Date();
        // Añadir aleatoriedad a la fecha simulando días pasados para llenar el gráfico
        d.setDate(d.getDate() - getRandomInt(0, 5));

        const cliente = {
            nombre_empresa: `${empresas[getRandomInt(0, empresas.length - 1)]} ${i}`,
            nit: `${getRandomInt(1000000, 9999999)}`,
            marca: "Marca Comercial",
            dedicacion: rubros[getRandomInt(0, rubros.length - 1)],
            usuario: `user${i}`,
            contrasena: `pass${i}`,
            correo_electronico: `contacto${i}@prueba.com`,
            nombre_completo: `${nombres[getRandomInt(0, nombres.length - 1)]} Apellido`,
            preguntas_respuestas: [
                { pregunta: "¿Interés en migrar a la nube?", respuestas: ["Sí"] }
            ],
            fecha_creacion: d.toISOString() // Simulamos una fecha manual solo para el grafico si el backend la leyera (nota: sqlite usa current timestamp por defecto, así que saldrán todos de hoy si dependemos del server)
        };

        await fetch('http://localhost:3000/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });

        console.log(`Enviado cliente ${i + 1}/10`);
        await wait(800); // 800ms delay para ver la animacion
    }

    console.log('--- Fin de la prueba ---');
};

testData();
