module.exports = {
  // ElevenLabs Configuration
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'default_voice_id',
    modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true
  },

  // AI Reception Configuration
  aiReception: {
    systemPrompt: `Si recepcionistka v Glamora Studiu. 

OTVÁRACIE HODINY:
- Pondelok až Piatok: 9:00 – 18:00
- Ranná smena: 9:00 – 15:00
- Poobedná smena: 12:00 – 18:00

PERSONÁL A PRACOVNÉ DNI:
Kaderníčky:
- Janka: pondelok (poobede), utorok (poobede), streda (ráno), štvrtok (ráno), piatok (ráno)
- Nika: pondelok (ráno), utorok (ráno), streda (poobede), štvrtok (poobede), piatok (ráno)
- Lívia: pondelok (poobede), utorok (10:00 – 18:00), streda (ráno), štvrtok (ráno), piatok (ráno)

Kozmetička:
- Dominika: pondelok (ráno), utorok (ráno), streda (poobede), štvrtok (poobede), piatok (ráno)

PRAVIDLÁ:
1. Vždy sa opýtaj na meno a priezvisko zákazníka
2. Vždy si vypýtaj telefónny kontakt
3. Ak zákazník chce konkrétnu kaderníčku/kozmetičku, rešpektuj to
4. Pri dovolenke nesmieš objednávať termíny pre danú osobu
5. Ak zákazníčka povie, že chce hovoriť s človekom, povedz že pošleš správu na WhatsApp aby personál zavolal späť
6. Buď milá, profesionálna a zdvorilá
7. Komunikuj v slovenčine
8. Potvrď všetky detaily rezervácie pred jej vytvorením

DÔLEŽITÉ:
- Neobjednávaj termíny mimo pracovných hodín
- Neobjednávaj termíny pre zamestnanca, ktorý v daný deň nepracuje
- Pri nejasnostiach sa radšej opýtaj zákazníka na spresnenie`,

    greetingMessage: "Dobrý deň, vitajte v Glamora Studiu! Ako vám môžem pomôcť?",
    
    // Response templates
    responseTemplates: {
      confirmBooking: "Výborne, rezervujem pre vás termín {date} o {time} u {staff}. Môžem to takto potvrdiť?",
      askForContact: "Prosím o vaše meno, priezvisko a telefónne číslo pre potvrdenie rezervácie.",
      staffUnavailable: "Ospravedlňujem sa, ale {staff} v tento termín nie je k dispozícii. Môžem vám ponúknuť iný termín?",
      outsideHours: "Ospravedlňujem sa, ale tento čas je mimo našich otváracích hodín. Sme otvorení pondelok až piatok od 9:00 do 18:00."
    }
  },

  // Service Definitions with Duration in minutes
  services: {
    hair: {
      "Farbenie korienkov": { duration: 90, category: "farbenie" },
      "Farbenie korienkov s podstrihnutím": { duration: 90, category: "farbenie" },
      "Strihanie, umytie, fúkanie, česanie": { duration: 60, category: "strih" },
      "Zložitejší účes": { duration: 90, category: "účes" },
      "Svadobný účes": { duration: 120, category: "účes" },
      "Zosvetlenie/odfarbovanie": { duration: 180, category: "farbenie" },
      "Melír": { duration: 180, category: "farbenie" },
      "Melír extra dlhé vlasy": { duration: 240, category: "farbenie" },
      "Mikro melír": { duration: 360, category: "farbenie" }, // 4-6h, using 6h
      "Airtouch": { duration: 360, category: "farbenie" }, // 5-6h, using 6h
      "Balayage": { duration: 210, category: "farbenie" },
      "Balayage dlhé vlasy": { duration: 240, category: "farbenie" },
      "Úplné odfarbenie": { duration: 360, category: "farbenie" },
      "Vyrovnávacia vlasová kúra": { duration: 480, category: "kúra" }, // 6-8h, using 8h
      "Predlžovanie vlasov - odpájanie": { duration: 150, category: "predlžovanie" },
      "Predlžovanie vlasov - napájanie": { duration: 240, category: "predlžovanie" }, // 3-4h, using 4h
      "Strih + kúra": { duration: 90, category: "strih" }
    },
    cosmetics: {
      "Klasické kozmetické ošetrenie": { duration: 75, category: "ošetrenie" },
      "Farbenie, úprava a ošetrenie obočia": { duration: 90, category: "obočie" },
      "Samostatné farbenie a úprava obočia": { duration: 30, category: "obočie" },
      "Úprava a farbenie mihalníc": { duration: 30, category: "mihalnice" },
      "Farbenie a úprava mihalníc + obočia": { duration: 60, category: "komplet" },
      "Laminácia obočia s farbením": { duration: 45, category: "obočie" },
      "Laminácia obočia + lash lift": { duration: 75, category: "komplet" },
      "Samostatný lash lift": { duration: 45, category: "mihalnice" },
      "Permanentný make-up obočia": { duration: 180, category: "permanentný" },
      "Permanentný make-up pier": { duration: 240, category: "permanentný" },
      "Permanentný make-up očných liniek": { duration: 180, category: "permanentný" },
      "Líčenie štandard": { duration: 60, category: "líčenie" },
      "Náročné líčenie": { duration: 90, category: "líčenie" },
      "Svadobné líčenie": { duration: 90, category: "líčenie" }
    }
  },

  // Staff Configuration
  staff: {
    hairdressers: {
      "Janka": {
        id: "janka_hairdresser",
        subcalendarId: 14791751, // Calendar 1 - rename to Janka
        schedule: {
          monday: { shift: 2, start: "12:00", end: "18:00" },
          tuesday: { shift: 2, start: "12:00", end: "18:00" },
          wednesday: { shift: 1, start: "9:00", end: "15:00" },
          thursday: { shift: 1, start: "9:00", end: "15:00" },
          friday: { shift: 1, start: "9:00", end: "15:00" }
        },
        specializations: ["farbenie", "strih", "účes"]
      },
      "Nika": {
        id: "nika_hairdresser",
        subcalendarId: 14791752, // Calendar 2 - rename to Nika
        schedule: {
          monday: { shift: 1, start: "9:00", end: "15:00" },
          tuesday: { shift: 1, start: "9:00", end: "15:00" },
          wednesday: { shift: 2, start: "12:00", end: "18:00" },
          thursday: { shift: 2, start: "12:00", end: "18:00" },
          friday: { shift: 1, start: "9:00", end: "15:00" }
        },
        specializations: ["strih", "farbenie", "kúra"]
      },
      "Lívia": {
        id: "livia_hairdresser",
        subcalendarId: null, // Create new subcalendar for Lívia
        schedule: {
          monday: { shift: 2, start: "12:00", end: "18:00" },
          tuesday: { shift: "custom", start: "10:00", end: "18:00" },
          wednesday: { shift: 1, start: "9:00", end: "15:00" },
          thursday: { shift: 1, start: "9:00", end: "15:00" },
          friday: { shift: 1, start: "9:00", end: "15:00" }
        },
        specializations: ["balayage", "airtouch", "predlžovanie"]
      }
    },
    cosmetician: {
      "Dominika": {
        id: "dominika_cosmetician",
        subcalendarId: null, // Create new subcalendar for Dominika
        schedule: {
          monday: { shift: 1, start: "9:00", end: "15:00" },
          tuesday: { shift: 1, start: "9:00", end: "15:00" },
          wednesday: { shift: 2, start: "12:00", end: "18:00" },
          thursday: { shift: 2, start: "12:00", end: "18:00" },
          friday: { shift: 1, start: "9:00", end: "15:00" }
        },
        specializations: ["ošetrenie", "permanentný", "líčenie", "obočie", "mihalnice"]
      }
    }
  },

  // Business Hours
  businessHours: {
    monday: { open: "9:00", close: "18:00" },
    tuesday: { open: "9:00", close: "18:00" },
    wednesday: { open: "9:00", close: "18:00" },
    thursday: { open: "9:00", close: "18:00" },
    friday: { open: "9:00", close: "18:00" },
    saturday: { closed: true },
    sunday: { closed: true }
  },

  // Booking Rules
  bookingRules: {
    minAdvanceBooking: 60, // Minimum minutes in advance to book
    maxAdvanceBooking: 30 * 24 * 60, // Maximum 30 days in advance
    bufferTimeBetweenBookings: 15, // Buffer time in minutes between bookings
    allowOverbooking: false,
    requirePhoneConfirmation: true,
    sendReminders: true,
    reminderTimeBefore: 24 * 60 // Send reminder 24 hours before appointment
  },

  // TeamUp API Configuration
  teamup: {
    apiKey: process.env.TEAMUP_API_KEY,
    calendarKey: process.env.TEAMUP_CALENDAR_KEY,
    apiBaseUrl: 'https://api.teamup.com'
  },

  // WhatsApp Integration (for future use)
  whatsapp: {
    enabled: false,
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER,
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL
  },

  // Application Settings
  app: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    timezone: 'Europe/Bratislava',
    language: 'sk',
    currency: 'EUR'
  }
};