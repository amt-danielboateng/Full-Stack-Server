const request = require('supertest');
const express = require('express');
const likesRouter = require('../routes/Likes');

const app = express();
app.use(express.json());
app.use('/likes', likesRouter);

// Mock the models
jest.mock('../models', () => ({
  Likes: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock AuthMiddleware
jest.mock('../middlewares/AuthMiddleware', () => ({
  validateToken: (req, res, next) => {
    req.user = { username: 'testuser', id: 1 };
    next();
  }
}));

const { Likes } = require('../models');

describe('Likes Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a like when not already liked', async () => {
      Likes.findOne.mockResolvedValue(null);
      Likes.create.mockResolvedValue({});

      const response = await request(app)
        .post('/likes')
        .set('accesstoken', 'validtoken')
        .send({ PostId: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ liked: true });
      expect(Likes.findOne).toHaveBeenCalledWith({
        where: { PostId: 1, UserId: 1 }
      });
      expect(Likes.create).toHaveBeenCalledWith({
        PostId: 1,
        UserId: 1
      });
    });

    it('should remove like when already liked', async () => {
      const existingLike = { id: 1, PostId: 1, UserId: 1 };
      Likes.findOne.mockResolvedValue(existingLike);
      Likes.destroy.mockResolvedValue(1);

      const response = await request(app)
        .post('/likes')
        .set('accesstoken', 'validtoken')
        .send({ PostId: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ liked: false });
      expect(Likes.findOne).toHaveBeenCalledWith({
        where: { PostId: 1, UserId: 1 }
      });
      expect(Likes.destroy).toHaveBeenCalledWith({
        where: { PostId: 1, UserId: 1 }
      });
    });

    it('should handle different post IDs correctly', async () => {
      Likes.findOne.mockResolvedValue(null);
      Likes.create.mockResolvedValue({});

      const response = await request(app)
        .post('/likes')
        .set('accesstoken', 'validtoken')
        .send({ PostId: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ liked: true });
      expect(Likes.findOne).toHaveBeenCalledWith({
        where: { PostId: 5, UserId: 1 }
      });
      expect(Likes.create).toHaveBeenCalledWith({
        PostId: 5,
        UserId: 1
      });
    });
  });
});