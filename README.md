# TeamUp Calendar Booking Management System

A comprehensive Node.js REST API for managing bookings and appointments using the TeamUp Calendar API. Includes ElevenLabs voice assistant integration for Slovak booking automation.

## Features

- **Complete booking lifecycle management**: Create, update, cancel, and reschedule bookings
- **Availability checking**: Find available time slots and check conflicts
- **Customer management**: Store and manage customer information with bookings
- **Reporting**: Generate booking reports and analytics
- **Flexible scheduling**: Support for different duration, working hours, and buffer times
- **Search functionality**: Find bookings by customer, date, or other criteria

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Jozko25/teamupKalendar.git
cd teamupKalendar
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your TeamUp credentials:
```
TEAMUP_API_KEY=your_api_key_here
TEAMUP_CALENDAR_KEY=your_calendar_key_here
PORT=3000
```

## Quick Start

```javascript
const { createBookingManager } = require('./index');

const bookingManager = createBookingManager();

// Create a booking
const booking = await bookingManager.createBooking({
  title: 'Client Consultation',
  subcalendarId: 'your_subcalendar_id',
  startTime: '2024-01-15T10:00:00',
  duration: 60,
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123'
  },
  notes: 'Initial consultation meeting',
  location: 'Meeting Room A'
});
```

## API Reference

### BookingManager

#### Creating Bookings

```javascript
// Create a new booking
const booking = await bookingManager.createBooking({
  title: 'Meeting Title',
  subcalendarId: 'subcalendar_id',
  startTime: '2024-01-15T10:00:00',
  duration: 60, // minutes
  customerInfo: {
    name: 'Customer Name',
    email: 'customer@email.com',
    phone: '+1-555-0123'
  },
  notes: 'Additional notes',
  location: 'Location',
  reminder: true // Send reminder notification
});
```

#### Managing Bookings

```javascript
// Update a booking
await bookingManager.updateBooking(bookingId, {
  title: 'Updated Title',
  startTime: '2024-01-15T11:00:00',
  customerInfo: { name: 'Updated Name' }
});

// Cancel a booking
await bookingManager.cancelBooking(bookingId, 'Cancellation reason');

// Reschedule a booking
await bookingManager.rescheduleBooking(bookingId, '2024-01-16T10:00:00', 90);
```

#### Availability and Search

```javascript
// Check if a time slot is available
const isAvailable = await bookingManager.checkAvailability(
  subcalendarId, 
  new Date('2024-01-15T10:00:00'), 
  60 // duration in minutes
);

// Get available time slots for a day
const availableSlots = await bookingManager.getAvailableTimeSlots(
  subcalendarId,
  new Date('2024-01-15'),
  60, // slot duration
  { start: 9, end: 17 } // working hours
);

// Get bookings by date
const todaysBookings = await bookingManager.getBookingsByDate(new Date());

// Get upcoming bookings
const upcoming = await bookingManager.getUpcomingBookings(7); // next 7 days

// Get bookings by customer
const customerBookings = await bookingManager.getBookingsByCustomer('customer@email.com');
```

#### Reporting

```javascript
// Generate booking report
const report = await bookingManager.generateBookingReport(
  new Date('2024-01-01'), // start date
  new Date('2024-01-31'), // end date
  subcalendarId // optional
);

console.log(`Total bookings: ${report.totalBookings}`);
console.log(`Total hours: ${report.totalHours}`);
console.log(`Bookings by day:`, report.bookingsByDay);
```

### TeamupClient (Lower-level API)

```javascript
const { TeamupClient } = require('./index');

const client = new TeamupClient(apiKey, calendarKey);

// Get subcalendars
const subcalendars = await client.getSubcalendars();

// Get events
const events = await client.getEvents({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Create, update, delete events
const event = await client.createEvent(eventData);
await client.updateEvent(eventId, updateData);
await client.deleteEvent(eventId);
```

## Configuration Options

### Default Settings

```javascript
const bookingDefaults = {
  reminderMinutes: 15,    // Default reminder time
  defaultDuration: 60,    // Default booking duration in minutes
  bufferMinutes: 15       // Buffer time between bookings
};
```

### Working Hours

```javascript
const workingHours = {
  start: 9,   // 9 AM
  end: 17     // 5 PM
};
```

## Examples

Run the example file to see all features in action:

```bash
node examples/example.js
```

This will demonstrate:
1. Getting subcalendars
2. Finding available time slots
3. Creating bookings
4. Managing bookings (update, cancel, reschedule)
5. Searching and reporting
6. Availability checking

## Error Handling

All methods throw descriptive errors that you can catch:

```javascript
try {
  const booking = await bookingManager.createBooking(bookingData);
} catch (error) {
  console.error('Booking creation failed:', error.message);
}
```

## TeamUp Calendar Setup

1. Create a TeamUp calendar account
2. Get your API key from the TeamUp dashboard
3. Note your calendar key (found in your calendar URL)
4. Create subcalendars for different types of bookings if needed
5. Set appropriate permissions for your API key

## License

This project is open source and available under the MIT License.