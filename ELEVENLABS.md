# ElevenLabs Voice Assistant Integration

This project includes a professional Slovak voice assistant for booking automation using ElevenLabs Conversational AI.

## Setup

### Created Components

**Tool ID:** `tool_1801k45mpwh0emms22rj0yazq0ka`
**Agent ID:** `agent_2001k45mys7tf59bep4r39rk1emb`

### Agent Configuration

The Slovak booking assistant is configured with:

- **Language:** Slovak (sk) with female voice
- **Communication Style:** Professional, formal address (vykaním)
- **Voice Model:** eleven_turbo_v2_5
- **Conversation Flow:** Streamlined 2-step booking process

### Key Features

✅ **Professional Slovak Communication**
- Uses female form and formal address
- No unnecessary marketing phrases  
- Confirms phone numbers digit by digit
- Natural conversation endings

✅ **Efficient Booking Process**
1. Collects name and phone number
2. Gets preferred date/time
3. Confirms details
4. Creates booking via API
5. Confirms success and ends naturally

✅ **Technical Integration**
- Connected to TeamUp API webhook
- Handles booking creation automatically
- Supports interruptions (barge-in)
- Professional error handling

## Usage

### Connecting to Your API

1. **Update the webhook URL** in ElevenLabs tool settings
2. **Replace:** `https://your-railway-url.railway.app/api/bookings`
3. **With your deployed API URL**

### Conversation Example

```
Assistant: "Som hlasová asistentka pre rezervácie. Ako Vám môžem pomôcť s objednaním termínu?"

User: "Chcem si rezervovať termín"