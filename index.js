require('dotenv').config();

const TeamupClient = require('./src/TeamupClient');
const BookingManager = require('./src/BookingManager');

module.exports = {
  TeamupClient,
  BookingManager,
  
  createBookingManager: (apiKey = process.env.TEAMUP_API_KEY, calendarKey = process.env.TEAMUP_CALENDAR_KEY) => {
    if (!apiKey || !calendarKey) {
      throw new Error('API key and calendar key are required. Set them in .env file or pass as parameters.');
    }
    return new BookingManager(apiKey, calendarKey);
  }
};