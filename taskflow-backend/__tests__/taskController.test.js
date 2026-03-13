const request = require('supertest');
const app = require('../src/app');
const { BoardMember, Column, Task } = require('../src/models');

describe('Task Controller', () => {

  let token;
  let userId;
  let boardId;
  let columnId;
  let taskId;

  beforeEach(async () => {

    // registrar usuario
    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Task Tester',
        email: 'task@test.com',
        password: 'password123'
      });

    token = register.body.token;
    userId = register.body.user.id;

    // crear tablero
    const board = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Task Board'
      });

    boardId = board.body.board.id;

    // obtener columna creada automáticamente
    columnId = board.body.board.columns[0].id;

  });

  describe('POST /api/tasks', () => {

    it('debería crear una tarea', async () => {

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Mi tarea',
          column_id: columnId
        })
        .expect(201);

      expect(res.body).toHaveProperty('task');
      expect(res.body.task).toHaveProperty('title', 'Mi tarea');

      taskId = res.body.task.id;
    });

  });

  describe('GET /api/tasks/:taskId', () => {

    beforeEach(async () => {

      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Detalle tarea',
          column_id: columnId
        });

      taskId = create.body.task.id;

    });

    it('debería obtener detalle de tarea', async () => {

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('title', 'Detalle tarea');

    });

  });

  describe('PUT /api/tasks/:taskId', () => {

    beforeEach(async () => {

      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Actualizar tarea',
          column_id: columnId
        });

      taskId = create.body.task.id;

    });

    it('debería actualizar tarea', async () => {

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Título actualizado'
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.task.title).toBe('Título actualizado');

    });

  });

  describe('PUT /api/tasks/:taskId/move', () => {

    let newColumn;

    beforeEach(async () => {

      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Mover tarea',
          column_id: columnId
        });

      taskId = create.body.task.id;

      newColumn = await Column.create({
        name: 'Nueva columna',
        position: 2,
        board_id: boardId
      });

    });

    it('debería mover tarea', async () => {

      const res = await request(app)
        .put(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          column_id: newColumn.id,
          position: 1
        })
        .expect(200);

      expect(res.body).toHaveProperty('task');

    });

  });

  describe('DELETE /api/tasks/:taskId', () => {

    beforeEach(async () => {

      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Eliminar tarea',
          column_id: columnId
        });

      taskId = create.body.task.id;

    });

    it('debería eliminar tarea', async () => {

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');

      const task = await Task.findByPk(taskId);
      expect(task).toBeNull();

    });

  });

  describe('Comentarios', () => {

    beforeEach(async () => {

      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Tarea comentarios',
          column_id: columnId
        });

      taskId = create.body.task.id;

    });

    it('debería agregar comentario', async () => {

      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Este es un comentario'
        })
        .expect(201);

      expect(res.body).toHaveProperty('comment');

    });

    it('debería obtener comentarios', async () => {

      await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Comentario 1'
        });

      const res = await request(app)
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);

    });

  });

  describe('Historial', () => {

    beforeEach(async () => {

      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Historial tarea',
          column_id: columnId
        });

      taskId = create.body.task.id;

    });

    it('debería obtener historial', async () => {

      const res = await request(app)
        .get(`/api/tasks/${taskId}/history`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);

    });

  });

});