const TeamupClient = require('./TeamupClient');
const { format, addMinutes, parseISO, isAfter, isBefore, differenceInMinutes } = require('date-fns');

class BookingManager {
  constructor(apiKey, calendarKey) {
    this.client = new TeamupClient(apiKey, calendarKey);
    this.bookingDefaults = {
      reminderMinutes: 15,
      defaultDuration: 60,
      bufferMinutes: 15
    };
  }

  async createBooking(bookingData) {
    try {
      const { 
        title, 
        subcalendarId, 
        startTime, 
        duration = this.bookingDefaults.defaultDuration,
        customerInfo,
        notes,
        location,
        reminder = true
      } = bookingData;

      if (!title || !subcalendarId || !startTime) {
        throw new Error('Missing required booking fields: title, subcalendarId, and startTime are required');
      }

      const startDt = new Date(startTime);
      const endDt = addMinutes(startDt, duration);

      const eventData = {
        subcalendar_ids: [subcalendarId],
        start_dt: format(startDt, "yyyy-MM-dd'T'HH:mm:ss"),
        end_dt: format(endDt, "yyyy-MM-dd'T'HH:mm:ss"),
        title: title,
        notes: this.formatNotes(customerInfo, notes),
        location: location || '',
        reminder: reminder ? { minutes: this.bookingDefaults.reminderMinutes } : null,
        custom: customerInfo ? {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          booking_status: 'confirmed'
        } : {}
      };

      const event = await this.client.createEvent(eventData);
      
      return {
        bookingId: event.id,
        title: event.title,
        startTime: event.start_dt,
        endTime: event.end_dt,
        status: 'confirmed',
        details: event
      };
    } catch (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }

  async updateBooking(bookingId, updateData) {
    try {
      const existingEvent = await this.client.getEvent(bookingId);
      
      const updatedData = {
        ...existingEvent,
        ...updateData
      };

      if (updateData.startTime) {
        const startDt = new Date(updateData.startTime);
        const duration = updateData.duration || differenceInMinutes(new Date(existingEvent.end_dt), new Date(existingEvent.start_dt));
        updatedData.start_dt = format(startDt, "yyyy-MM-dd'T'HH:mm:ss");
        updatedData.end_dt = format(addMinutes(startDt, duration), "yyyy-MM-dd'T'HH:mm:ss");
      }

      if (updateData.customerInfo) {
        updatedData.custom = {
          ...existingEvent.custom,
          customer_name: updateData.customerInfo.name,
          customer_email: updateData.customerInfo.email,
          customer_phone: updateData.customerInfo.phone
        };
        updatedData.notes = this.formatNotes(updateData.customerInfo, updateData.notes || existingEvent.notes);
      }

      const updated = await this.client.updateEvent(bookingId, updatedData);
      
      return {
        bookingId: updated.id,
        message: 'Booking updated successfully',
        details: updated
      };
    } catch (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }
  }

  async cancelBooking(bookingId, reason = '') {
    try {
      const event = await this.client.getEvent(bookingId);
      
      const cancelledEvent = {
        ...event,
        title: `[CANCELLED] ${event.title}`,
        custom: {
          ...event.custom,
          booking_status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        }
      };

      await this.client.updateEvent(bookingId, cancelledEvent);
      
      return {
        bookingId: bookingId,
        status: 'cancelled',
        message: 'Booking cancelled successfully',
        reason: reason
      };
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  }

  async rescheduleBooking(bookingId, newStartTime, newDuration) {
    try {
      const event = await this.client.getEvent(bookingId);
      
      const startDt = new Date(newStartTime);
      const duration = newDuration || differenceInMinutes(new Date(event.end_dt), new Date(event.start_dt));
      
      const isSlotAvailable = await this.checkAvailability(
        event.subcalendar_ids[0],
        startDt,
        duration,
        bookingId
      );

      if (!isSlotAvailable) {
        throw new Error('The requested time slot is not available');
      }

      const rescheduledEvent = {
        ...event,
        start_dt: format(startDt, "yyyy-MM-dd'T'HH:mm:ss"),
        end_dt: format(addMinutes(startDt, duration), "yyyy-MM-dd'T'HH:mm:ss"),
        custom: {
          ...event.custom,
          last_rescheduled: new Date().toISOString(),
          original_time: event.start_dt
        }
      };

      const updated = await this.client.updateEvent(bookingId, rescheduledEvent);
      
      return {
        bookingId: updated.id,
        newStartTime: updated.start_dt,
        newEndTime: updated.end_dt,
        message: 'Booking rescheduled successfully',
        details: updated
      };
    } catch (error) {
      throw new Error(`Failed to reschedule booking: ${error.message}`);
    }
  }

  async checkAvailability(subcalendarId, startTime, duration, excludeEventId = null) {
    try {
      const startDt = new Date(startTime);
      const endDt = addMinutes(startDt, duration);
      
      const events = await this.client.getEvents({
        startDate: format(startDt, 'yyyy-MM-dd'),
        endDate: format(endDt, 'yyyy-MM-dd'),
        subcalendarId: subcalendarId
      });

      const conflicts = events.filter(event => {
        if (excludeEventId && event.id === excludeEventId) {
          return false;
        }
        
        const eventStart = new Date(event.start_dt);
        const eventEnd = new Date(event.end_dt);
        
        return (startDt < eventEnd && endDt > eventStart);
      });

      return conflicts.length === 0;
    } catch (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  async getBookingsByDate(date, subcalendarId = null) {
    try {
      const params = {
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd')
      };

      if (subcalendarId) {
        params.subcalendarId = subcalendarId;
      }

      const events = await this.client.getEvents(params);
      
      return events.map(event => ({
        bookingId: event.id,
        title: event.title,
        startTime: event.start_dt,
        endTime: event.end_dt,
        location: event.location,
        status: event.custom?.booking_status || 'confirmed',
        customerInfo: {
          name: event.custom?.customer_name,
          email: event.custom?.customer_email,
          phone: event.custom?.customer_phone
        },
        details: event
      }));
    } catch (error) {
      throw new Error(`Failed to get bookings by date: ${error.message}`);
    }
  }

  async getBookingsByCustomer(customerEmail) {
    try {
      const searchQuery = customerEmail;
      const events = await this.client.searchEvents(searchQuery);
      
      const customerBookings = events.filter(event => 
        event.custom?.customer_email === customerEmail
      );

      return customerBookings.map(event => ({
        bookingId: event.id,
        title: event.title,
        startTime: event.start_dt,
        endTime: event.end_dt,
        status: event.custom?.booking_status || 'confirmed',
        details: event
      }));
    } catch (error) {
      throw new Error(`Failed to get customer bookings: ${error.message}`);
    }
  }

  async getUpcomingBookings(days = 7, subcalendarId = null) {
    try {
      const params = {
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), days), 'yyyy-MM-dd')
      };

      if (subcalendarId) {
        params.subcalendarId = subcalendarId;
      }

      const events = await this.client.getEvents(params);
      
      return events
        .filter(event => event.custom?.booking_status !== 'cancelled')
        .sort((a, b) => new Date(a.start_dt) - new Date(b.start_dt))
        .map(event => ({
          bookingId: event.id,
          title: event.title,
          startTime: event.start_dt,
          endTime: event.end_dt,
          daysUntil: Math.ceil((new Date(event.start_dt) - new Date()) / (1000 * 60 * 60 * 24)),
          customerInfo: {
            name: event.custom?.customer_name,
            email: event.custom?.customer_email,
            phone: event.custom?.customer_phone
          },
          status: event.custom?.booking_status || 'confirmed'
        }));
    } catch (error) {
      throw new Error(`Failed to get upcoming bookings: ${error.message}`);
    }
  }

  async getAvailableTimeSlots(subcalendarId, date, slotDuration = 60, workingHours = { start: 9, end: 17 }) {
    try {
      const targetDate = date || new Date();
      const events = await this.client.getEvents({
        startDate: format(targetDate, 'yyyy-MM-dd'),
        endDate: format(targetDate, 'yyyy-MM-dd'),
        subcalendarId: subcalendarId
      });

      const availableSlots = [];
      const dayStart = new Date(targetDate);
      dayStart.setHours(workingHours.start, 0, 0, 0);
      
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(workingHours.end, 0, 0, 0);

      let currentTime = new Date(dayStart);

      while (currentTime < dayEnd) {
        const slotEnd = addMinutes(currentTime, slotDuration);
        
        if (slotEnd <= dayEnd) {
          const isAvailable = !events.some(event => {
            const eventStart = new Date(event.start_dt);
            const eventEnd = new Date(event.end_dt);
            
            const eventStartWithBuffer = addMinutes(eventStart, -this.bookingDefaults.bufferMinutes);
            const eventEndWithBuffer = addMinutes(eventEnd, this.bookingDefaults.bufferMinutes);
            
            return (currentTime < eventEndWithBuffer && slotEnd > eventStartWithBuffer);
          });

          if (isAvailable) {
            availableSlots.push({
              start: format(currentTime, "yyyy-MM-dd'T'HH:mm:ss"),
              end: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
              duration: slotDuration,
              available: true
            });
          }
        }

        currentTime = addMinutes(currentTime, 30);
      }

      return availableSlots;
    } catch (error) {
      throw new Error(`Failed to get available time slots: ${error.message}`);
    }
  }

  formatNotes(customerInfo, additionalNotes) {
    let notes = '';
    
    if (customerInfo) {
      notes += `Customer Information:\n`;
      notes += `Name: ${customerInfo.name || 'N/A'}\n`;
      notes += `Email: ${customerInfo.email || 'N/A'}\n`;
      notes += `Phone: ${customerInfo.phone || 'N/A'}\n`;
    }

    if (additionalNotes) {
      notes += `\nNotes:\n${additionalNotes}`;
    }

    return notes;
  }

  async generateBookingReport(startDate, endDate, subcalendarId = null) {
    try {
      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      };

      if (subcalendarId) {
        params.subcalendarId = subcalendarId;
      }

      const events = await this.client.getEvents(params);
      
      const report = {
        period: {
          start: startDate,
          end: endDate
        },
        totalBookings: events.length,
        confirmedBookings: events.filter(e => e.custom?.booking_status !== 'cancelled').length,
        cancelledBookings: events.filter(e => e.custom?.booking_status === 'cancelled').length,
        bookingsByDay: {},
        totalHours: 0,
        bookings: []
      };

      events.forEach(event => {
        const date = format(new Date(event.start_dt), 'yyyy-MM-dd');
        report.bookingsByDay[date] = (report.bookingsByDay[date] || 0) + 1;
        
        const duration = differenceInMinutes(new Date(event.end_dt), new Date(event.start_dt));
        report.totalHours += duration / 60;

        report.bookings.push({
          id: event.id,
          title: event.title,
          date: date,
          time: format(new Date(event.start_dt), 'HH:mm'),
          duration: duration,
          status: event.custom?.booking_status || 'confirmed'
        });
      });

      return report;
    } catch (error) {
      throw new Error(`Failed to generate booking report: ${error.message}`);
    }
  }
}

module.exports = BookingManager;