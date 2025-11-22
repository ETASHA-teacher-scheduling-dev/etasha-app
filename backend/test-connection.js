// Test Supabase Database Connection
require('dotenv').config();
const { Sequelize } = require('sequelize');
const dbConfig = require('./config/db.config');

console.log('🔍 Testing Supabase Connection...\n');

// Test 1: Direct Connection
async function testDirectConnection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Direct Connection (Port 5432)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Configuration:');
  console.log('- Host:', dbConfig.HOST);
  console.log('- Port:', dbConfig.port || 5432);
  console.log('- User:', dbConfig.USER);
  console.log('- Database:', dbConfig.DB);
  console.log('- Password:', dbConfig.PASSWORD ? '***' + dbConfig.PASSWORD.slice(-4) : 'NOT SET');
  console.log('');

  const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    port: dbConfig.port || 5432,
    dialectOptions: dbConfig.dialectOptions,
    logging: false
  });

  try {
    console.log('⏳ Attempting to connect...');
    await sequelize.authenticate();
    console.log('✅ Direct connection successful!');
    
    const [results] = await sequelize.query('SELECT current_database(), current_user, version()');
    console.log('');
    console.log('📊 Database Info:');
    console.log('- Database:', results[0].current_database);
    console.log('- User:', results[0].current_user);
    console.log('- Version:', results[0].version.split(' ')[0], results[0].version.split(' ')[1]);
    console.log('');
    console.log('🎉 Direct connection works! Your backend is ready.');
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
    await sequelize.close();
    return false;
  }
}

// Test 2: Pooler Connection
async function testPoolerConnection() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Pooler Connection (Port 6543)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Configuration:');
  console.log('- Host: aws-0-ap-south-1.pooler.supabase.com');
  console.log('- Port: 6543');
  console.log('- User:', dbConfig.USER);
  console.log('');

  const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    dialect: 'postgres',
    port: 6543,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });

  try {
    console.log('⏳ Attempting to connect via pooler...');
    await sequelize.authenticate();
    console.log('✅ Pooler connection successful!');
    
    const [results] = await sequelize.query('SELECT current_database(), current_user');
    console.log('');
    console.log('📊 Database Info:');
    console.log('- Database:', results[0].current_database);
    console.log('- User:', results[0].current_user);
    console.log('');
    console.log('🎉 Pooler connection works!');
    console.log('');
    console.log('💡 Recommendation: Use the pooler for better performance.');
    console.log('   Update db.config.js with the pooler settings.');
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Pooler connection failed:', error.message);
    await sequelize.close();
    return false;
  }
}

// Run tests
async function runTests() {
  const directSuccess = await testDirectConnection();
  
  if (!directSuccess) {
    const poolerSuccess = await testPoolerConnection();
    
    if (!poolerSuccess) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ BOTH CONNECTIONS FAILED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('Common issues:');
      console.log('1. 🔑 Incorrect password in .env file');
      console.log('   → Go to: https://app.supabase.com/project/vuiqklucyjngwvmpzxyw/settings/database');
      console.log('   → Reset database password and update .env');
      console.log('');
      console.log('2. 🔒 Firewall blocking connections');
      console.log('   → Check your network/firewall settings');
      console.log('   → Try from a different network');
      console.log('');
      console.log('3. 🌐 IPv6 connection issues');
      console.log('   → Your system may be preferring IPv6');
      console.log('   → Try disabling IPv6 temporarily');
      process.exit(1);
    }
  }
  
  process.exit(0);
}

runTests();
