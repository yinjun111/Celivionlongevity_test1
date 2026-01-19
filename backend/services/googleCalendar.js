const { google } = require("googleapis");

console.log("LOADED services/googleCalendar.js (service account)");

function getCalendarClient() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE;
  if (!keyFile) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEYFILE in .env");

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

function getDefaultCalendarId() {
  const id = process.env.GOOGLE_CALENDAR_ID;
  if (!id) throw new Error("Missing GOOGLE_CALENDAR_ID in .env");
  return id;
}

function getTimeZone() {
  return process.env.CLINIC_TIMEZONE || "America/New_York";
}

async function createCalendarEvent({ summary, description, start, duration = 60, attendees = [], calendarId }) {
  const calendar = getCalendarClient();
  const targetCalendarId = calendarId || getDefaultCalendarId();
  const timeZone = getTimeZone();

  // start should be ISO string. If you pass "YYYY-MM-DDTHH:mm:ss", it will be interpreted as local with timeZone.
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error(`Invalid start datetime: ${start}`);
  }
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const requestBody = {
    summary,
    description,
    start: { dateTime: startDate.toISOString(), timeZone },
    end: { dateTime: endDate.toISOString(), timeZone },
  };

  // Only add attendees if provided, but don't send email invitations (service accounts can't)
  if (attendees && attendees.length > 0) {
    requestBody.attendees = attendees.map((email) => ({ email }));
  }

  const resp = await calendar.events.insert({
    calendarId: targetCalendarId,
    requestBody,
    sendUpdates: "none", // Service accounts cannot send invitations
  });

  return resp.data;
}

async function updateCalendarEvent(eventId, { summary, description, start, duration = 60, attendees, calendarId }) {
  const calendar = getCalendarClient();
  const targetCalendarId = calendarId || getDefaultCalendarId();
  const timeZone = getTimeZone();

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error(`Invalid start datetime: ${start}`);
  }
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const patch = {
    summary,
    description,
    start: { dateTime: startDate.toISOString(), timeZone },
    end: { dateTime: endDate.toISOString(), timeZone },
  };

  if (Array.isArray(attendees)) {
    patch.attendees = attendees.map((email) => ({ email }));
  }

  const resp = await calendar.events.patch({
    calendarId: targetCalendarId,
    eventId,
    requestBody: patch,
    sendUpdates: "none", // Service accounts cannot send invitations
  });

  return resp.data;
}

async function deleteCalendarEvent(eventId, calendarId) {
  const calendar = getCalendarClient();
  const targetCalendarId = calendarId || getDefaultCalendarId();
  await calendar.events.delete({
    calendarId: targetCalendarId,
    eventId,
    sendUpdates: "none" // Service accounts cannot send invitations
  });
  return true;
}


async function getBusyBlocks({ timeMinISO, timeMaxISO, calendarId }) {
  const calendar = getCalendarClient();
  const targetCalendarId = calendarId || getDefaultCalendarId();
  const timeZone = getTimeZone();

  // Use events.list instead of freebusy to catch all events including all-day events
  const resp = await calendar.events.list({
    calendarId: targetCalendarId,
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = resp.data.items || [];
  const busyBlocks = [];

  for (const event of events) {
    // Skip cancelled events
    if (event.status === 'cancelled') continue;

    // Handle all-day events
    if (event.start.date) {
      // All-day event - block the entire day from 00:00 to 23:59
      const startDate = new Date(event.start.date + 'T00:00:00');
      const endDate = new Date(event.end.date + 'T00:00:00');
      busyBlocks.push({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
    }
    // Handle timed events
    else if (event.start.dateTime && event.end.dateTime) {
      busyBlocks.push({
        start: event.start.dateTime,
        end: event.end.dateTime
      });
    }
  }

  return busyBlocks;
}

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getBusyBlocks,
};
