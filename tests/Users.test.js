const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersRouter = require('../routes/Users');

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

// Mock the models
jest.mock('../models', () => ({
  Users: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn()
  }
}));

// Mock bcryptjs
jest.mock('bcryptjs');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock AuthMiddleware
jest.mock('../middlewares/AuthMiddleware', () => ({
  validateToken: (req, res, next) => {
    req.user = { username: 'testuser', id: 1 };
    next();
  }
}));

const { Users } = require('../models');

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a new user successfully', async () => {
      bcrypt.hash.mockImplementation((password, rounds, callback) => {
        callback(null, 'hashedpassword');
      });
      Users.create.mockResolvedValue({});

      const response = await request(app)
        .post('/users')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toBe('SUCCESS');
      expect(Users.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'hashedpassword'
      });
    });
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: 1, username: 'testuser', password: 'hashedpassword' };
      Users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocktoken');

      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: 'mocktoken',
        username: 'testuser',
        id: 1
      });
    });

    it('should return error for non-existent user', async () => {
      Users.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/login')
        .send({ username: 'nonexistent', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return error for wrong password', async () => {
      const mockUser = { id: 1, username: 'testuser', password: 'hashedpassword' };
      Users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ error: 'Wrong Username And Password Combination' });
    });
  });

  describe('GET /auth', () => {
    it('should return user info when authenticated', async () => {
      const response = await request(app)
        .get('/users/auth')
        .set('accesstoken', 'validtoken');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ username: 'testuser', id: 1 });
    });
  });

  describe('GET /basicinfo/:id', () => {
    it('should return user basic info', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      Users.findByPk.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/basicinfo/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(Users.findByPk).toHaveBeenCalledWith('1', {
        attributes: { exclude: ['password'] }
      });
    });
  });

  describe('POST /changepassword', () => {
    it('should change password successfully', async () => {
      const mockUser = { username: 'testuser', password: 'oldhash' };
      Users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newhash');
      Users.update.mockResolvedValue([1]);

      const response = await request(app)
        .post('/users/changepassword')
        .set('accesstoken', 'validtoken')
        .send({ oldPassword: 'oldpass', newPassword: 'newpass' });

      expect(response.status).toBe(200);
      expect(response.body).toBe('SUCCESS');
      expect(Users.update).toHaveBeenCalledWith(
        { password: 'newhash' },
        { where: { username: 'testuser' } }
      );
    });

    it('should return error for wrong old password', async () => {
      const mockUser = { username: 'testuser', password: 'oldhash' };
      Users.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/users/changepassword')
        .set('accesstoken', 'validtoken')
        .send({ oldPassword: 'wrongpass', newPassword: 'newpass' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ error: 'Wrong Password Entered' });
    });
  });
});