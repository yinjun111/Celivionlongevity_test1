# NAD+ Longevity Booking System

Complete reservation system with Google Calendar integration for NAD+ Longevity wellness center.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite (local development) → PostgreSQL (production ready)
- **Google API**: Google Calendar API for appointment syncing
- **Email**: Nodemailer for confirmation emails

## Features

- ✅ Multi-step booking form with service selection
- ✅ Real-time availability checking
- ✅ Google Calendar integration
- ✅ Email confirmations
- ✅ Admin API for managing bookings
- ✅ SQLite database with reservation tracking
- ✅ Responsive design

---

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Google Cloud account (for Calendar API)
- Gmail account (optional, for email notifications)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./database.db

# Google Calendar API (see setup below)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/auth/callback
GOOGLE_CALENDAR_ID=primary

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Set Up Google Calendar API

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

#### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure OAuth consent screen if prompted:
   - User Type: External (for testing) or Internal
   - App name: NAD+ Longevity Booking
   - User support email: your email
   - Developer contact: your email
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: NAD+ Booking System
   - Authorized redirect URIs: `http://localhost:3000/api/calendar/auth/callback`
5. Copy the Client ID and Client Secret to your `.env` file

#### Step 3: Authenticate the Application

1. Start the server (see below)
2. Visit: `http://localhost:3000/api/calendar/auth/url`
3. Copy the returned auth URL and open it in your browser
4. Sign in with your Google account
5. Grant calendar permissions
6. You'll be redirected to a success page
7. A `token.json` file will be created in the backend directory

### 4. Set Up Email Notifications (Optional)

For Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
3. Add to `.env`:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_16_character_app_password
   ```

---

## Running the Application

### Development Mode

Start the backend server with auto-reload:

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

### Production Mode

```bash
cd backend
npm start
```

### Access the Application

- **Frontend**: Open `http://localhost:3000/index.html` in your browser
- **Booking Page**: `http://localhost:3000/booking.html`
- **API Health Check**: `http://localhost:3000/health`
- **API Documentation**: `http://localhost:3000/`

---

## API Endpoints

### Bookings

- `GET /api/bookings` - Get all bookings
  - Query params: `?status=confirmed&date=2024-01-15`
- `GET /api/bookings/:id` - Get specific booking
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/bookings/available-slots` - Get available time slots
  - Query params: `?date=2024-01-15&duration=60`

### Calendar Authentication

- `GET /api/calendar/auth/status` - Check if authenticated
- `GET /api/calendar/auth/url` - Get Google OAuth URL
- `GET /api/calendar/auth/callback` - OAuth callback (auto-handled)

---

## Testing the System

### 1. Test Without Google Calendar

The system will work without Calendar integration. Bookings will be stored in the database, but won't sync to Google Calendar.

### 2. Test Booking Flow

1. Open `http://localhost:3000/booking.html`
2. Select a service (e.g., "NAD+ IV Therapy")
3. Choose a date (tomorrow or later)
4. Select an available time slot
5. Fill in your information
6. Review and confirm

### 3. Test API with Postman/Thunder Client

Create a booking:

```bash
POST http://localhost:3000/api/bookings
Content-Type: application/json

{
  "client_name": "John Doe",
  "email": "john@example.com",
  "phone": "(310) 555-0123",
  "service_type": "NAD+ IV Therapy",
  "appointment_date": "2024-01-20",
  "appointment_time": "14:00",
  "duration": 75,
  "notes": "First time client"
}
```

Get all bookings:

```bash
GET http://localhost:3000/api/bookings
```

Get available slots:

```bash
GET http://localhost:3000/api/bookings/available-slots?date=2024-01-20&duration=75
```

---

## Database Schema

### Reservations Table

```sql
- id: INTEGER PRIMARY KEY
- client_name: TEXT
- email: TEXT
- phone: TEXT
- service_type: TEXT
- appointment_date: TEXT
- appointment_time: TEXT
- duration: INTEGER (in minutes)
- status: TEXT (pending, confirmed, cancelled)
- google_event_id: TEXT (nullable)
- notes: TEXT
- created_at: DATETIME
- updated_at: DATETIME
```

### Services Table

Pre-populated with:
- NAD+ IV Therapy (75 min)
- Cellular Optimization (105 min)
- Longevity Protocol (120 min)
- Cognitive Enhancement (75 min)

---

## Troubleshooting

### Server won't start

```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### Database errors

```bash
# Delete and recreate database
rm backend/database.db
# Restart server - it will recreate the database
npm run dev
```

### Google Calendar not syncing

1. Check if authenticated: `http://localhost:3000/api/calendar/auth/status`
2. Re-authenticate if needed: Get URL from `/api/calendar/auth/url`
3. Check console logs for errors
4. Verify `token.json` exists in backend directory

### Email not sending

1. Verify `.env` EMAIL settings
2. For Gmail, ensure App Password is correct (not regular password)
3. Check console logs for SMTP errors
4. System will still work without email - it's optional

---

## Production Deployment

### Switching to PostgreSQL

1. Install pg:
   ```bash
   npm install pg
   ```

2. Update `config/database.js` to use PostgreSQL instead of SQLite

3. Set DATABASE_URL in production environment:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use production Google OAuth credentials
- Update `GOOGLE_REDIRECT_URI` to production domain
- Update `FRONTEND_URL` to production domain
- Use secure email credentials

### Recommended Hosting

- **Backend**: Heroku, DigitalOcean, AWS, Railway
- **Database**: PostgreSQL on same platform or managed service
- **Frontend**: Can be served from same Express server (already configured)

---

## Security Notes

- Never commit `.env` file to git
- Never commit `token.json` to git
- Use environment variables for all sensitive data
- In production, use HTTPS for all endpoints
- Implement rate limiting for API endpoints
- Add authentication for admin endpoints
- Validate and sanitize all user inputs

---

## Support

For issues or questions:
- Check console logs first
- Review this README
- Check `PROJECT_NOTES.md` in parent directory

---

## License

Proprietary - NAD+ Longevity © 2024
