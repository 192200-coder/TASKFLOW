// __tests__/authController.error.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

jest.mock('../src/models', () => {
  return {
    User: {
      create: jest.fn(),
      findOne: jest.fn(),
    }
  };
});

const { User } = require('../src/models');
const authRoutes = require('../src/routes/authRoutes');
const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller - errores DB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('error en registro (create rechazado)', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockRejectedValue(new Error('Error de conexión'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'password123' })
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Error al registrar usuario');
  });

  it('error en login (findOne rechazado)', async () => {
    User.findOne.mockRejectedValue(new Error('Error de conexión'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(500);

    expect(res.body).toHaveProperty('error', 'Error al iniciar sesión');
  });
});