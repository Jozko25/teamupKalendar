require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const BookingManager = require('./src/BookingManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Check for required environment variables
if (!process.env.TEAMUP_API_KEY || !process.env.TEAMUP_CALENDAR_KEY) {
  console.error('ERROR: Missing required environment variables!');
  console.error('TEAMUP_API_KEY:', process.env.TEAMUP_API_KEY ? 'Set' : 'Missing');
  console.error('TEAMUP_CALENDAR_KEY:', process.env.TEAMUP_CALENDAR_KEY ? 'Set' : 'Missing');
  console.error('Please set TEAMUP_API_KEY and TEAMUP_CALENDAR_KEY in Railway environment variables');
}

const bookingManager = new BookingManager(
  process.env.TEAMUP_API_KEY,
  process.env.TEAMUP_CALENDAR_KEY
);

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/', (req, res) => {
  res.json({
    message: 'TeamUp Booking Management API',
    version: '1.0.0',
    endpoints: {
      bookings: {
        'POST /api/bookings': 'Create a new booking',
        'GET /api/bookings': 'Get bookings by date or customer',
        'GET /api/bookings/:id': 'Get specific booking',
        'PUT /api/bookings/:id': 'Update booking',
        'DELETE /api/bookings/:id': 'Cancel booking',
        'POST /api/bookings/:id/reschedule': 'Reschedule booking'
      },
      availability: {
        'GET /api/availability': 'Check availability for specific time',
        'GET /api/availability/slots': 'Get available time slots'
      },
      reports: {
        'GET /api/reports/bookings': 'Generate booking report'
      },
      calendar: {
        'GET /api/subcalendars': 'Get subcalendars'
      }
    }
  });
});

app.get('/api/subcalendars', asyncHandler(async (req, res) => {
  const subcalendars = await bookingManager.client.getSubcalendars();
  res.json({ success: true, data: subcalendars });
}));

app.post('/api/bookings', asyncHandler(async (req, res) => {
  const { title, subcalendarId, startTime, duration, customerInfo, notes, location, reminder } = req.body;
  
  if (!title || !subcalendarId || !startTime) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, subcalendarId, and startTime are required'
    });
  }

  const booking = await bookingManager.createBooking({
    title,
    subcalendarId,
    startTime,
    duration,
    customerInfo,
    notes,
    location,
    reminder
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
}));

app.get('/api/bookings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await bookingManager.client.getEvent(id);
  
  res.json({
    success: true,
    data: {
      bookingId: event.id,
      title: event.title,
      startTime: event.start_dt,
      endTime: event.end_dt,
      location: event.location,
      notes: event.notes,
      status: event.custom?.booking_status || 'confirmed',
      customerInfo: {
        name: event.custom?.customer_name,
        email: event.custom?.customer_email,
        phone: event.custom?.customer_phone
      },
      details: event
    }
  });
}));

app.put('/api/bookings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const result = await bookingManager.updateBooking(id, updateData);
  
  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: result
  });
}));

app.delete('/api/bookings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = await bookingManager.cancelBooking(id, reason);
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: result
  });
}));

app.post('/api/bookings/:id/reschedule', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newStartTime, newDuration } = req.body;

  if (!newStartTime) {
    return res.status(400).json({
      success: false,
      error: 'newStartTime is required for rescheduling'
    });
  }

  const result = await bookingManager.rescheduleBooking(id, newStartTime, newDuration);
  
  res.json({
    success: true,
    message: 'Booking rescheduled successfully',
    data: result
  });
}));

app.get('/api/bookings', asyncHandler(async (req, res) => {
  const { date, customer, subcalendarId, upcoming } = req.query;

  let bookings;
  
  if (upcoming) {
    const days = parseInt(upcoming) || 7;
    bookings = await bookingManager.getUpcomingBookings(days, subcalendarId);
  } else if (date) {
    bookings = await bookingManager.getBookingsByDate(new Date(date), subcalendarId);
  } else if (customer) {
    bookings = await bookingManager.getBookingsByCustomer(customer);
  } else {
    bookings = await bookingManager.getUpcomingBookings(30, subcalendarId);
  }

  res.json({
    success: true,
    data: bookings
  });
}));

app.get('/api/availability', asyncHandler(async (req, res) => {
  const { subcalendarId, startTime, duration } = req.query;

  if (!subcalendarId || !startTime) {
    return res.status(400).json({
      success: false,
      error: 'subcalendarId and startTime are required'
    });
  }

  const isAvailable = await bookingManager.checkAvailability(
    subcalendarId,
    new Date(startTime),
    parseInt(duration) || 60
  );

  res.json({
    success: true,
    data: {
      available: isAvailable,
      subcalendarId,
      startTime,
      duration: parseInt(duration) || 60
    }
  });
}));

app.get('/api/availability/slots', asyncHandler(async (req, res) => {
  const { subcalendarId, date, duration, workingHoursStart, workingHoursEnd } = req.query;

  if (!subcalendarId) {
    return res.status(400).json({
      success: false,
      error: 'subcalendarId is required'
    });
  }

  const targetDate = date ? new Date(date) : new Date();
  const slotDuration = parseInt(duration) || 60;
  const workingHours = {
    start: parseInt(workingHoursStart) || 9,
    end: parseInt(workingHoursEnd) || 17
  };

  const slots = await bookingManager.getAvailableTimeSlots(
    subcalendarId,
    targetDate,
    slotDuration,
    workingHours
  );

  res.json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      duration: slotDuration,
      workingHours,
      availableSlots: slots
    }
  });
}));

app.get('/api/reports/bookings', asyncHandler(async (req, res) => {
  const { startDate, endDate, subcalendarId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'startDate and endDate are required'
    });
  }

  const report = await bookingManager.generateBookingReport(
    new Date(startDate),
    new Date(endDate),
    subcalendarId
  );

  res.json({
    success: true,
    data: report
  });
}));

app.use((error, req, res, next) => {
  console.error('API Error:', error.message);
  res.status(500).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: 'Visit / for API documentation'
  });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TeamUp Booking API server running on port ${PORT}`);
  console.log(`📖 API documentation available at http://localhost:${PORT}`);
});

module.exports = app;