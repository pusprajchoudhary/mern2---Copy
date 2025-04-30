const express = require('express');
const { markAttendance, getAttendanceByDate, exportAttendance } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// POST: Mark attendance with photo upload
router.post('/mark', protect, upload.single('image'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image' });
  }
  next();
}, markAttendance);

// GET: Get attendance data for a specific date
router.get('/date', protect, getAttendanceByDate);

// GET: Export attendance data to Excel
router.get('/export', protect, exportAttendance);

// Get attendance logs for a specific date
router.get('/date/:date', protect, admin, getAttendanceByDate);

module.exports = router;
