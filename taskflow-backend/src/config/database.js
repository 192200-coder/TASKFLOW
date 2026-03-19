const { Sequelize } = require('sequelize');
const { dbConfig } = require('./environment');

/**
 * Crear instancia de Sequelize dependiendo del entorno
 */
const getSequelizeInstance = (options = {}) => {

  // Usar SQLite en memoria para tests
  if (process.env.NODE_ENV === 'test' && !options.forceMySQL) {

    console.log('🧪 Usando SQLite en memoria para pruebas');

    return new Sequelize('sqlite::memory:', {
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });

  }

  // Usar MySQL en development / production
  console.log(`🗄️ Conectando a MySQL (${process.env.NODE_ENV})`);

  return new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false
        }
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    }
  );

};

const sequelize = getSequelizeInstance();

/**
 * Configuración adicional solo para MySQL
 */
if (sequelize.getDialect() === 'mysql') {

  sequelize.addHook('afterConnect', async (connection) => {

    try {

      await new Promise((resolve, reject) => {
        connection.query(
          "SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'",
          (err) => err ? reject(err) : resolve()
        );
      });

    } catch (error) {

      console.warn('⚠️ sql_mode no configurado:', error.message);

    }

  });

}

/**
 * Inicializar base de datos (usado por server.js)
 */
const initializeDatabase = async () => {

  try {

    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    await sequelize.sync();
    console.log('✅ Modelos sincronizados');

  } catch (error) {

    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;

  }

};

/**
 * Exports
 */
module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.getSequelizeInstance = getSequelizeInstance;
module.exports.initializeDatabase = initializeDatabase;