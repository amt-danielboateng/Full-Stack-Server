# Server Unit Tests

This directory contains unit tests for the server-side routes and middleware.

## Test Coverage

- **Users.test.js**: Tests for user registration, login, authentication, and password change
- **Posts.test.js**: Tests for post CRUD operations (create, read, update, delete)
- **Comments.test.js**: Tests for comment operations (get, create, delete)
- **Likes.test.js**: Tests for like/unlike functionality
- **AuthMiddleware.test.js**: Tests for JWT token validation middleware

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm test -- --coverage
```

## Test Structure

Each test file follows the same pattern:
1. Mock external dependencies (models, bcrypt, jwt)
2. Set up Express app with the route being tested
3. Test various scenarios including success and error cases

## Coverage

The tests achieve high coverage across all routes and middleware, ensuring reliability and catching potential bugs early in development.