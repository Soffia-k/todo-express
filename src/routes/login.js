const router = require('express').Router();
const { ownerLogin } = require('../config');

router.get('/', (req, res) => {
  res.type('text/plain').send(ownerLogin);
});

module.exports = router;