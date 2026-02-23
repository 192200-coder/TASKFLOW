// src/config/database.js
const { Sequelize } = require('sequelize');
const { dbConfig } = require('./environment');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      multipleStatements: true,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// ✅ Hook CORREGIDO - usando promise() como indica el error
sequelize.afterConnect(async (connection) => {
  try {
    // La conexión es de mysql2 (versión callback), necesitamos .promise()
    const promiseConn = connection.promise();
    await promiseConn.query("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");
    console.log('✅ sql_mode configurado correctamente');
    
    // Verificar (opcional)
    const [result] = await promiseConn.query("SELECT @@sql_mode as mode");
    console.log('📊 sql_mode actual:', result[0].mode);
  } catch (error) {
    console.error('❌ Error configurando sql_mode:', error);
  }
});

module.exports = sequelize;
module.exports.sequelize = sequelize;