// Simple script to create admin user
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@searchgear.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@searchgear.com',
      password: 'Admin@123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123!');
    console.log('👤 Role:', admin.role);
    console.log('\nYou can now login with these credentials!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
