const Attendance = require('../models/AttendanceModel');

const markAttendance = async (req, res) => {
  try {
    const { photo, location } = req.body;

    const attendance = new Attendance({
      user: req.user._id,
      photo,
      location,
      timestamp: new Date(),
    });

    await attendance.save();
    res.status(201).json({ message: 'Attendance marked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
};

const getUserAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.params.userId }).sort({ timestamp: -1 });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching attendance records' });
  }
};

module.exports = {
  markAttendance,
  getUserAttendance,
};
