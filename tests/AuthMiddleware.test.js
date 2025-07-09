const jwt = require('jsonwebtoken');
const { validateToken } = require('../middlewares/AuthMiddleware');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    it('should call next() with valid token', () => {
      const mockUser = { username: 'testuser', id: 1 };
      req.headers['accesstoken'] = 'validtoken';
      jwt.verify.mockReturnValue(mockUser);

      validateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return error when no token provided', () => {
      validateToken(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ error: 'User not logged in' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error when token is invalid', () => {
      const mockError = new Error('Invalid token');
      req.headers['accesstoken'] = 'invalidtoken';
      jwt.verify.mockImplementation(() => {
        throw mockError;
      });

      validateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', 'secret');
      expect(res.json).toHaveBeenCalledWith({ error: mockError });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty token string', () => {
      req.headers['accesstoken'] = '';

      validateToken(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ error: 'User not logged in' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle null token', () => {
      req.headers['accesstoken'] = null;

      validateToken(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ error: 'User not logged in' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});