require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createCustomer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connected to MongoDB\n');

    // Check if customer already exists
    const existingCustomer = await User.findOne({ email: 'customer@searchgear.com' });
    if (existingCustomer) {
      console.log('⚠️  Customer user already exists!');
      console.log('📧 Email: customer@searchgear.com');
      console.log('👤 Role:', existingCustomer.role);
      process.exit(0);
    }

    // Create customer user
    const customer = await User.create({
      email: 'customer@searchgear.com',
      password: 'Customer@123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'customer',
      isVerified: true
    });

    console.log('🎉 Customer user created successfully!\n');
    console.log('📧 Email: customer@searchgear.com');
    console.log('🔑 Password: Customer@123!');
    console.log('👤 Name:', customer.firstName, customer.lastName);
    console.log('📱 Phone:', customer.phone);
    console.log('👥 Role:', customer.role);
    console.log('\nYou can now login with these credentials!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createCustomer();
