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
      // ✅ Mantener conexiones vivas — evita que MySQL las cierre por inactividad
      keepAlive: true,
      connectTimeout: 20000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: {
      max: 5,
      min: 1,        // ✅ Mantener al menos 1 conexión viva siempre
      acquire: 30000,
      idle: 10000,
      evict: 10000,  // ✅ Revisar y descartar conexiones muertas cada 10s
    },
  }
);

// ✅ Configurar sql_mode en cada nueva conexión
// mysql2 entrega la conexión raw con API de callbacks — NO usar .promise() aquí
sequelize.addHook('afterConnect', async (connection) => {
  try {
    await new Promise((resolve, reject) => {
      connection.query(
        "SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'",
        (err) => (err ? reject(err) : resolve())
      );
    });
  } catch (error) {
    // No bloqueamos el servidor si falla
    console.warn('⚠️  sql_mode no configurado en esta conexión:', error.message);
  }
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');

    const [result] = await sequelize.query("SELECT @@SESSION.sql_mode as mode");
    console.log('📊 sql_mode activo:', result[0]?.mode);
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    throw error;
  }
};

module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.initializeDatabase = initializeDatabase;