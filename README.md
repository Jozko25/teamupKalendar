# Glamora Studio - TeamUp Booking System

AI-powered booking system for Glamora Studio with voice assistance integration and Slovak language support.

## 🚀 Deployment on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy?template=https://github.com/Jozko25/teamupKalendar)

## Features

- 🗓️ **TeamUp Calendar Integration** - Full calendar management
- 🎙️ **ElevenLabs Voice Synthesis** - Natural Slovak voice responses
- 🤖 **AI Receptionist** - Intelligent booking assistant
- 📱 **WhatsApp Integration Ready** - Callback request handling
- ⏰ **Smart Scheduling** - Staff availability management
- 🇸🇰 **Slovak Language** - Native Slovak communication

## Environment Variables for Railway

Add these in Railway's Variables tab:

```env
# REQUIRED - TeamUp Configuration
TEAMUP_API_KEY=your_teamup_api_key_here
TEAMUP_CALENDAR_KEY=your_share_link_key_here  # Must be edit-enabled share link!

# OPTIONAL - ElevenLabs for Voice
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id  # Use Slovak voice
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# Railway will set these automatically
PORT=3000
NODE_ENV=production
```

## Setup Instructions

### 1. TeamUp Calendar Setup

1. **Get API Key**
   - Go to https://teamup.com/api-keys/request
   - Fill form and get key instantly

2. **Create Share Link** (CRITICAL!)
   - In your TeamUp calendar, go to Sharing
   - Create new share link with **"Upraviť"** (Edit) permissions
   - Copy the share key (e.g., `ks65ktirgttv3hdobb`)
   - Use this as `TEAMUP_CALENDAR_KEY` NOT the calendar key!

3. **Create Subcalendars**
   - Janka - Kaderníčka
   - Nika - Kaderníčka
   - Lívia - Kaderníčka
   - Dominika - Kozmetička

### 2. Railway Deployment

1. Fork this repo to your GitHub
2. Go to [Railway](https://railway.app)
3. New Project → Deploy from GitHub repo
4. Select `teamupKalendar`
5. Add environment variables
6. Railway auto-deploys on push

### 3. Update Subcalendar IDs

After deployment, get your subcalendar IDs:
```bash
curl https://your-app.railway.app/api/subcalendars
```

Update in `config.js` if needed and push to GitHub.

## API Endpoints

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings?date=2025-09-16` - List bookings
- `GET /api/bookings/:id` - Get specific booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Availability
- `GET /api/availability/slots?date=2025-09-16&service=Strihanie` - Get slots

### System
- `GET /api/subcalendars` - List subcalendars
- `GET /api/health` - Health check

## Staff Schedule Configuration

### Kaderníčky (Hairdressers)
- **Janka**: Mon-Tue 12:00-18:00, Wed-Fri 9:00-15:00
- **Nika**: Mon-Tue 9:00-15:00, Wed-Thu 12:00-18:00, Fri 9:00-15:00
- **Lívia**: Mon 12:00-18:00, Tue 10:00-18:00, Wed-Fri 9:00-15:00

### Kozmetička (Cosmetician)
- **Dominika**: Mon-Tue 9:00-15:00, Wed-Thu 12:00-18:00, Fri 9:00-15:00

## Services & Duration

### Hair Services
- Strihanie: 1h
- Farbenie korienkov: 1.5h
- Melír: 3-4h
- Balayage: 3.5-4h
- Airtouch: 5-6h
- Svadobný účes: 2h

### Cosmetic Services
- Klasické ošetrenie: 1h 15min
- Úprava obočia: 30min
- Lash lift: 45min
- Permanentný makeup: 3-4h

## Testing the API

Create a booking:
```bash
curl -X POST https://your-app.railway.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Strihanie - Jana Nováková",
    "subcalendarId": 14791751,
    "startTime": "2025-09-20T10:00:00",
    "endTime": "2025-09-20T11:00:00",
    "who": "Jana Nováková",
    "notes": "Strihanie a fúkanie"
  }'
```

## Troubleshooting

### "Login required" error
- You're using calendar key instead of share link key
- Share link doesn't have edit permissions

### Events not appearing
- Check you're viewing the correct calendar
- Ensure subcalendars are enabled/visible
- Verify API response for booking ID

### 403 Forbidden
- API key doesn't match the share link
- Share link is read-only

## Support

For issues: glamora@atomicmail.io

## License

Private - Glamora Studio © 2025