const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { list, get, create, update, remove } = require('../controllers/mindmaps');

router.use(auth);

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
