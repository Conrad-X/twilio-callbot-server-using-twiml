const express = require('express');
const router = express.Router()
const callingController = require('../controllers/calling.controller')

router.post("/transcribe", callingController.transcribe)

router.get("/respond", callingController.respond)

router.post("/ring", callingController.ring)

module.exports = router;
