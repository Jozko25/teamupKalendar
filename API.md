# TeamUp Booking API Documentation

REST API server for managing TeamUp calendar bookings. You send POST requests to this server, and it forwards them to the TeamUp calendar API.

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Server runs on:** `http://localhost:3000`

3. **Make POST requests to create bookings:**
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Client Meeting",
       "subcalendarId": "your_subcalendar_id",
       "startTime": "2024-12-20T10:00:00",
       "duration": 60,
       "customerInfo": {
         "name": "John Doe",
         "email": "john@example.com",
         "phone": "+1-555-0123"
       }
     }'
   ```

## API Endpoints

### 📋 Booking Management

#### Create Booking
```http
POST /api/bookings
```
**Request Body:**
```json
{
  "title": "Meeting Title",
  "subcalendarId": "subcalendar_id",
  "startTime": "2024-12-20T10:00:00",
  "duration": 60,
  "customerInfo": {
    "name": "Customer Name",
    "email": "customer@email.com", 
    "phone": "+1-555-0123"
  },
  "notes": "Additional notes",
  "location": "Meeting Room A",
  "reminder": true
}
```

#### Get Booking
```http
GET /api/bookings/:id
```

#### Update Booking  
```http
PUT /api/bookings/:id
```
**Request Body:** (any fields to update)
```json
{
  "title": "Updated Title",
  "startTime": "2024-12-20T11:00:00",
  "customerInfo": {
    "name": "Updated Name"
  }
}
```

#### Cancel Booking
```http
DELETE /api/bookings/:id
```
**Request Body:**
```json
{
  "reason": "Cancellation reason"
}
```

#### Reschedule Booking
```http
POST /api/bookings/:id/reschedule
```
**Request Body:**
```json
{
  "newStartTime": "2024-12-20T14:00:00",
  "newDuration": 90
}
```

### 🔍 Search & Filter

#### Get Bookings by Date
```http
GET /api/bookings?date=2024-12-20
```

#### Get Upcoming Bookings
```http
GET /api/bookings?upcoming=7
```

#### Get Customer Bookings
```http
GET /api/bookings?customer=customer@email.com
```

### ✅ Availability

#### Check Time Slot Availability
```http
GET /api/availability?subcalendarId=sub_id&startTime=2024-12-20T10:00:00&duration=60
```

#### Get Available Time Slots
```http
GET /api/availability/slots?subcalendarId=sub_id&date=2024-12-20&duration=60&workingHoursStart=9&workingHoursEnd=17
```

### 📊 Reports

#### Generate Booking Report
```http
GET /api/reports/bookings?startDate=2024-12-01&endDate=2024-12-31&subcalendarId=sub_id
```

### 🗓️ Calendar

#### Get Subcalendars
```http
GET /api/subcalendars
```

## Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-12-20T10:00:00.000Z"
}
```

## Example Usage Flow

1. **Get available subcalendars:**
   ```bash
   curl http://localhost:3000/api/subcalendars
   ```

2. **Check available slots:**
   ```bash
   curl "http://localhost:3000/api/availability/slots?subcalendarId=123&date=2024-12-20"
   ```

3. **Create booking:**
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -d '{"title":"Meeting","subcalendarId":"123","startTime":"2024-12-20T10:00:00"}'
   ```

4. **Get booking confirmation:**
   ```bash
   curl http://localhost:3000/api/bookings/booking_id
   ```

## Testing

Use the `test-api.http` file with REST Client extension in VS Code, or use curl commands to test all endpoints.

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS enabled
- Helmet security headers
- Input validation
- Error handling