const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { createGoogleCalendarEvent } = require('../services/calendarService');
const { createCalendarEvent, deleteCalendarEvent, getBusyBlocks } = require('../services/googleCalendar');

// Get all appointments for a specific user
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = getDatabase();

  db.all(
    `SELECT * FROM appointments
     WHERE user_id = ?
     ORDER BY start_at DESC`,
    [userId],
    (err, appointments) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(appointments);
    }
  );
});

// Create new appointment (Google Calendar as source of truth)
router.post('/', async (req, res) => {
  const { user_id, doctor_name, appointment_date, appointment_time, duration, notes } = req.body;

  // Validate required fields
  if (!user_id || !doctor_name || !appointment_date || !appointment_time) {
    return res.status(400).json({
      error: 'User ID, doctor name, date, and time are required'
    });
  }

  const db = getDatabase();

  try {
    // Get user information
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get doctor's Google Calendar ID
    const doctor = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, google_calendar_id FROM doctors WHERE name = ? AND active = 1', [doctor_name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const doctorCalendarId = doctor.google_calendar_id;

    // Calculate start and end times
    const startDateTime = new Date(`${appointment_date}T${appointment_time}`);
    const endDateTime = new Date(startDateTime.getTime() + (duration || 60) * 60000);

    let googleEventId = null;
    let syncStatus = 'synced';

    // Only proceed if doctor has a calendar configured
    if (doctorCalendarId) {
      try {
        // STEP 1: Re-check availability on doctor's specific calendar to prevent double-booking
        const busyBlocks = await getBusyBlocks({
          timeMinISO: startDateTime.toISOString(),
          timeMaxISO: endDateTime.toISOString(),
          calendarId: doctorCalendarId
        });

        // Check if the requested time slot overlaps with any busy blocks
        const startMs = startDateTime.getTime();
        const endMs = endDateTime.getTime();

        const hasConflict = busyBlocks.some(block => {
          const blockStartMs = new Date(block.start).getTime();
          const blockEndMs = new Date(block.end).getTime();
          return startMs < blockEndMs && endMs > blockStartMs;
        });

        if (hasConflict) {
          return res.status(409).json({
            error: 'Time slot no longer available. Please select a different time.'
          });
        }

        // STEP 2: Create event in doctor's Google Calendar (source of truth)
        // Note: We include patient info in description, not as attendee (service account limitation)
        const calendarEvent = await createCalendarEvent({
          summary: `Appointment: ${user.full_name}`,
          description: `Appointment with ${doctor_name}\n\nPatient: ${user.full_name}\nEmail: ${user.email}\nPhone: ${user.phone || 'N/A'}\n\nNotes: ${notes || 'None'}`,
          start: startDateTime.toISOString(),
          duration: duration || 60,
          calendarId: doctorCalendarId
          // Not including attendees - service accounts cannot add attendees
        });

        googleEventId = calendarEvent.id;
        console.log(`Created Google Calendar event ${googleEventId} in calendar ${doctorCalendarId}`);

      } catch (calendarError) {
        console.error('Google Calendar error:', calendarError);
        syncStatus = 'sync_pending';
        // Don't fail the request, but mark as needing sync
      }
    } else {
      console.log(`Doctor ${doctor_name} has no Google Calendar configured`);
      syncStatus = 'no_calendar';
    }

    // STEP 3: Store appointment in local database with calendar references
    const appointmentId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO appointments (user_id, doctor_name, start_at, end_at, status, notes, google_calendar_id, google_calendar_event_id, sync_status)
         VALUES (?, ?, ?, ?, 'booked', ?, ?, ?, ?)`,
        [user_id, doctor_name, startDateTime.toISOString(), endDateTime.toISOString(), notes, doctorCalendarId, googleEventId, syncStatus],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: {
        id: appointmentId,
        user_id,
        doctor_name,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        status: 'booked',
        notes,
        google_calendar_id: doctorCalendarId,
        google_calendar_event_id: googleEventId,
        sync_status: syncStatus
      }
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Cancel appointment (delete from doctor's Google Calendar)
router.put('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  try {
    // Get appointment with calendar references
    const appointment = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, google_calendar_id, google_calendar_event_id, status FROM appointments WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'canceled') {
      return res.json({
        success: true,
        message: 'Appointment already canceled'
      });
    }

    // Delete from doctor's Google Calendar if event exists
    if (appointment.google_calendar_id && appointment.google_calendar_event_id) {
      try {
        await deleteCalendarEvent(appointment.google_calendar_event_id, appointment.google_calendar_id);
        console.log(`Deleted Google Calendar event ${appointment.google_calendar_event_id} from calendar ${appointment.google_calendar_id}`);
      } catch (calendarError) {
        console.error('Error deleting from Google Calendar:', calendarError);
        // Continue with DB update even if calendar delete fails
      }
    }

    // Update database record
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE appointments
         SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    res.json({
      success: true,
      message: 'Appointment canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
