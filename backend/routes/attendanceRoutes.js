const express = require('express');
const { markAttendance, getUserAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/mark', protect, markAttendance);
router.get('/:userId', protect, getUserAttendance);

module.exports = router;
