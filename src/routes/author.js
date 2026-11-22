const router = require('express').Router();
const { ownerLogin, ownerFullName } = require('../config');

router.get('/', (req, res) => {
  res.json({ login: ownerLogin, fullName: ownerFullName });
});

module.exports = router;