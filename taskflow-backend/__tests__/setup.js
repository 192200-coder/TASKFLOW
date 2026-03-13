const sequelize = require('../src/config/database');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  console.log('✅ Base de datos de pruebas sincronizada');
});

afterEach(async () => {
  const tables = [
    'users',
    'boards',
    'board_members',
    'columns',
    'tasks',
    'task_comments',
    'notifications',
    'task_history'
  ];

  for (const table of tables) {
    try {
      await sequelize.query(`DELETE FROM ${table}`);
    } catch (err) {}
  }
});

afterAll(async () => {
  await sequelize.close();
});