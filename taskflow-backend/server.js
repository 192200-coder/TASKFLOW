// server.js
require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { server: serverConfig } = require('./src/config/environment');

const PORT = serverConfig.port;

// Sincronizar base de datos y arrancar servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');

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