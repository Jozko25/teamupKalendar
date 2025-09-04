require('dotenv').config();
const { createBookingManager } = require('./index');

async function testBookingSystem() {
    console.log('🚀 Starting TeamUp Booking System Tests\n');
    
    const bookingManager = createBookingManager();
    let createdBookingId = null;
    let subcalendarId = null;
    
    try {
        // Get available subcalendars first
        console.log('📅 Getting available subcalendars...');
        const subcalendars = await bookingManager.client.getSubcalendars();
        console.log(`Found ${subcalendars.length} subcalendars:`);
        subcalendars.forEach(sub => {
            console.log(`  - ${sub.name} (ID: ${sub.id})`);
        });
        
        if (subcalendars.length > 0) {
            subcalendarId = subcalendars[0].id;
            console.log(`\n✅ Using subcalendar: ${subcalendars[0].name}\n`);
        } else {
            console.error('❌ No subcalendars found. Please create one in TeamUp first.');
            return;
        }
        
        // Test 1: Check availability
        console.log('🔍 Test 1: Checking availability for tomorrow at 10 AM...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        const isAvailable = await bookingManager.checkAvailability(
            subcalendarId,
            tomorrow,
            60 // 60 minutes
        );
        console.log(`  Slot available: ${isAvailable ? '✅ Yes' : '❌ No'}\n`);
        
        // Test 2: Get available time slots
        console.log('🕐 Test 2: Getting available time slots for tomorrow...');
        const availableSlots = await bookingManager.getAvailableTimeSlots(
            subcalendarId,
            tomorrow,
            60, // 60-minute slots
            { start: 9, end: 17 } // 9 AM to 5 PM
        );
        console.log(`  Found ${availableSlots.length} available slots:`);
        availableSlots.slice(0, 5).forEach(slot => {
            console.log(`    - ${new Date(slot.start).toLocaleTimeString()} - ${new Date(slot.end).toLocaleTimeString()}`);
        });
        if (availableSlots.length > 5) {
            console.log(`    ... and ${availableSlots.length - 5} more slots`);
        }
        console.log();
        
        // Test 3: Create a booking
        console.log('📝 Test 3: Creating a test booking...');
        const bookingTime = new Date();
        bookingTime.setDate(bookingTime.getDate() + 1);
        bookingTime.setHours(14, 0, 0, 0); // Tomorrow at 2 PM
        
        const newBooking = await bookingManager.createBooking({
            title: 'Test Client Consultation',
            subcalendarId: subcalendarId,
            startTime: bookingTime.toISOString(),
            duration: 60, // 60 minutes
            customerInfo: {
                name: 'John Test',
                email: 'john.test@example.com',
                phone: '+1-555-TEST'
            },
            notes: 'This is a test booking created via API',
            location: 'Virtual Meeting Room',
            reminder: true
        });
        
        createdBookingId = newBooking.bookingId || newBooking.details?.id;
        console.log(`  ✅ Booking created successfully!`);
        console.log(`    - ID: ${createdBookingId}`);
        console.log(`    - Title: ${newBooking.title}`);
        console.log(`    - Time: ${new Date(newBooking.startTime).toLocaleString()}\n`);
        
        // Test 4: Get booking by ID
        console.log('🔎 Test 4: Retrieving the created booking...');
        const retrievedBooking = await bookingManager.getBookingById(createdBookingId);
        console.log(`  ✅ Booking retrieved: ${retrievedBooking.title}\n`);
        
        // Test 5: Update the booking
        console.log('✏️ Test 5: Updating the booking...');
        await bookingManager.updateBooking(createdBookingId, {
            title: 'Updated Test Consultation',
            customerInfo: {
                name: 'John Updated',
                email: 'john.updated@example.com'
            },
            notes: 'Updated notes for the test booking'
        });
        console.log('  ✅ Booking updated successfully\n');
        
        // Test 6: Reschedule the booking
        console.log('🔄 Test 6: Rescheduling the booking to 3 PM...');
        const rescheduleTime = new Date(bookingTime);
        rescheduleTime.setHours(15, 0, 0, 0); // 3 PM instead of 2 PM
        
        await bookingManager.rescheduleBooking(
            createdBookingId,
            rescheduleTime.toISOString(),
            60 // Keep the same duration
        );
        console.log('  ✅ Booking rescheduled successfully\n');
        
        // Test 7: Get bookings by date
        console.log('📋 Test 7: Getting all bookings for tomorrow...');
        const tomorrowsBookings = await bookingManager.getBookingsByDate(tomorrow);
        console.log(`  Found ${tomorrowsBookings.length} booking(s):`);
        tomorrowsBookings.forEach(booking => {
            console.log(`    - ${booking.title} at ${new Date(booking.start_dt).toLocaleTimeString()}`);
        });
        console.log();
        
        // Test 8: Get bookings by customer
        console.log('👤 Test 8: Finding bookings by customer email...');
        const customerBookings = await bookingManager.getBookingsByCustomer('john.updated@example.com');
        console.log(`  Found ${customerBookings.length} booking(s) for this customer\n`);
        
        // Test 9: Generate report
        console.log('📊 Test 9: Generating booking report for this month...');
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        const report = await bookingManager.generateBookingReport(
            startOfMonth,
            endOfMonth,
            subcalendarId
        );
        console.log(`  Report generated:`);
        console.log(`    - Total bookings: ${report.totalBookings}`);
        console.log(`    - Total hours: ${report.totalHours}`);
        console.log(`    - Average duration: ${report.averageDuration} minutes\n`);
        
        // Test 10: Cancel the booking
        console.log('❌ Test 10: Cancelling the test booking...');
        await bookingManager.cancelBooking(
            createdBookingId,
            'Test completed - cleaning up'
        );
        console.log('  ✅ Booking cancelled successfully\n');
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error details:', error.response?.data || error);
        
        // Clean up if booking was created
        if (createdBookingId) {
            console.log('\n🧹 Attempting to clean up created booking...');
            try {
                await bookingManager.cancelBooking(createdBookingId, 'Test cleanup');
                console.log('  ✅ Cleanup successful');
            } catch (cleanupError) {
                console.log('  ⚠️ Could not clean up booking:', cleanupError.message);
            }
        }
    }
}

// Run the tests
testBookingSystem().catch(console.error);