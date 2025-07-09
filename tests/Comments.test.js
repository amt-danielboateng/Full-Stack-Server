const request = require('supertest');
const express = require('express');
const commentsRouter = require('../routes/Comments');

const app = express();
app.use(express.json());
app.use('/comments', commentsRouter);

// Mock the models
jest.mock('../models', () => ({
  Comments: {
    findAll: jest.fn(),
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

const { Comments } = require('../models');

describe('Comments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:postId', () => {
    it('should return comments for a specific post', async () => {
      const mockComments = [
        { id: 1, commentBody: 'Great post!', PostId: 1 },
        { id: 2, commentBody: 'Thanks for sharing', PostId: 1 }
      ];
      Comments.findAll.mockResolvedValue(mockComments);

      const response = await request(app).get('/comments/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockComments);
      expect(Comments.findAll).toHaveBeenCalledWith({
        where: { PostId: '1' }
      });
    });

    it('should return empty array when no comments exist', async () => {
      Comments.findAll.mockResolvedValue([]);

      const response = await request(app).get('/comments/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /', () => {
    it('should create a new comment', async () => {
      const newComment = { commentBody: 'New comment', PostId: 1 };
      const expectedComment = { ...newComment, username: 'testuser' };
      Comments.create.mockResolvedValue(expectedComment);

      const response = await request(app)
        .post('/comments')
        .set('accesstoken', 'validtoken')
        .send(newComment);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedComment);
      expect(Comments.create).toHaveBeenCalledWith(expectedComment);
    });

    it('should add username to comment from authenticated user', async () => {
      const newComment = { commentBody: 'Another comment', PostId: 2 };
      Comments.create.mockResolvedValue({});

      await request(app)
        .post('/comments')
        .set('accesstoken', 'validtoken')
        .send(newComment);

      expect(Comments.create).toHaveBeenCalledWith({
        ...newComment,
        username: 'testuser'
      });
    });
  });

  describe('DELETE /:commentId', () => {
    it('should delete a comment successfully', async () => {
      Comments.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete('/comments/1')
        .set('accesstoken', 'validtoken');

      expect(response.status).toBe(200);
      expect(response.body).toBe('DELETED SUCCESSFULLY');
      expect(Comments.destroy).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should handle deletion of non-existent comment', async () => {
      Comments.destroy.mockResolvedValue(0);

      const response = await request(app)
        .delete('/comments/999')
        .set('accesstoken', 'validtoken');

      expect(response.status).toBe(200);
      expect(response.body).toBe('DELETED SUCCESSFULLY');
    });
  });
});