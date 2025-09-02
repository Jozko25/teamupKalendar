require('dotenv').config();
const BookingManager = require('../src/BookingManager');

async function runExamples() {
  const bookingManager = new BookingManager(
    process.env.TEAMUP_API_KEY,
    process.env.TEAMUP_CALENDAR_KEY
  );

  try {
    console.log('=== TeamUp Booking Management Examples ===\n');

    console.log('1. Getting subcalendars...');
    const subcalendars = await bookingManager.client.getSubcalendars();
    console.log('Subcalendars:', subcalendars.map(s => ({ id: s.id, name: s.name })));
    
    if (subcalendars.length === 0) {
      console.log('No subcalendars found. Please check your calendar key.');
      return;
    }

    const subcalendarId = subcalendars[0].id;
    console.log(`\nUsing subcalendar: ${subcalendars[0].name} (ID: ${subcalendarId})\n`);

    console.log('2. Getting available time slots for today...');
    const availableSlots = await bookingManager.getAvailableTimeSlots(
      subcalendarId,
      new Date(),
      60,
      { start: 9, end: 17 }
    );
    console.log(`Found ${availableSlots.length} available slots:`);
    availableSlots.slice(0, 5).forEach((slot, index) => {
      console.log(`  ${index + 1}. ${slot.start} - ${slot.end}`);
    });

    if (availableSlots.length > 0) {
      console.log('\n3. Creating a test booking...');
      const booking = await bookingManager.createBooking({
        title: 'Test Booking - Client Consultation',
        subcalendarId: subcalendarId,
        startTime: availableSlots[0].start,
        duration: 60,
        customerInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123'
        },
        notes: 'Initial consultation meeting',
        location: 'Meeting Room A'
      });

      console.log('Booking created successfully:');
      console.log(`  Booking ID: ${booking.bookingId}`);
      console.log(`  Title: ${booking.title}`);
      console.log(`  Time: ${booking.startTime} - ${booking.endTime}`);

      console.log('\n4. Getting bookings for today...');
      const todaysBookings = await bookingManager.getBookingsByDate(new Date(), subcalendarId);
      console.log(`Found ${todaysBookings.length} bookings for today:`);
      todaysBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.title} (${booking.startTime})`);
      });

      console.log('\n5. Getting upcoming bookings...');
      const upcomingBookings = await bookingManager.getUpcomingBookings(7, subcalendarId);
      console.log(`Found ${upcomingBookings.length} upcoming bookings:`);
      upcomingBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.title} - ${booking.startTime} (${booking.daysUntil} days)`);
      });

      console.log('\n6. Updating the test booking...');
      await bookingManager.updateBooking(booking.bookingId, {
        title: 'Updated Test Booking - Extended Consultation',
        notes: 'Updated notes: Extended consultation with project details'
      });
      console.log('Booking updated successfully!');

      console.log('\n7. Checking availability for a specific time...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const isAvailable = await bookingManager.checkAvailability(subcalendarId, tomorrow, 90);
      console.log(`Time slot availability: ${isAvailable ? 'Available' : 'Not available'}`);

      console.log('\n8. Generating booking report...');
      const reportStartDate = new Date();
      const reportEndDate = new Date();
      reportEndDate.setDate(reportEndDate.getDate() + 7);
      
      const report = await bookingManager.generateBookingReport(reportStartDate, reportEndDate, subcalendarId);
      console.log('Booking Report:');
      console.log(`  Period: ${report.period.start.toDateString()} - ${report.period.end.toDateString()}`);
      console.log(`  Total Bookings: ${report.totalBookings}`);
      console.log(`  Confirmed: ${report.confirmedBookings}`);
      console.log(`  Cancelled: ${report.cancelledBookings}`);
      console.log(`  Total Hours: ${report.totalHours.toFixed(2)}`);

      console.log('\n9. Cancelling the test booking...');
      const cancelResult = await bookingManager.cancelBooking(
        booking.bookingId, 
        'Test booking - cleaning up example'
      );
      console.log(`Booking cancelled: ${cancelResult.message}`);
    }

    console.log('\n=== Examples completed successfully! ===');

  } catch (error) {
    console.error('Error running examples:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your TEAMUP_API_KEY is correct in the .env file');
    console.log('2. Make sure your TEAMUP_CALENDAR_KEY is set in the .env file');
    console.log('3. Verify your calendar has at least one subcalendar');
    console.log('4. Check that the API key has the necessary permissions');
  }
}

if (require.main === module) {
  runExamples();
}

module.exports = { runExamples };