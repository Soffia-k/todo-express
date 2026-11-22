const { apiToken } = require('./config');

module.exports = function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  if (!m || m[1] !== apiToken) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};