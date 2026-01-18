const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
function createTransporter() {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email not configured. Skipping email sending.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
  });
}

/**
 * Send booking confirmation email
 */
async function sendConfirmationEmail(data) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email service not configured, skipping confirmation email');
    return { success: false, reason: 'not_configured' };
  }

  const { to, name, service, date, time } = data;

  const mailOptions = {
    from: `"NAD+ Longevity" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Booking Confirmation - NAD+ Longevity',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #1a1a1a;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
            background: #f5f5f5;
          }
          .booking-details {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #1a1a1a;
          }
          .detail-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #666;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NAD+</h1>
          <p>Booking Confirmation</p>
        </div>

        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for booking with NAD+ Longevity. Your appointment has been confirmed.</p>

          <div class="booking-details">
            <h3>Appointment Details</h3>
            <div class="detail-row">
              <span class="label">Service:</span> ${service}
            </div>
            <div class="detail-row">
              <span class="label">Date:</span> ${formatDate(date)}
            </div>
            <div class="detail-row">
              <span class="label">Time:</span> ${time}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> 123 Wellness Boulevard, Suite 500, Beverly Hills, CA 90210
            </div>
          </div>

          <h3>What to Expect</h3>
          <ul>
            <li>Please arrive 10 minutes early to complete any necessary paperwork</li>
            <li>Wear comfortable clothing</li>
            <li>Stay hydrated before your appointment</li>
          </ul>

          <h3>Need to Reschedule?</h3>
          <p>If you need to make changes to your appointment, please contact us at:</p>
          <p>
            Phone: (310) 555-0123<br>
            Email: hello@celivionlongevity.com
          </p>
        </div>

        <div class="footer">
          <p>We look forward to seeing you!</p>
          <p>&copy; 2024 NAD+ Longevity. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    throw err;
  }
}

/**
 * Send cancellation email
 */
async function sendCancellationEmail(data) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('Email service not configured, skipping cancellation email');
    return { success: false, reason: 'not_configured' };
  }

  const { to, name, service, date, time } = data;

  const mailOptions = {
    from: `"NAD+ Longevity" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Appointment Cancelled - NAD+ Longevity',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #1a1a1a;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
            background: #f5f5f5;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NAD+</h1>
          <p>Appointment Cancelled</p>
        </div>

        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your appointment has been cancelled as requested.</p>

          <p><strong>Cancelled Appointment:</strong></p>
          <p>Service: ${service}<br>
          Date: ${formatDate(date)}<br>
          Time: ${time}</p>

          <p>We hope to see you again soon. If you'd like to rebook, please contact us:</p>
          <p>
            Phone: (310) 555-0123<br>
            Email: hello@celivionlongevity.com
          </p>
        </div>

        <div class="footer">
          <p>&copy; 2024 NAD+ Longevity. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending cancellation email:', err);
    throw err;
  }
}

/**
 * Format date for email display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

module.exports = {
  sendConfirmationEmail,
  sendCancellationEmail,
};
