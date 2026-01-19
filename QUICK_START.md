# Quick Start Guide

Get the NAD+ Longevity website with booking system running in 5 minutes!

## Prerequisites

- Node.js installed (check with `node --version`)
- Internet connection

## Quick Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

The default `.env` settings will work for local testing. Google Calendar and Email are optional.

### 3. Start the Server

```bash
npm run dev
```

You should see:
```
=================================
🚀 Server running on port 3000
📍 Local: http://localhost:3000
🌍 Environment: development
=================================
✓ Database initialized successfully
```

### 4. Open the Website

Open your browser and go to:
- **Homepage**: http://localhost:3000/index.html
- **Booking Page**: http://localhost:3000/booking.html

## Test the Booking System

1. Click "BOOK NOW" on the homepage
2. Select a service (e.g., "NAD+ IV Therapy")
3. Choose a date (tomorrow or any future date)
4. Pick a time slot
5. Fill in your information
6. Confirm booking

The booking will be saved to the local database at `backend/database.db`

## View Your Bookings

Visit the API endpoint to see all bookings:
```
http://localhost:3000/api/bookings
```

## Optional: Set Up Google Calendar

If you want bookings to sync to Google Calendar:

1. Follow the detailed setup in `backend/README.md` under "Set Up Google Calendar API"
2. Add your credentials to `.env`
3. Restart the server
4. Authenticate by visiting `http://localhost:3000/api/calendar/auth/url`

## Optional: Enable Email Confirmations

To send confirmation emails:

1. Use a Gmail account
2. Enable 2FA and create an App Password
3. Add to `.env`:
   ```
   EMAIL_USER=your@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```
4. Restart the server

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## What's Next?

- Read `backend/README.md` for detailed documentation
- Check `PROJECT_NOTES.md` for project overview
- Customize services in the database
- Configure business hours
- Set up production deployment

## Troubleshooting

**Port 3000 already in use?**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

**Database errors?**
```bash
# Delete and recreate
rm backend/database.db
npm run dev
```

**Need help?**
Check the console logs - they usually tell you what's wrong!

---

That's it! You're ready to start accepting bookings! 🎉
