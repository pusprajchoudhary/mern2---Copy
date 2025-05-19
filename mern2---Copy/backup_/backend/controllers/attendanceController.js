const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const ExcelJS = require('exceljs');

const markAttendance = async (req, res) => {
  try {
    const { location } = req.body;
    const user = req.user._id;
    const photo = req.file ? req.file.filename : null;

    if (!location || !photo) {
      return res.status(400).json({ 
        message: 'Location and photo are required',
        details: {
          location: !location ? 'Location is required' : undefined,
          photo: !photo ? 'Photo is required' : undefined
        }
      });
    }

    // Create a new Date object for the current time in UTC
    const currentTime = new Date();
    
    const newAttendance = new Attendance({
      user,
      location,
      photo,
      timestamp: currentTime,
    });

    console.log('Marking attendance with timestamp:', currentTime.toISOString());

    await newAttendance.save();

    res.status(201).json({ 
      message: 'Attendance marked successfully',
      attendance: {
        id: newAttendance._id,
        location: newAttendance.location,
        timestamp: newAttendance.timestamp
      }
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      message: 'Error marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Parse the date string and set it to UTC midnight
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    console.log('Searching for attendance between:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    const attendanceLogs = await Attendance.find({
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('user', 'name email');

    console.log('Found attendance logs:', attendanceLogs.length);

    res.json(attendanceLogs);
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Parse the date string and set it to UTC midnight
    const startDate = new Date(date + 'T00:00:00.000Z');
    const endDate = new Date(date + 'T23:59:59.999Z');

    console.log('Exporting attendance between:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const attendanceLogs = await Attendance.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('user', 'name email');

    console.log('Found attendance logs for export:', attendanceLogs.length);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Add headers
    worksheet.columns = [
      { header: 'Employee Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Check In Time', key: 'checkIn', width: 20 },
      { header: 'Location', key: 'location', width: 20 }
    ];

    // Add data
    attendanceLogs.forEach(log => {
      worksheet.addRow({
        name: log.user.name,
        email: log.user.email,
        checkIn: new Date(log.timestamp).toLocaleString(),
        location: log.location
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${date}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ 
      message: 'Error exporting attendance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { markAttendance, getAttendanceByDate, exportAttendance };
