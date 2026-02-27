// server.js
require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { initializeDatabase } = require('./src/config/database');
const { server: serverConfig } = require('./src/config/environment');

const PORT = serverConfig.port;

const startServer = async () => {
  try {
    // ✅ Usar initializeDatabase para verificar conexión y configurar sql_mode
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📝 Entorno: ${process.env.NODE_ENV}`);
      console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();