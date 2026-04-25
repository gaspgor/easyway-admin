import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function run() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'easyway',
    password: 'postgres',
    port: 5432,
  });

  await client.connect();

  const hash = await bcrypt.hash('test_4371', 10);
  console.log('Setting password to: test_4371');
  console.log('Hash:', hash);

  const res = await client.query('UPDATE partners_auth SET password_hash = $1 WHERE username = $2', [hash, 'test_4371']);
  console.log('Rows updated:', res.rowCount);

  const check = await client.query('SELECT password_hash FROM partners_auth WHERE username = $1', ['test_4371']);
  const isMatch = await bcrypt.compare('test_4371', check.rows[0].password_hash);
  console.log('Verification match test_4371:', isMatch);

  await client.end();
}

run().catch(console.error);
