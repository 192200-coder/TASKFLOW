// __tests__/boardController.unit.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

jest.mock('../src/models', () => {
  return {
    User: {
      findByPk: jest.fn(),
    },
    Board: {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    },
    BoardMember: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
    Column: {
      bulkCreate: jest.fn(),
      findAll: jest.fn(),
    }
  };
});

const { Board, BoardMember, Column } = require('../src/models');

const boardRoutes = require('../src/routes/boardRoutes');
const app = express();
app.use(bodyParser.json());
app.use('/api/boards', boardRoutes);

// helpers
function fakeBoard(id, ownerId, name = 'Mi Proyecto') {
  return {
    id,
    name,
    description: 'Desc',
    owner: { id: ownerId },
    columns: [
      { id: 1, name: 'Por Hacer' },
      { id: 2, name: 'En Progreso' },
      { id: 3, name: 'Hecho' },
    ],
    members: [{ id: ownerId }]
  };
}

describe('Board Controller (unit routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/boards', () => {
    it('crea tablero exitosamente', async () => {
      const fake = fakeBoard(10, 1);
      // Board.create debe devolver estructura con toJSON o similar
      Board.create.mockResolvedValue({
        ...fake,
        toJSON: function () { return fake; }
      });

      Column.bulkCreate.mockResolvedValue(fake.columns);
      BoardMember.create.mockResolvedValue({ id: 1, user_id: 1, board_id: 10 });

      const res = await request(app)
        .post('/api/boards')
        // simular autorización: normalmente el middleware setea req.user, tus rutas pueden leer token -> para el mock, si usas middleware, mejor bypass o set header según cómo esté implementado
        .set('Authorization', 'Bearer faketoken') 
        .send({ name: 'Mi Proyecto', description: 'Descripción del proyecto' })
        .expect(201);

      expect(res.body).toHaveProperty('message', 'Tablero creado exitosamente');
      expect(res.body.board).toHaveProperty('id');
      expect(res.body.board.columns).toHaveLength(3);
      expect(Board.create).toHaveBeenCalled();
    });

    it('valida nombre requerido', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', 'Bearer faketoken')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/boards/my-boards', () => {
    it('obtiene tableros del usuario', async () => {
      const fake1 = fakeBoard(1, 1);
      const fake2 = fakeBoard(2, 1);
      Board.findAll.mockResolvedValue([fake1, fake2]);

      const res = await request(app)
        .get('/api/boards/my-boards')
        .set('Authorization', 'Bearer faketoken')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /api/boards/:boardId', () => {
    it('obtiene tablero por id', async () => {
      const fake = fakeBoard(5, 1);
      Board.findByPk.mockResolvedValue(fake);

      const res = await request(app)
        .get('/api/boards/5')
        .set('Authorization', 'Bearer faketoken')
        .expect(200);

      expect(res.body).toHaveProperty('id', 5);
    });

    it('retorna 403 si no existe (requireBoardRole)', async () => {
      Board.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/boards/99999')
        .set('Authorization', 'Bearer faketoken')
        .expect(403);
    });
  });

  // Puedes añadir más pruebas (invite, update, delete) siguiendo el mismo patrón mockeando los métodos usados.
});