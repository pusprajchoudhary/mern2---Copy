const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    console.log('Checking if admin user exists...');
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log('Admin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminExists.password = hashedPassword;
      adminExists.role = 'admin';
      await adminExists.save();
      console.log('Admin user updated successfully!');
    } else {
      // Create admin user
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created successfully!');
    }

    // Verify the admin user
    const adminUser = await User.findOne({ email: adminEmail });
    console.log('Admin user details:', {
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdminUser(); 