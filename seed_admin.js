import pg from 'pg';
import bcrypt from 'bcrypt';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'easyway',
});

async function run() {
  await client.connect();
  
  try {
    console.log('Injecting Columns natively into Admins Table...');
    await client.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(150) DEFAULT 'Admin';
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS surname VARCHAR(150) DEFAULT '';
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';
    `);

    console.log('Generating Master Password Cipher...');
    const hashedPwd = await bcrypt.hash('root123@', 10);

    const check = await client.query(`SELECT id FROM admins WHERE email = $1`, ['gaspgor5@gmail.com']);

    if (check.rows.length === 0) {
        console.log('Injecting Gor Gasparyan root user credentials...');
        await client.query(`
          INSERT INTO admins (name, surname, email, phone, password_hash, role)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['Gor', 'Gasparyan', 'gaspgor5@gmail.com', '077885555', hashedPwd, 'superadmin']);
        console.log('MASTER ROOT LOGIN CREATED!');
    } else {
        console.log('User already exists, updating their password uniquely to guarantee root123@ access...');
        await client.query(`
          UPDATE admins SET password_hash = $1, name = $2, surname = $3, phone = $4 WHERE email = $5
        `, [hashedPwd, 'Gor', 'Gasparyan', '077885555', 'gaspgor5@gmail.com']);
        console.log('MASTER ROOT PASSWORD FORCE OVERWRITTEN!');
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
