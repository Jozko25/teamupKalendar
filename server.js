require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const BookingManager = require('./src/BookingManager');
const config = require('./config');

const app = express();
const PORT = config.app.port;

// Debug environment variables
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('TEAMUP_API_KEY:', config.teamup.apiKey ? 'Set' : 'Missing');
console.log('TEAMUP_CALENDAR_KEY:', config.teamup.calendarKey ? 'Set' : 'Missing');
console.log('ELEVENLABS_API_KEY:', config.elevenlabs.apiKey ? 'Set' : 'Missing');

// Check for required environment variables
if (!config.teamup.apiKey || !config.teamup.calendarKey) {
  console.error('ERROR: Missing required environment variables!');
  console.error('Please set TEAMUP_API_KEY and TEAMUP_CALENDAR_KEY in environment variables');
}

const bookingManager = new BookingManager(
  config.teamup.apiKey,
  config.teamup.calendarKey
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

// Webhook endpoint for ElevenLabs conversational AI
app.post('/api/webhook/booking', asyncHandler(async (req, res) => {
  try {
    const { 
      customerName, 
      service, 
      staffName, 
      date, 
      time 
    } = req.body;

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return res.json({
        success: false,
        message: 'Potrebujem najprv vedieť vaše meno a priezvisko.'
      });
    }

    if (!service || !staffName || !date || !time) {
      return res.json({
        success: false,
        message: 'Chýbajú potrebné údaje pre rezerváciu. Potrebujem meno, službu, personál, dátum a čas.'
      });
    }

    // Map staff to subcalendar IDs
    const staffMapping = {
      'janka': 14791751,
      'nika': 14791752
    };

    // Service durations in minutes
    const serviceDurations = {
      'strihanie': 60,
      'farbenie': 90,
      'melír': 180,
      'balayage': 210,
      'klasické ošetrenie': 75,
      'úprava obočia': 30
    };

    const subcalendarId = staffMapping[staffName?.toLowerCase()];
    if (!subcalendarId) {
      return res.json({
        success: false,
        message: `${staffName} nie je momentálne dostupná. Môžem vám ponúknuť termín s Jankou alebo Nikou.`
      });
    }

    const duration = serviceDurations[service?.toLowerCase()] || 60;
    
    // Parse date and time - ensure correct format for TeamUp
    // TeamUp expects format like "2025-09-19T12:00:00+02:00"
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    
    // Create proper datetime strings with timezone
    const startDt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
    const endHour = parseInt(hour) + Math.floor(duration / 60);
    const endMinute = parseInt(minute) + (duration % 60);
    const adjustedEndHour = endHour + Math.floor(endMinute / 60);
    const adjustedEndMinute = endMinute % 60;
    const endDt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${adjustedEndHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}:00`;

    // Create event directly in TeamUp
    const axios = require('axios');
    const teamupResponse = await axios.post(
      `https://api.teamup.com/${process.env.TEAMUP_CALENDAR_KEY}/events`,
      {
        subcalendar_id: subcalendarId,
        start_dt: startDt,
        end_dt: endDt,
        title: `${customerName} - ${service}`,
        who: customerName,
        notes: `${service} - ${staffName}`
      },
      {
        headers: {
          'Teamup-Token': process.env.TEAMUP_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({
      success: true,
      message: `Výborne! Mám pre vás rezervovaný termín ${date} o ${time} na ${service} s ${staffName}. Pošlem vám SMS potvrdenie.`,
      bookingId: teamupResponse.data.event.id
    });

  } catch (error) {
    console.error('Webhook booking error:', error.response?.data || error.message);
    
    // Check if it's a conflict error
    if (error.response?.status === 409) {
      return res.json({
        success: false,
        message: 'Tento termín je už obsadený. Môžem vám ponúknuť iný čas?'
      });
    }
    
    return res.json({
      success: false,
      message: 'Nepodarilo sa vytvoriť rezerváciu. Skúste prosím iný termín.'
    });
  }
}));

// Webhook endpoint to check available slots
app.post('/api/webhook/availability', asyncHandler(async (req, res) => {
  try {
    const { staffName, date, service } = req.body;

    // Staff schedules and subcalendar mapping
    const staffSchedules = {
      'janka': {
        subcalendarId: 14791751,
        schedule: {
          monday: { start: '12:00', end: '18:00' },
          tuesday: { start: '12:00', end: '18:00' },
          wednesday: { start: '09:00', end: '15:00' },
          thursday: { start: '09:00', end: '15:00' },
          friday: { start: '09:00', end: '15:00' }
        }
      },
      'nika': {
        subcalendarId: 14791752,
        schedule: {
          monday: { start: '09:00', end: '15:00' },
          tuesday: { start: '09:00', end: '15:00' },
          wednesday: { start: '12:00', end: '18:00' },
          thursday: { start: '12:00', end: '18:00' },
          friday: { start: '09:00', end: '15:00' }
        }
      }
    };

    const serviceDurations = {
      'strihanie': 60,
      'farbenie': 90,
      'melír': 180,
      'balayage': 210,
      'klasické ošetrenie': 75,
      'úprava obočia': 30
    };

    const staff = staffSchedules[staffName?.toLowerCase()];
    if (!staff) {
      return res.json({
        success: false,
        message: `${staffName} nie je dostupná. Dostupné sú: Janka, Nika`
      });
    }

    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingHours = staff.schedule[dayOfWeek];
    
    if (!workingHours) {
      return res.json({
        success: false,
        message: `${staffName} v tento deň nepracuje.`,
        availableSlots: []
      });
    }

    // Get existing bookings for this staff member on this date
    const axios = require('axios');
    const startDate = `${date}T00:00:00`;
    const endDate = `${date}T23:59:59`;
    
    const existingEventsResponse = await axios.get(
      `https://api.teamup.com/${process.env.TEAMUP_CALENDAR_KEY}/events`,
      {
        headers: {
          'Teamup-Token': process.env.TEAMUP_API_KEY
        },
        params: {
          startDate: startDate,
          endDate: endDate,
          subcalendarId: staff.subcalendarId
        }
      }
    );

    const existingBookings = existingEventsResponse.data.events || [];
    const serviceDuration = serviceDurations[service?.toLowerCase()] || 60;

    // Generate available slots
    const availableSlots = generateAvailableSlots(
      workingHours.start,
      workingHours.end,
      existingBookings,
      serviceDuration
    );

    return res.json({
      success: true,
      staffName,
      date,
      service,
      workingHours: `${workingHours.start} - ${workingHours.end}`,
      serviceDuration: serviceDuration,
      availableSlots: availableSlots.slice(0, 8) // Return max 8 slots
    });

  } catch (error) {
    console.error('Availability check error:', error.response?.data || error.message);
    return res.json({
      success: false,
      message: 'Nepodarilo sa skontrolovať dostupnosť. Skúste prosím neskôr.'
    });
  }
}));

function generateAvailableSlots(startTime, endTime, existingBookings, serviceDuration) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Convert existing bookings to time ranges
  const bookedRanges = existingBookings.map(booking => {
    const start = new Date(booking.start_dt);
    const end = new Date(booking.end_dt);
    return {
      start: start.getHours() * 60 + start.getMinutes(),
      end: end.getHours() * 60 + end.getMinutes()
    };
  });

  // Generate slots every 30 minutes
  for (let time = startMinutes; time + serviceDuration <= endMinutes; time += 30) {
    const slotEnd = time + serviceDuration;
    
    // Check if this slot conflicts with any existing booking
    const hasConflict = bookedRanges.some(booking => 
      (time < booking.end && slotEnd > booking.start)
    );
    
    if (!hasConflict) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  }
  
  return slots;
}

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