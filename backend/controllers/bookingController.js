const Reservation = require('../models/Reservation');

const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getBusyBlocks } = require('../services/googleCalendar');
const { DateTime } = require('luxon');


const { sendConfirmationEmail } = require('../services/emailService');

/**
 * Get all bookings
 */
async function getAllBookings(req, res) {
  try {
    const filters = {
      status: req.query.status,
      date: req.query.date
    };

    const bookings = await Reservation.getAll(filters);
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
}

/**
 * Get booking by ID
 */
async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const booking = await Reservation.getById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
}

/**
 * Create new booking
 */
async function createBooking(req, res) {
  try {
    const {
      client_name,
      email,
      phone,
      address,
      doctor_name,
      service_type,
      appointment_date,
      appointment_time,
      duration,
      notes
    } = req.body;

    // Validate required fields
    if (!client_name || !email || !doctor_name || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if time slot is available
    const isAvailable = await Reservation.isTimeSlotAvailable(
      appointment_date,
      appointment_time,
      duration || 60
    );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        error: 'Time slot is not available'
      });
    }

    // Create reservation in database
    const reservation = await Reservation.create({
      client_name,
      email,
      phone,
      address,
      doctor_name,
      service_type: service_type || 'General Consultation',
      appointment_date,
      appointment_time,
      duration: duration || 60,
      status: 'confirmed',
      notes
    });

    // Try to create Google Calendar event
    let googleEventId = null;
    try {
      const calendarEvent = await createCalendarEvent({
        summary: `${service_type || 'General Consultation'} - ${client_name}`,

        description: `Service: ${service_type}\nClient: ${client_name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nNotes: ${notes || 'None'}`,
        start: `${appointment_date}T${appointment_time}:00`,
        duration: duration || 60,
        attendees: []
      });

      googleEventId = calendarEvent.id;

      // Update reservation with Google event ID
      await Reservation.update(reservation.id, {
        google_event_id: googleEventId
      });
    } catch (calErr) {
      console.error('Failed to create calendar event:', calErr.message);
      // Continue anyway - booking is created even if calendar sync fails
    }

    // Try to send confirmation email
    try {
      await sendConfirmationEmail({
        to: email,
        name: client_name,
        service: service_type,
        date: appointment_date,
        time: appointment_time
      });
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr.message);
      // Continue anyway
    }

    res.status(201).json({
      success: true,
      data: {
        ...reservation,
        google_event_id: googleEventId
      },
      message: 'Booking created successfully'
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
}

/**
 * Update booking
 */
async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if booking exists
    const existingBooking = await Reservation.getById(id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // If updating date/time, check availability
    if (updates.appointment_date || updates.appointment_time) {
      const date = updates.appointment_date || existingBooking.appointment_date;
      const time = updates.appointment_time || existingBooking.appointment_time;
      const duration = updates.duration || existingBooking.duration;

      const isAvailable = await Reservation.isTimeSlotAvailable(date, time, duration);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          error: 'New time slot is not available'
        });
      }
    }

    // Update reservation
    await Reservation.update(id, updates);

    // Update Google Calendar event if it exists
    if (existingBooking.google_event_id) {
      try {
        await updateCalendarEvent(existingBooking.google_event_id, {
          summary: `${updates.service_type || existingBooking.service_type} - ${updates.client_name || existingBooking.client_name}`,
          description: `Service: ${updates.service_type || existingBooking.service_type}\nClient: ${updates.client_name || existingBooking.client_name}`,
          start: `${updates.appointment_date || existingBooking.appointment_date}T${updates.appointment_time || existingBooking.appointment_time}:00`,
          duration: updates.duration || existingBooking.duration
        });
      } catch (calErr) {
        console.error('Failed to update calendar event:', calErr.message);
      }
    }

    const updatedBooking = await Reservation.getById(id);

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully'
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
}

/**
 * Cancel/Delete booking
 */
async function deleteBooking(req, res) {
  try {
    const { id } = req.params;

    // Check if booking exists
    const booking = await Reservation.getById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Delete Google Calendar event if it exists
    if (booking.google_event_id) {
      try {
        await deleteCalendarEvent(booking.google_event_id);
      } catch (calErr) {
        console.error('Failed to delete calendar event:', calErr.message);
      }
    }

    // Delete reservation
    await Reservation.delete(id);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking'
    });
  }
}

/**
 * Get available time slots for a specific date
 */
async function getAvailableSlots(req, res) {
  try {
    const { date, duration } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const slotDuration = parseInt(duration) || 60;
    const tz = process.env.CLINIC_TIMEZONE || 'America/New_York';

    // Business hours (9 AM - 5 PM)
    const startHour = 9;
    const endHour = 17;

    // Pull Google busy blocks for this date
    const dayStart = DateTime.fromISO(date, { zone: tz }).startOf('day');
    const dayEnd = dayStart.plus({ days: 1 });

    const busyBlocks = await getBusyBlocks({
      timeMinISO: dayStart.toISO(),
      timeMaxISO: dayEnd.toISO()
    });

    const overlapsBusy = (slotStartISO, slotEndISO) => {
      const s1 = DateTime.fromISO(slotStartISO).toMillis();
      const e1 = DateTime.fromISO(slotEndISO).toMillis();
      return busyBlocks.some(b => {
        const s2 = DateTime.fromISO(b.start).toMillis();
        const e2 = DateTime.fromISO(b.end).toMillis();
        return s1 < e2 && e1 > s2;
      });
    };

    const businessEnd = DateTime.fromISO(date, { zone: tz }).set({
      hour: endHour,
      minute: 0,
      second: 0,
      millisecond: 0
    });

    const availableSlots = [];

    // Generate slots every 30 min, filter by Google busy + DB bookings
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        const slotStart = DateTime.fromISO(`${date}T${time}`, { zone: tz });
        const slotEnd = slotStart.plus({ minutes: slotDuration });

        // Don’t allow slots that run past business hours
        if (slotEnd > businessEnd) continue;

        // Block slots that overlap Google Calendar busy events
        if (overlapsBusy(slotStart.toISO(), slotEnd.toISO())) continue;

        // Block slots already booked in SQLite
        const isAvailable = await Reservation.isTimeSlotAvailable(date, time, slotDuration);
        if (!isAvailable) continue;

        availableSlots.push(time);
      }
    }

    res.json({
      success: true,
      data: {
        date,
        slots: availableSlots
      }
    });
  } catch (err) {
    console.error('Error fetching available slots:', err?.response?.data || err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
}


module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getAvailableSlots
};
