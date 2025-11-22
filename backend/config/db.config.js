// Supabase Database Configuration
// Get your database password from: https://vuiqklucyjngwvmpzxyw.supabase.co
// Project Settings -> Database -> Database Password

module.exports = {
  // Supabase PostgreSQL Direct Connection
  // Using direct connection for better compatibility with Sequelize
  HOST: "db.vuiqklucyjngwvmpzxyw.supabase.co",
  USER: "postgres.vuiqklucyjngwvmpzxyw",
  PASSWORD: process.env.SUPABASE_DB_PASSWORD || "YOUR_SUPABASE_DB_PASSWORD_HERE",
  DB: "postgres",
  dialect: "postgres",
  port: 5432,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Force IPv4 to avoid IPv6 connection issues
    keepAlive: true,
    keepAliveInitialDelayMillis: 0
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // Force IPv4 by using Node.js family option
  native: false,
  
  // Alternative: Pooler connection (requires pgbouncer: true)
  // HOST: "aws-0-ap-south-1.pooler.supabase.com",
  // PORT: 6543,
  // dialectOptions: {
  //   ssl: { require: true, rejectUnauthorized: false }
  // }
};