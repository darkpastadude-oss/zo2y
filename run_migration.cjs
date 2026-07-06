const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

const PROJECT_REF = 'gfkhjbztayjyojsgdpgk';
const DB_PASSWORD = 'sintumiasucks101';

async function resolveHost(hostname) {
  return new Promise((resolve, reject) => {
    const resolver = new dns.Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8']);
    resolver.resolve4(hostname, (err, addresses) => {
      if (err) {
        // Try IPv6
        resolver.resolve6(hostname, (err6, addrs6) => {
          if (err6) reject(err);
          else resolve(addrs6.map(a => ({ address: a, family: 6 })));
        });
      } else {
        resolve(addresses.map(a => ({ address: a, family: 4 })));
      }
    });
  });
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node run_migration.cjs <sql_file>');
    process.exit(1);
  }

  const sqlFile = args[0];
  const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8');

  const hostname = `db.${PROJECT_REF}.supabase.co`;
  console.log(`Resolving ${hostname}...`);
  let records;
  try {
    records = await resolveHost(hostname);
    console.log(`Resolved to: ${records.map(r => r.address).join(', ')}`);
  } catch (err) {
    console.log(`DNS resolution failed: ${err.message}`);
    records = [];
  }

  // Also try the API endpoint IPv4
  const apiHost = `${PROJECT_REF}.supabase.co`;
  try {
    const apiRecords = await resolveHost(apiHost);
    console.log(`API endpoint ${apiHost} resolves to: ${apiRecords.map(r => r.address).join(', ')}`);
  } catch (err) {
    console.log(`API DNS resolution failed: ${err.message}`);
  }

  // Build configs from resolved addresses
  const configs = [];
  for (const rec of records) {
    configs.push({
      name: `direct ${rec.address} (port 5432)`,
      host: rec.address,
      port: 5432,
      user: 'postgres',
      password: DB_PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    configs.push({
      name: `direct ${rec.address} (port 6543)`,
      host: rec.address,
      port: 6543,
      user: 'postgres',
      password: DB_PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
  }

  // Pooler attempts with different user formats
  const poolerHost = 'aws-0-us-west-1.pooler.supabase.com';
  try {
    const poolerRecords = await resolveHost(poolerHost);
    console.log(`Pooler resolves to: ${poolerRecords.map(r => r.address).join(', ')}`);
    for (const rec of poolerRecords) {
      configs.push({
        name: `pooler ${rec.address} (postgres.${PROJECT_REF})`,
        host: rec.address,
        port: 6543,
        user: `postgres.${PROJECT_REF}`,
        password: DB_PASSWORD,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
    }
  } catch (err) {
    console.log(`Pooler DNS failed: ${err.message}`);
  }

  console.log(`\nTrying ${configs.length} connection configurations...\n`);

  for (const cfg of configs) {
    process.stdout.write(`${cfg.name}... `);
    const client = new Client(cfg);
    try {
      await client.connect();
      console.log('CONNECTED!');
      console.log('Executing migration...');
      await client.query(sql);
      console.log('Migration completed successfully!');
      await client.end();
      return;
    } catch (err) {
      console.log(err.message.slice(0, 100));
      await client.end().catch(() => {});
    }
  }

  console.error('\nAll attempts failed.');
  process.exit(1);
}

run();
