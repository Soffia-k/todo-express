const express = require('express');
const path = require('path');
const auth = require('./auth');

const app = express();
app.use(express.json());

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid json' });
  }
  next(err);
});

app.use('/login', require('./routes/login'));

app.use('/api', auth);
app.use('/api/author', require('./routes/author'));
app.use('/api/tasks', require('./routes/tasks'));

app.use('/', express.static(path.join(__dirname, '..', 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});