const axios = require('axios');
const { format, parseISO, addDays, startOfDay, endOfDay } = require('date-fns');

class TeamupClient {
  constructor(apiKey, calendarKey) {
    this.apiKey = apiKey;
    this.calendarKey = calendarKey;
    this.baseURL = 'https://api.teamup.com';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Teamup-Token': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async getSubcalendars() {
    try {
      const response = await this.axiosInstance.get(`/${this.calendarKey}/subcalendars`);
      return response.data.subcalendars;
    } catch (error) {
      throw new Error(`Failed to get subcalendars: ${error.message}`);
    }
  }

  async getEvents(params = {}) {
    try {
      const defaultParams = {
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
      };
      
      const queryParams = { ...defaultParams, ...params };
      const response = await this.axiosInstance.get(`/${this.calendarKey}/events`, { params: queryParams });
      return response.data.events;
    } catch (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  async getEvent(eventId) {
    try {
      const response = await this.axiosInstance.get(`/${this.calendarKey}/events/${eventId}`);
      return response.data.event;
    } catch (error) {
      throw new Error(`Failed to get event: ${error.message}`);
    }
  }

  async createEvent(eventData) {
    try {
      const response = await this.axiosInstance.post(`/${this.calendarKey}/events`, eventData);
      return response.data.event;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  async updateEvent(eventId, eventData) {
    try {
      const response = await this.axiosInstance.put(`/${this.calendarKey}/events/${eventId}`, eventData);
      return response.data.event;
    } catch (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

  async deleteEvent(eventId) {
    try {
      await this.axiosInstance.delete(`/${this.calendarKey}/events/${eventId}`);
      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  async searchEvents(searchQuery) {
    try {
      const response = await this.axiosInstance.get(`/${this.calendarKey}/events`, {
        params: { query: searchQuery }
      });
      return response.data.events;
    } catch (error) {
      throw new Error(`Failed to search events: ${error.message}`);
    }
  }

  async getAvailableSlots(subcalendarId, date, duration = 60) {
    try {
      const targetDate = date || new Date();
      const dayStart = format(startOfDay(targetDate), "yyyy-MM-dd'T'HH:mm:ss");
      const dayEnd = format(endOfDay(targetDate), "yyyy-MM-dd'T'HH:mm:ss");
      
      const events = await this.getEvents({
        startDate: format(targetDate, 'yyyy-MM-dd'),
        endDate: format(targetDate, 'yyyy-MM-dd'),
        subcalendarId: subcalendarId
      });

      const availableSlots = [];
      const slotDuration = duration;
      let currentTime = new Date(dayStart);
      currentTime.setHours(9, 0, 0, 0);
      
      const endTime = new Date(dayStart);
      endTime.setHours(17, 0, 0, 0);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
        
        const isAvailable = !events.some(event => {
          const eventStart = new Date(event.start_dt);
          const eventEnd = new Date(event.end_dt);
          return (currentTime < eventEnd && slotEnd > eventStart);
        });

        if (isAvailable) {
          availableSlots.push({
            start: format(currentTime, "yyyy-MM-dd'T'HH:mm:ss"),
            end: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
            duration: slotDuration
          });
        }

        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }

      return availableSlots;
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }
}

module.exports = TeamupClient;