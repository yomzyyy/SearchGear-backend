/**
 * CREATE SAMPLE BOOKINGS FOR TESTING
 *
 * Run this script to populate your calendar with test data
 * Command: node createSampleBookings.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('./src/models/Booking');
const User = require('./src/models/User');

dotenv.config();

const sampleBookings = [
  {
    pickupLocation: 'Manila',
    dropoffLocation: 'Baguio',
    departureDate: new Date('2025-12-10'),
    numberOfDays: 3,
    busType: '49-seater',
    numberOfPassengers: 45,
    pricePerDay: 15000,
    totalPrice: 45000,
    status: 'confirmed',
    paymentStatus: 'pending',
    bookingType: 'confirmed',
    specialRequests: 'Need air conditioning and comfortable seats'
  },
  {
    pickupLocation: 'Quezon City',
    dropoffLocation: 'Tagaytay',
    departureDate: new Date('2025-12-15'),
    numberOfDays: 2,
    busType: '60-seater',
    numberOfPassengers: 55,
    pricePerDay: 18000,
    totalPrice: 36000,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookingType: 'paid',
    paymentMethod: 'bank-transfer',
    paymentDate: new Date('2025-12-01')
  },
  {
    pickupLocation: 'Makati',
    dropoffLocation: 'Subic',
    departureDate: new Date('2025-12-20'),
    numberOfDays: 1,
    busType: '49-seater',
    numberOfPassengers: 40,
    pricePerDay: 12000,
    totalPrice: 12000,
    status: 'confirmed',
    paymentStatus: 'pending',
    bookingType: 'quotation',
    specialRequests: 'Early morning pickup required'
  },
  {
    pickupLocation: 'Pasig',
    dropoffLocation: 'Laguna',
    departureDate: new Date('2025-12-25'),
    numberOfDays: 4,
    busType: '60-seater',
    numberOfPassengers: 60,
    pricePerDay: 20000,
    totalPrice: 80000,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookingType: 'paid',
    paymentMethod: 'credit-card',
    paymentDate: new Date('2025-12-05')
  },
  {
    pickupLocation: 'Taguig',
    dropoffLocation: 'Batangas',
    departureDate: new Date('2026-01-05'),
    numberOfDays: 2,
    busType: '49-seater',
    numberOfPassengers: 35,
    pricePerDay: 14000,
    totalPrice: 28000,
    status: 'cancelled',
    paymentStatus: 'refunded',
    bookingType: 'confirmed',
    cancellationReason: 'Customer requested cancellation',
    cancelledAt: new Date('2025-12-01')
  }
];

async function createSampleBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user (or create one)
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Using admin user: ${adminUser.email}`);

    // Delete existing bookings (optional - comment out if you want to keep existing data)
    // await Booking.deleteMany({});
    // console.log('Cleared existing bookings');

    // Create sample bookings
    for (const bookingData of sampleBookings) {
      const booking = await Booking.create({
        ...bookingData,
        user: adminUser._id,
        quoteRequest: null // No associated quote for test data
      });

      console.log(`Created booking: ${booking.bookingNumber} - ${booking.pickupLocation} to ${booking.dropoffLocation}`);
    }

    console.log(`\nSuccessfully created ${sampleBookings.length} sample bookings!`);
    console.log('You can now view them in the calendar at http://localhost:5173/admin/bookings');

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample bookings:', error);
    process.exit(1);
  }
}

createSampleBookings();
