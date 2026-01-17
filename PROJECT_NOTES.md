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
