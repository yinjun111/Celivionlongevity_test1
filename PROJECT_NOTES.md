# NAD+ Longevity Website - Project Documentation

## Project Overview
This is a complete website for NAD+ Longevity, a premium cellular wellness and longevity clinic. The website was created based on design mockups provided in the `/Webpages/` folder.

## Website Structure

### Created Files
1. **index.html** - Homepage with hero section
2. **about.html** - About Us page with mission statement
3. **services.html** - Services page with treatment options
4. **membership.html** - Membership tiers page
5. **contact.html** - Contact form and clinic information
6. **login.html** - Member login portal
7. **styles.css** - Shared stylesheet for all pages

### Design Reference Images (in Webpages folder)
- Index.png - Homepage hero design
- About us.png - Mission statement and brand positioning
- Services.png - Treatment offerings layout
- Members.png - Membership tier structure
- Contact us.png - Contact form and information
- login.png - Login portal design

## Key Features

### Navigation
- All pages have a consistent navigation bar with links to:
  - About Us (about.html)
  - Services (services.html)
  - Medical Aesthetics (currently links to services.html)
  - Membership (membership.html)
  - Contact Us (contact.html)
  - Login (login.html)

### Page Content

**Index Page:**
- Hero section with "5 REASONS WOMEN LOVE NAD+" headline
- Subtitle: "Energy · Skin · Focus · Cellular Repair · Metabolism Balance"
- Call-to-action "BOOK NOW" button
- Visual representation of NAD+ bottles

**About Page:**
- Dark-themed navigation
- Mission statement: "Redefining the Standard"
- Two-column layout with content and visual elements
- Additional sections on approach and why choose us

**Services Page:**
- Four service cards:
  1. NAD+ IV Therapy (60-90 min)
  2. Cellular Optimization (90-120 min)
  3. Longevity Protocol (120 min)
  4. Cognitive Enhancement (75 min)
- Each card includes duration and key benefits
- CTA section for booking consultation

**Membership Page:**
- Three membership tiers:
  1. Essential - $299/month
  2. Elite - $599/month (featured)
  3. Platinum - $1,299/month
- Each tier lists specific benefits
- Join Now buttons linking to contact page

**Contact Page:**
- Contact form with fields: First Name, Last Name, Email, Phone, Message
- Clinic address: 123 Wellness Boulevard, Suite 500, Beverly Hills, CA 90210
- Phone: (310) 555-0123
- Email: hello@celivionlongevity.com
- Business hours table

**Login Page:**
- Simple login form with email and password fields
- "Forgot password?" link
- "Sign up" link directing to membership page

## Technical Details

### Styling Approach
- Mobile-responsive design using CSS Grid and Flexbox
- Consistent color scheme:
  - Primary text: #1a1a1a
  - Secondary text: #666
  - Accent colors: #d2691e (orange), #4169e1 (blue)
  - Background: Light grays and whites
- Typography: Georgia/Times New Roman serif font family
- Button styles: Primary (black background) and Secondary (outlined)

### Responsive Breakpoints
- Desktop: Full grid layouts
- Tablet/Mobile (<968px): Single column layouts

## How to Use

### Viewing the Website
1. Open `index.html` in any web browser
2. Navigate between pages using the top menu bar
3. All internal links are properly connected

### Customization Notes
- Update contact information in contact.html
- Replace placeholder content with actual clinic details
- Add real images by modifying the CSS background properties
- Forms currently have no backend - add form handling as needed
- Login functionality requires backend implementation

## Next Steps / TODO
- [ ] Add backend functionality for contact form
- [ ] Implement user authentication for login page
- [ ] Add real images/photos to replace CSS placeholders
- [ ] Set up hosting and domain
- [ ] Add analytics tracking
- [ ] Optimize for SEO (meta tags, descriptions, etc.)
- [ ] Add booking system integration
- [ ] Create member portal functionality
- [ ] Add testimonials/reviews section
- [ ] Consider adding a blog section for content marketing

## File Dependencies
- All HTML files depend on `styles.css`
- All pages are standalone and can be accessed directly
- Navigation links are relative paths (no subdirectories)

## Notes
- Website is purely frontend (HTML/CSS)
- No JavaScript currently implemented
- Forms are non-functional without backend
- Design focuses on luxury wellness brand aesthetic
- Mobile-first responsive design implemented

---

## Booking System (NEW)

### Overview
A complete reservation system with Google Calendar integration has been implemented. Clients can book appointments online, and appointments automatically sync to Google Calendar.

### Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (local development)
- **API**: Google Calendar API
- **Email**: Nodemailer (optional)

### New Files Created

**Frontend:**
- `booking.html` - Multi-step booking interface
- `backend/public/booking.js` - Frontend booking logic
- Updated `styles.css` with booking-specific styles

**Backend Structure:**
```
backend/
├── package.json - Dependencies and scripts
├── .env.example - Environment variable template
├── .gitignore - Git ignore rules
├── server.js - Main Express server
├── README.md - Detailed setup documentation
├── config/
│   ├── database.js - SQLite database setup
│   └── googleAuth.js - Google OAuth configuration
├── routes/
│   ├── bookings.js - Booking API routes
│   └── calendar.js - Calendar auth routes
├── controllers/
│   └── bookingController.js - Booking business logic
├── models/
│   └── Reservation.js - Database model
├── services/
│   ├── googleCalendar.js - Calendar API integration
│   └── emailService.js - Email notifications
└── public/
    └── booking.js - Frontend JavaScript
```

### Features

1. **Multi-Step Booking Process:**
   - Step 1: Service selection (4 NAD+ treatments)
   - Step 2: Date & time slot selection
   - Step 3: Client information
   - Step 4: Review and confirm

2. **Real-Time Availability:**
   - Checks database for existing bookings
   - Shows only available time slots
   - Prevents double-booking

3. **Google Calendar Integration:**
   - OAuth 2.0 authentication
   - Auto-creates calendar events
   - Updates events when booking changes
   - Deletes events when booking cancelled
   - Sends invites to client email

4. **Email Confirmations:**
   - Sends booking confirmation
   - Includes appointment details
   - Cancellation notifications

5. **Database:**
   - Stores all reservations
   - Tracks booking status
   - Links to Google Calendar events
   - Service catalog
   - Availability schedule

### API Endpoints

**Bookings:**
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/:id` - Get specific booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/available-slots` - Get available times

**Calendar:**
- `GET /api/calendar/auth/status` - Check auth status
- `GET /api/calendar/auth/url` - Get OAuth URL
- `GET /api/calendar/auth/callback` - OAuth callback

### Running the System

**Quick Start:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Access:**
- Website: http://localhost:3000/index.html
- Booking: http://localhost:3000/booking.html
- API: http://localhost:3000/api/bookings

### Setup Requirements

1. **Basic Setup (No Calendar/Email):**
   - Just run `npm install` and `npm run dev`
   - Bookings save to local database
   - Works immediately for testing

2. **With Google Calendar:**
   - Create Google Cloud project
   - Enable Calendar API
   - Create OAuth credentials
   - Add credentials to `.env`
   - Authenticate via auth URL

3. **With Email Notifications:**
   - Use Gmail with App Password
   - Add credentials to `.env`
   - Emails sent automatically

### Default Services

Pre-configured in database:
1. NAD+ IV Therapy - 75 minutes
2. Cellular Optimization - 105 minutes
3. Longevity Protocol - 120 minutes
4. Cognitive Enhancement - 75 minutes

### Default Business Hours

Monday - Friday: 9:00 AM - 5:00 PM
Saturday: 10:00 AM - 3:00 PM
Sunday: Closed (can book by appointment)

### Important Files

- `backend/README.md` - Complete setup guide
- `QUICK_START.md` - 5-minute quick start
- `backend/.env.example` - Configuration template
- `backend/database.db` - SQLite database (created on first run)
- `backend/token.json` - Google auth token (created after auth)

### Security Notes

- `.env` file is git-ignored (contains secrets)
- `token.json` is git-ignored (Google credentials)
- `database.db` is git-ignored (local data)
- All sensitive data via environment variables

### Production Considerations

- Switch from SQLite to PostgreSQL
- Use production OAuth credentials
- Enable HTTPS
- Set up proper hosting (Heroku, AWS, etc.)
- Add rate limiting
- Implement admin authentication
- Set up monitoring

### Troubleshooting

See `backend/README.md` for:
- Port conflicts
- Database errors
- Calendar sync issues
- Email problems
- Common errors and solutions

---

## Complete File List

**Frontend Pages:**
- index.html
- about.html
- services.html
- membership.html
- contact.html
- login.html
- booking.html *(new)*

**Stylesheets:**
- styles.css (includes booking styles)

**Backend:**
- backend/ directory with full Node.js application *(new)*

**Documentation:**
- PROJECT_NOTES.md (this file)
- QUICK_START.md *(new)*
- backend/README.md *(new)*

**Configuration:**
- Webpages/ (design references)
- .gitignore (updated for backend)
