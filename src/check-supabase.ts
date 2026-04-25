import { Client } from 'pg';

async function run() {
  const client = new Client({
    user: 'postgres.jifqgqoqjjoervgqdpja',
    host: 'aws-1-ap-northeast-2.pooler.supabase.com',
    database: 'postgres',
    password: 'easyway@2025$',
    port: 6543,
  });

  await client.connect();

  const check = await client.query('SELECT id, username, password_hash, modified_at FROM partners_auth WHERE username = $1', ['test_4371']);
  console.log('Row:', check.rows[0]);

  await client.end();
}

run().catch(console.error);
