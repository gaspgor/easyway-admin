import pg from 'pg';
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
    console.log('Starting Migration for Partner Architecture...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        role VARCHAR(50) DEFAULT 'superadmin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        company_sphere VARCHAR NOT NULL,
        company_type VARCHAR(50) NOT NULL,
        location TEXT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        website VARCHAR(255) NULL,
        status VARCHAR NOT NULL DEFAULT 'unfinished',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        modified_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partners_auth (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        partner_id UUID NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        modified_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partners_contact_persons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        modified_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partners_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        products JSONB DEFAULT '[]',
        products_excel_file TEXT NULL,
        partner_id UUID NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        modified_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partners_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        services JSONB DEFAULT '[]',
        services_excel_file TEXT NULL,
        partner_id UUID NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        modified_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('Successfully completed full migration block!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}
run();
