const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
app.use(cors());

app.use(express.json());
app.use(cors());

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('Bad JSON:', error.message);
    console.error('Request body:', req.body);
    console.error('Request URL:', req.url);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
}); 

const db = require('./models');
const port = 3001;

// Routers
const postRouter = require('./routes/Posts');
const commentsRouter = require('./routes/Comments');
const usersRouter = require('./routes/Users');
const likesRouter = require('./routes/Likes');

app.use('/auth', usersRouter);
app.use('/posts', postRouter);
app.use('/comments', commentsRouter);
app.use('/likes', likesRouter);

db.sequelize.sync().then(() => {
  app.listen(process.env.PORT || port, () => {
    console.log(`Server running on port ${port}`);
}).catch((error) => {
  console.error('Error syncing database:', error);
})  
});


