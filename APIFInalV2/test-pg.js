// test-pg.js
const { Client } = require('pg');

// No incluir credenciales en el repositorio. Proveer DATABASE_URL en el entorno.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Falta DATABASE_URL en el entorno. Crea un .env o exporta DATABASE_URL antes de ejecutar este script.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('Usando connectionString:', connectionString.replace(/:[^:@]+@/, ':*****@'));
    await client.connect();
    console.log('OK: conectado con SSL');
    await client.end();
    process.exit(0);
  } catch (e) {
    console.error('ERR:', e.message || e);
    console.error(e);
    process.exit(1);
  }
})();