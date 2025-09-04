require('dotenv').config();
const axios = require('axios');

async function testTeamUpAPI() {
    const apiKey = process.env.TEAMUP_API_KEY;
    const calendarKey = process.env.TEAMUP_CALENDAR_KEY;
    
    const axiosInstance = axios.create({
        baseURL: 'https://api.teamup.com',
        headers: {
            'Teamup-Token': apiKey,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('Testing TeamUp API directly...\n');
    
    try {
        // Test 1: Get subcalendars
        console.log('1. Getting subcalendars...');
        const subcalendarsResponse = await axiosInstance.get(`/${calendarKey}/subcalendars`);
        console.log('✅ Subcalendars retrieved:', subcalendarsResponse.data.subcalendars.map(s => s.name));
        console.log();
        
        // Test 2: Get events with correct parameter names
        console.log('2. Testing events endpoint with different parameter formats...');
        
        // Try with startDate/endDate
        try {
            const eventsResponse1 = await axiosInstance.get(`/${calendarKey}/events`, {
                params: {
                    startDate: '2025-01-05',
                    endDate: '2025-01-06'
                }
            });
            console.log('✅ startDate/endDate format works');
        } catch (error) {
            console.log('❌ startDate/endDate format failed:', error.response?.data);
        }
        
        // Try with start_date/end_date (underscore)
        try {
            const eventsResponse2 = await axiosInstance.get(`/${calendarKey}/events`, {
                params: {
                    start_date: '2025-01-05',
                    end_date: '2025-01-06'
                }
            });
            console.log('✅ start_date/end_date format works');
        } catch (error) {
            console.log('❌ start_date/end_date format failed:', error.response?.data);
        }
        
        // Try with subcalendar_id parameter
        const subcalendarId = subcalendarsResponse.data.subcalendars[0].id;
        console.log(`\n3. Testing with subcalendar_id: ${subcalendarId}`);
        
        try {
            const eventsResponse3 = await axiosInstance.get(`/${calendarKey}/events`, {
                params: {
                    startDate: '2025-01-05',
                    endDate: '2025-01-06',
                    subcalendarId: subcalendarId
                }
            });
            console.log('✅ subcalendarId parameter works');
        } catch (error) {
            console.log('❌ subcalendarId parameter failed:', error.response?.data);
        }
        
        // Try with subcalendar_ids (plural with array)
        try {
            const eventsResponse4 = await axiosInstance.get(`/${calendarKey}/events`, {
                params: {
                    startDate: '2025-01-05',
                    endDate: '2025-01-06',
                    subcalendar_ids: [subcalendarId]
                }
            });
            console.log('✅ subcalendar_ids parameter works');
        } catch (error) {
            console.log('❌ subcalendar_ids parameter failed:', error.response?.data);
        }
        
        // Get the actual working format
        console.log('\n4. Testing minimal request...');
        const minimalResponse = await axiosInstance.get(`/${calendarKey}/events`);
        console.log('✅ Minimal request works, got', minimalResponse.data.events.length, 'events');
        
    } catch (error) {
        console.error('\n❌ API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

testTeamUpAPI().catch(console.error);