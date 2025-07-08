const express = require('express');
const generateETicket = require('../controllers/ticketController');
const router = express.Router();


router.get('/:bookingId/pdf', generateETicket);
module.exports = router; 