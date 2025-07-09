const request = require('supertest');
const express = require('express');
const postsRouter = require('../routes/Posts');

const app = express();
app.use(express.json());
app.use('/posts', postsRouter);

// Mock the models
jest.mock('../models', () => ({
  Posts: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Likes: {
    findAll: jest.fn()
  }
}));

// Mock AuthMiddleware
jest.mock('../middlewares/AuthMiddleware', () => ({
  validateToken: (req, res, next) => {
    req.user = { username: 'testuser', id: 1 };
    next();
  }
}));

const { Posts, Likes } = require('../models');

describe('Posts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all posts with likes', async () => {
      const mockPosts = [{ id: 1, title: 'Test Post' }];
      const mockLikes = [{ id: 1, PostId: 1, UserId: 1 }];
      
      Posts.findAll.mockResolvedValue(mockPosts);
      Likes.findAll.mockResolvedValue(mockLikes);

      const response = await request(app)
        .get('/posts')
        .set('accesstoken', 'validtoken');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        listOfPosts: mockPosts,
        likedPosts: mockLikes
      });
    });
  });

  describe('GET /byId/:id', () => {
    it('should return a specific post by ID', async () => {
      const mockPost = { id: 1, title: 'Test Post' };
      Posts.findByPk.mockResolvedValue(mockPost);

      const response = await request(app).get('/posts/byId/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPost);
      expect(Posts.findByPk).toHaveBeenCalledWith('1');
    });
  });

  describe('GET /byuserId/:userId', () => {
    it('should return posts by user ID', async () => {
      const mockPosts = [{ id: 1, title: 'User Post', UserId: 1 }];
      Posts.findAll.mockResolvedValue(mockPosts);

      const response = await request(app).get('/posts/byuserId/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPosts);
      expect(Posts.findAll).toHaveBeenCalledWith({
        where: { UserId: '1' },
        include: [Likes]
      });
    });
  });

  describe('POST /', () => {
    it('should create a new post', async () => {
      const newPost = { title: 'New Post', postText: 'Content' };
      Posts.create.mockResolvedValue({});

      const response = await request(app)
        .post('/posts')
        .set('accesstoken', 'validtoken')
        .send(newPost);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...newPost,
        username: 'testuser',
        UserId: 1
      });
      expect(Posts.create).toHaveBeenCalledWith({
        ...newPost,
        username: 'testuser',
        UserId: 1
      });
    });
  });

  describe('PUT /title', () => {
    it('should update post title', async () => {
      Posts.update.mockResolvedValue([1]);

      const response = await request(app)
        .put('/posts/title')
        .set('accesstoken', 'validtoken')
        .send({ newTitle: 'Updated Title', id: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toBe('Updated Title');
      expect(Posts.update).toHaveBeenCalledWith(
        { title: 'Updated Title' },
        { where: { id: 1 } }
      );
    });
  });

  describe('PUT /postText', () => {
    it('should update post text', async () => {
      Posts.update.mockResolvedValue([1]);

      const response = await request(app)
        .put('/posts/postText')
        .set('accesstoken', 'validtoken')
        .send({ newText: 'Updated Content', id: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toBe('Updated Content');
      expect(Posts.update).toHaveBeenCalledWith(
        { postText: 'Updated Content' },
        { where: { id: 1 } }
      );
    });
  });

  describe('DELETE /:postId', () => {
    it('should delete a post', async () => {
      Posts.destroy.mockResolvedValue(1);

      const response = await request(app)
        .delete('/posts/1')
        .set('accesstoken', 'validtoken');

      expect(response.status).toBe(200);
      expect(response.body).toBe('DELETED SUCCESSFULLY');
      expect(Posts.destroy).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });
  });
});