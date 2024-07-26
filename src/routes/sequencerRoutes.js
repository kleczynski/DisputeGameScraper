const express = require('express');
const { getSequencers } = require('../controller/sequencerController');

const router = express.Router();

router.get('/', getSequencers);

module.exports = router;
