const express = require('express');
const { getSequencers } = require('../controllers/sequencerController');

const router = express.Router();

router.get('/', getSequencers);

module.exports = router;
