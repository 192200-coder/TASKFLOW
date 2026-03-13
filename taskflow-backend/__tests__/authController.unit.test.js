// __tests__/authController.unit.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Importar router o app mínimo para las rutas auth
const authRoutes = require('../src/routes/authRoutes'); // asume que existe router en este path

// Mock models
jest.mock('../src/models', () => {
  return {
    User: {
      create: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      destroy: jest.fn(),
    }
  };
});

const { User } = require('../src/models');
const { jwt: jwtConfig } = require('../src/config/environment');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller (unit routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('registra usuario exitosamente', async () => {
      // Mock comportamiento de save y findOne
      User.create.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        toJSON: function () { return { id: 1, name: this.name, email: this.email }; }
      });
      User.findOne.mockResolvedValue(null); // no existe antes

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('message', 'Usuario registrado exitosamente');
      expect(res.body).toHaveProperty('token');
      expect(User.create).toHaveBeenCalled();
    });

    it('maneja error de DB en create', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('DB gone'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'T', email: 'a@b.com', password: 'pass' })
        .expect(500);

      expect(res.body).toHaveProperty('error', 'Error al registrar usuario');
    });

    it('rechaza email duplicado', async () => {
      User.findOne.mockResolvedValue({ id: 2, email: 'dup@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'X', email: 'dup@example.com', password: 'password123' })
        .expect(400);

      expect(res.body).toHaveProperty('error', expect.stringContaining('email'));
    });
  });

  describe('POST /api/auth/login', () => {
    it('login exitoso', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      User.findOne.mockResolvedValue({
        id: 5,
        email: 'login@test.com',
        password_hash: passwordHash,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Login exitoso');
      expect(res.body).toHaveProperty('token');
    });

    it('credenciales inválidas', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nope@test.com', password: 'xxx' })
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });

    it('maneja error DB en login', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'any', password: 'any' })
        .expect(500);

      expect(res.body).toHaveProperty('error', 'Error al iniciar sesión');
    });
  });
});