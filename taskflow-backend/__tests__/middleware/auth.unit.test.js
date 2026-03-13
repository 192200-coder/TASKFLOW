const { authenticate } = require('../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');

jest.mock('jsonwebtoken');

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Auth Middleware (unit)', () => {

  let req;
  let res;
  let next;

  beforeEach(() => {

    req = {
      header: jest.fn()
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();

  });

  it('permite acceso con token válido', async () => {

    const fakePayload = { id: 1 };

    req.header.mockReturnValue('Bearer tok.valid');

    jwt.verify.mockReturnValue(fakePayload);

    User.findByPk.mockResolvedValue({ id: 1, email: 'a@b.com' });

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();

  });

  it('rechaza petición sin token', async () => {

    req.header.mockReturnValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();

  });

  it('rechaza token inválido', async () => {

    req.header.mockReturnValue('Bearer badtoken');

    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();

  });

});