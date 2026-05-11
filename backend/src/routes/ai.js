const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generate } = require('../controllers/ai');

router.use(auth);

router.post('/generate', generate);

module.exports = router;
