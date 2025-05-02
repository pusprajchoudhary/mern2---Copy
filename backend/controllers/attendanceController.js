const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const axios = require('axios');

// Function to get address from coordinates using OpenStreetMap Nominatim
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        'accept-language': 'en'
      },
      headers: {
        'User-Agent': 'Attendance-System/1.0'
      }
    });

    if (response.data && response.data.address) {
      const address = response.data.address;
      let formattedAddress = '';

      // Build address string from available components
      if (address.road) formattedAddress += address.road + ', ';
      if (address.suburb) formattedAddress += address.suburb + ', ';
      if (address.city) formattedAddress += address.city + ', ';
      if (address.state) formattedAddress += address.state + ', ';
      if (address.country) formattedAddress += address.country;

      // Remove trailing comma and space if present
      formattedAddress = formattedAddress.replace(/,\s*$/, '');

      return formattedAddress || `${latitude}, ${longitude}`;
    }
    return `${latitude}, ${longitude}`;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return `${latitude}, ${longitude}`;
  }
};

const markAttendance = async (req, res) => {
  try {
    console.log('Received attendance request:', {
      body: req.body,
      file: req.file,
      user: req.user
    });

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { location } = req.body;
    const user = req.user._id;
    const photo = req.file ? req.file.filename : null;

    // Validate required fields
    if (!location || !photo) {
      console.log('Missing required fields:', {
        location: !location ? 'missing' : 'present',
        photo: !photo ? 'missing' : 'present'
      });
      return res.status(400).json({ 
        message: 'Location and photo are required',
        details: {
          location: !location ? 'Location is required' : undefined,
          photo: !photo ? 'Photo is required' : undefined
        }
      });
    }

    // Validate location structure
    if (!location.coordinates || !location.coordinates.latitude || !location.coordinates.longitude) {
      console.error('Invalid location structure:', location);
      return res.status(400).json({ 
        message: 'Invalid location data',
        details: {
          coordinates: !location.coordinates ? 'Coordinates are required' : undefined,
          latitude: !location.coordinates?.latitude ? 'Latitude is required' : undefined,
          longitude: !location.coordinates?.longitude ? 'Longitude is required' : undefined
        }
      });
    }

    // Get human-readable address from coordinates
    const address = await getAddressFromCoordinates(
      location.coordinates.latitude,
      location.coordinates.longitude
    );

    // Check if user has already marked attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      user,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      console.log('User already marked attendance today:', existingAttendance);
      return res.status(400).json({ 
        message: 'Attendance already marked for today',
        attendance: existingAttendance
      });
    }

    // Create a new Date object for the current time in UTC
    const currentTime = new Date();
    
    const newAttendance = new Attendance({
      user,
      location: {
        coordinates: {
          latitude: parseFloat(location.coordinates.latitude),
          longitude: parseFloat(location.coordinates.longitude)
        },
        address: address,
        lastUpdated: new Date()
      },
      photo,
      timestamp: currentTime,
    });

    console.log('Saving attendance record:', {
      user,
      location: newAttendance.location,
      photo,
      timestamp: currentTime.toISOString()
    });

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
    console.error('Error marking attendance:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: error.errors
      });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ 
        message: 'Database error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({ 
      message: 'Error marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    console.log('Received date parameter:', date);
    
    // Parse the date string and set it to local midnight
    const startOfDay = new Date(date);
    if (isNaN(startOfDay.getTime())) {
      console.error('Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Set to start of day in local timezone
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    console.log('Searching for attendance between:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // First, check if the database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database is not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Try to find attendance records
    const attendanceLogs = await Attendance.find({
      timestamp: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    .populate({
      path: 'user',
      select: 'name email'
    })
    .sort({ timestamp: -1 })
    .lean(); // Use lean() for better performance

    console.log('Found attendance logs:', attendanceLogs.length);

    // Transform the data to include location history
    const transformedLogs = attendanceLogs.map(log => {
      try {
        const locationHistory = [];
        if (log.location) {
          locationHistory.push({
            time: log.location.lastUpdated,
            address: log.location.address,
            coordinates: log.location.coordinates
          });
        }

        return {
          ...log,
          locationHistory
        };
      } catch (transformError) {
        console.error('Error transforming log:', transformError);
        return {
          ...log,
          locationHistory: [],
          error: 'Error processing location data'
        };
      }
    });

    res.json(transformedLogs);
  } catch (error) {
    console.error('Error in getAttendanceByDate:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a database error
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ 
        message: 'Database error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Error fetching attendance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    console.log('Starting attendance export for date:', date);

    // Validate date format
    const startOfDay = new Date(date);
    if (isNaN(startOfDay.getTime())) {
      console.error('Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Set to start of day in UTC
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    console.log('Query date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // Check database connection
    console.log('Checking database connection...');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database connection not ready. State:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection error' });
    }
    console.log('Database connection OK');

    // First, check if the Attendance model exists
    console.log('Verifying Attendance model...');
    if (!mongoose.models.Attendance) {
      console.error('Attendance model not found');
      return res.status(500).json({ message: 'Attendance model not initialized' });
    }
    console.log('Attendance model OK');

    // Log the query we're about to execute
    const query = {
      timestamp: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    };
    console.log('Executing MongoDB query:', JSON.stringify(query));

    // Fetch attendance records with user details
    console.log('Fetching attendance records...');
    let attendanceRecords;
    try {
      attendanceRecords = await Attendance.find(query)
        .populate({
          path: 'user',
          select: 'name email',
          model: 'User'
        })
        .lean()
        .exec();

      console.log(`Found ${attendanceRecords ? attendanceRecords.length : 0} records`);
      
      // Log the first record for debugging (excluding sensitive data)
      if (attendanceRecords && attendanceRecords.length > 0) {
        const sampleRecord = { ...attendanceRecords[0] };
        if (sampleRecord.user) {
          sampleRecord.user = {
            _id: sampleRecord.user._id,
            name: sampleRecord.user.name
          };
        }
        console.log('Sample record:', JSON.stringify(sampleRecord, null, 2));
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        message: 'Error querying attendance records',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
      });
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log('No records found for date:', date);
      return res.status(404).json({ message: 'No attendance records found for the specified date' });
    }

    // Create workbook
    console.log('Creating Excel workbook...');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance System';
    workbook.lastModifiedBy = 'Attendance System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add worksheet with error handling
    console.log('Creating worksheet...');
    let worksheet;
    try {
      worksheet = workbook.addWorksheet('Attendance', {
        properties: { tabColor: { argb: 'FFC0000' } }
      });
    } catch (worksheetError) {
      console.error('Error creating worksheet:', worksheetError);
      return res.status(500).json({
        message: 'Error creating Excel worksheet',
        error: process.env.NODE_ENV === 'development' ? worksheetError.message : 'Excel generation error'
      });
    }

    // Define columns
    console.log('Setting up worksheet columns...');
    try {
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 12 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Location', key: 'location', width: 50 },
        { header: 'Coordinates', key: 'coordinates', width: 25 },
        { header: 'Last Updated', key: 'lastUpdated', width: 20 }
      ];
    } catch (columnError) {
      console.error('Error setting up columns:', columnError);
      return res.status(500).json({
        message: 'Error setting up Excel columns',
        error: process.env.NODE_ENV === 'development' ? columnError.message : 'Excel generation error'
      });
    }

    // Style header row
    console.log('Styling header row...');
    try {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    } catch (styleError) {
      console.error('Error styling header:', styleError);
      // Continue despite styling error
    }

    // Add data rows
    console.log('Adding data rows...');
    let rowCount = 0;
    for (const record of attendanceRecords) {
      try {
        const timestamp = new Date(record.timestamp);
        const locationData = record.location || {};
        const coordinates = locationData.coordinates || {};
        
        worksheet.addRow({
          date: timestamp.toLocaleDateString('en-US'),
          time: timestamp.toLocaleTimeString('en-US'),
          name: record.user?.name || 'Unknown',
          email: record.user?.email || 'Unknown',
          location: locationData.address || 'No address',
          coordinates: coordinates.latitude && coordinates.longitude 
            ? `${coordinates.latitude}, ${coordinates.longitude}`
            : 'No coordinates',
          lastUpdated: locationData.lastUpdated 
            ? new Date(locationData.lastUpdated).toLocaleString('en-US')
            : 'N/A'
        });
        rowCount++;
      } catch (rowError) {
        console.error('Error processing record:', rowError);
        console.error('Problematic record:', JSON.stringify(record, null, 2));
        // Continue with next record
      }
    }

    console.log(`Successfully added ${rowCount} rows`);

    // Set response headers
    console.log('Setting response headers...');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.xlsx`);

    // Write to response stream
    console.log('Writing Excel file to response...');
    try {
      await workbook.xlsx.write(res);
      console.log('Excel file written successfully');
      res.end();
    } catch (writeError) {
      console.error('Error writing Excel file:', writeError);
      if (!res.headersSent) {
        return res.status(500).json({
          message: 'Error writing Excel file',
          error: process.env.NODE_ENV === 'development' ? writeError.message : 'Internal server error'
        });
      }
    }

  } catch (error) {
    console.error('Error in exportAttendance:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error exporting attendance data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

// @desc    Update attendance location
// @route   PUT /api/attendance/:id/location
// @access  Private
const updateAttendanceLocation = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if the user is authorized to update this attendance record
    if (attendance.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this attendance record' });
    }

    attendance.location = {
      coordinates: {
        latitude: req.body.coordinates.latitude,
        longitude: req.body.coordinates.longitude
      },
      address: req.body.address,
      lastUpdated: new Date()
    };

    const updatedAttendance = await attendance.save();
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceLogs = await Attendance.find({
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('user', 'name email');

    res.json(attendanceLogs);
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getTodayAttendance,
  exportAttendance,
  updateAttendanceLocation
};
