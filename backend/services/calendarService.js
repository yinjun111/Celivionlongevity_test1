const { google } = require('googleapis');
const { getOAuth2Client, refreshTokenIfNeeded, isAuthenticated } = require('../config/googleAuth');

/**
 * Create a Google Calendar event
 */
async function createGoogleCalendarEvent(eventData) {
  if (!isAuthenticated()) {
    console.log('Google Calendar not authenticated. Skipping calendar sync.');
    return null;
  }

  try {
    const oauth2Client = getOAuth2Client();
    await refreshTokenIfNeeded(oauth2Client);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });

    console.log('Google Calendar event created:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error.message);
    throw error;
  }
}

/**
 * Update a Google Calendar event
 */
async function updateGoogleCalendarEvent(eventId, eventData) {
  if (!isAuthenticated()) {
    console.log('Google Calendar not authenticated. Skipping calendar sync.');
    return null;
  }

  try {
    const oauth2Client = getOAuth2Client();
    await refreshTokenIfNeeded(oauth2Client);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : [],
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
      sendUpdates: 'all',
    });

    console.log('Google Calendar event updated:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error.message);
    throw error;
  }
}

/**
 * Delete a Google Calendar event
 */
async function deleteGoogleCalendarEvent(eventId) {
  if (!isAuthenticated()) {
    console.log('Google Calendar not authenticated. Skipping calendar sync.');
    return null;
  }

  try {
    const oauth2Client = getOAuth2Client();
    await refreshTokenIfNeeded(oauth2Client);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    console.log('Google Calendar event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error.message);
    throw error;
  }
}

module.exports = {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
};
