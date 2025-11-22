// Supabase Database Configuration
// Get your database password from: https://vuiqklucyjngwvmpzxyw.supabase.co
// Project Settings -> Database -> Database Password

module.exports = {
  // Supabase PostgreSQL Connection via Session Pooler (IPv4 compatible)
  HOST: "aws-0-ap-south-1.pooler.supabase.com",
  USER: "postgres.vuiqklucyjngwvmpzxyw",
  PASSWORD: process.env.SUPABASE_DB_PASSWORD,
  DB: "postgres",
  dialect: "postgres",
  port: 6543, // Session pooler port for better connection pooling
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  
  // Optional: Direct connection (port 5432) if pooler has issues
  // Note: Direct connection may have IPv6 issues on some platforms
  // HOST: "db.vuiqklucyjngwvmpzxyw.supabase.co",
  // port: 5432,
};