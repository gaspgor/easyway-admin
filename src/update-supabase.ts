import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function run() {
  const client = new Client({
    user: 'postgres.jifqgqoqjjoervgqdpja',
    host: 'aws-1-ap-northeast-2.pooler.supabase.com',
    database: 'postgres',
    password: 'easyway@2025$',
    port: 6543,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const hash = await bcrypt.hash('test1234', 10);
  console.log('Setting password in Supabase to: test1234');

  const res = await client.query('UPDATE partners_auth SET password_hash = $1 WHERE username = $2', [hash, 'test_4371']);
  console.log('Rows updated:', res.rowCount);

  // Commit explicitly just in case PgBouncer needs it (though single queries autocommit)
  await client.query('COMMIT;');

  const check = await client.query('SELECT password_hash FROM partners_auth WHERE username = $1', ['test_4371']);
  const isMatch = await bcrypt.compare('test1234', check.rows[0].password_hash);
  console.log('Verification match test1234 on Supabase:', isMatch);

  await client.end();
}

run().catch(console.error);
