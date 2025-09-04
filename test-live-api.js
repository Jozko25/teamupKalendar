const axios = require('axios');

const API_BASE_URL = 'https://teamupkalendar-production.up.railway.app';

async function testLiveAPI() {
    console.log('🚀 Testing Live TeamUp API on Railway\n');
    console.log(`Base URL: ${API_BASE_URL}\n`);
    
    let createdBookingId = null;
    let subcalendarId = null;
    
    try {
        // Test 1: Health Check (try both /health and root)
        console.log('🏥 Test 1: Health Check');
        try {
            let healthResponse;
            try {
                healthResponse = await axios.get(`${API_BASE_URL}/health`);
            } catch {
                healthResponse = await axios.get(`${API_BASE_URL}/`);
            }
            console.log(`  ✅ Server is running`);
            if (healthResponse.data.message) {
                console.log(`  ✅ Message: ${healthResponse.data.message}\n`);
            } else {
                console.log();
            }
        } catch (error) {
            console.log(`  ❌ Health check failed: ${error.message}\n`);
        }
        
        // Test 2: Get Subcalendars
        console.log('📅 Test 2: GET /api/subcalendars');
        const subcalendarResponse = await axios.get(`${API_BASE_URL}/api/subcalendars`);
        const subcalendars = subcalendarResponse.data.data || subcalendarResponse.data;
        console.log(`  ✅ Found ${subcalendars.length} subcalendars:`);
        subcalendars.forEach(sub => {
            console.log(`    - ${sub.name} (ID: ${sub.id})`);
        });
        
        if (subcalendars.length > 0) {
            subcalendarId = subcalendars[0].id;
            console.log(`  📌 Using subcalendar: ${subcalendars[0].name}\n`);
        }
        
        // Test 3: Check Availability
        console.log('🔍 Test 3: GET /api/availability');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        const availabilityResponse = await axios.get(`${API_BASE_URL}/api/availability`, {
            params: {
                subcalendarId: subcalendarId,
                startTime: tomorrow.toISOString(),
                duration: 60
            }
        });
        console.log(`  ✅ Availability check: ${availabilityResponse.data.available ? 'Available' : 'Not available'}`);
        console.log(`  📍 Time slot: ${new Date(availabilityResponse.data.startTime).toLocaleString()}\n`);
        
        // Test 4: Get Available Slots
        console.log('🕐 Test 4: GET /api/availability/slots');
        const slotsResponse = await axios.get(`${API_BASE_URL}/api/availability/slots`, {
            params: {
                subcalendarId: subcalendarId,
                date: tomorrow.toISOString().split('T')[0],
                slotDuration: 60
            }
        });
        console.log(`  ✅ Found ${slotsResponse.data.length} available slots`);
        if (slotsResponse.data.length > 0) {
            console.log(`  📍 First 3 slots:`);
            slotsResponse.data.slice(0, 3).forEach(slot => {
                console.log(`    - ${new Date(slot.start).toLocaleTimeString()} - ${new Date(slot.end).toLocaleTimeString()}`);
            });
        }
        console.log();
        
        // Test 5: Create a Booking
        console.log('📝 Test 5: POST /api/bookings');
        const bookingTime = new Date();
        bookingTime.setDate(bookingTime.getDate() + 1);
        bookingTime.setHours(15, 0, 0, 0); // Tomorrow at 3 PM
        
        const createBookingResponse = await axios.post(`${API_BASE_URL}/api/bookings`, {
            title: 'API Test Booking',
            subcalendarId: subcalendarId,
            startTime: bookingTime.toISOString(),
            duration: 60,
            customerInfo: {
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '+1-555-TEST'
            },
            notes: 'This is a test booking from Railway API test',
            location: 'Virtual Meeting'
        });
        
        createdBookingId = createBookingResponse.data.bookingId || createBookingResponse.data.id;
        console.log(`  ✅ Booking created!`);
        console.log(`    - ID: ${createdBookingId}`);
        console.log(`    - Title: ${createBookingResponse.data.title}`);
        console.log(`    - Time: ${new Date(createBookingResponse.data.startTime).toLocaleString()}\n`);
        
        // Test 6: Get All Bookings
        console.log('📋 Test 6: GET /api/bookings');
        const bookingsResponse = await axios.get(`${API_BASE_URL}/api/bookings`);
        console.log(`  ✅ Retrieved ${bookingsResponse.data.length} booking(s)`);
        const ourBooking = bookingsResponse.data.find(b => b.bookingId === createdBookingId);
        if (ourBooking) {
            console.log(`  📍 Found our test booking: ${ourBooking.title}\n`);
        }
        
        // Test 7: Get Booking by ID
        console.log('🔎 Test 7: GET /api/bookings/:id');
        const singleBookingResponse = await axios.get(`${API_BASE_URL}/api/bookings/${createdBookingId}`);
        console.log(`  ✅ Retrieved booking: ${singleBookingResponse.data.title}`);
        console.log(`    - Status: ${singleBookingResponse.data.custom?.booking_status || 'confirmed'}\n`);
        
        // Test 8: Update the Booking
        console.log('✏️ Test 8: PUT /api/bookings/:id');
        const updateResponse = await axios.put(`${API_BASE_URL}/api/bookings/${createdBookingId}`, {
            title: 'Updated API Test Booking',
            customerInfo: {
                name: 'Updated Customer',
                email: 'updated@example.com'
            },
            notes: 'Updated notes for the test booking'
        });
        console.log(`  ✅ Booking updated successfully`);
        console.log(`    - New title: Updated API Test Booking\n`);
        
        // Test 9: Get Bookings by Date
        console.log('📅 Test 9: GET /api/bookings/date/:date');
        const dateString = tomorrow.toISOString().split('T')[0];
        const dateBookingsResponse = await axios.get(`${API_BASE_URL}/api/bookings/date/${dateString}`);
        console.log(`  ✅ Found ${dateBookingsResponse.data.length} booking(s) for ${dateString}\n`);
        
        // Test 10: Get Upcoming Bookings
        console.log('📆 Test 10: GET /api/bookings/upcoming');
        const upcomingResponse = await axios.get(`${API_BASE_URL}/api/bookings/upcoming`, {
            params: { days: 7 }
        });
        console.log(`  ✅ Found ${upcomingResponse.data.length} upcoming booking(s) in the next 7 days\n`);
        
        // Test 11: Cancel the Booking
        console.log('❌ Test 11: DELETE /api/bookings/:id');
        const cancelResponse = await axios.delete(`${API_BASE_URL}/api/bookings/${createdBookingId}`, {
            data: { reason: 'Test completed - cleaning up' }
        });
        console.log(`  ✅ Booking cancelled successfully`);
        console.log(`    - Status: ${cancelResponse.data.status}`);
        console.log(`    - Message: ${cancelResponse.data.message}\n`);
        
        console.log('🎉 All API tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        // Clean up if booking was created
        if (createdBookingId) {
            console.log('\n🧹 Attempting to clean up created booking...');
            try {
                await axios.delete(`${API_BASE_URL}/api/bookings/${createdBookingId}`, {
                    data: { reason: 'Test cleanup after error' }
                });
                console.log('  ✅ Cleanup successful');
            } catch (cleanupError) {
                console.log('  ⚠️ Could not clean up booking:', cleanupError.message);
            }
        }
    }
}

// Run the tests
testLiveAPI().catch(console.error);