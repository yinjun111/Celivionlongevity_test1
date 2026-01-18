const express = require('express');
const router = express.Router();
const { DateTime } = require('luxon');

const { getDatabase } = require('../config/database');
const { getBusyBlocks } = require('../services/googleCalendar');

/**
 * Helpers
 */
function getTz() {
  return process.env.CLINIC_TIMEZONE || 'America/New_York';
}

function businessHoursForDateISO(dateISO, tz) {
  // dateISO: YYYY-MM-DD
  // Luxon weekday: 1=Mon ... 7=Sun
  const weekday = DateTime.fromISO(dateISO, { zone: tz }).weekday;

  // Sunday closed
  if (weekday === 7) return null;

  // Default Mon-Fri
  let startHour = 9;
  let endHour = 17;

  // Saturday
  if (weekday === 6) {
    startHour = 10;
    endHour = 15;
  }

  return { startHour, endHour };
}

function intervalsToMillis(busyBlocks) {
  return busyBlocks.map(b => ({
    startMs: DateTime.fromISO(b.start).toMillis(),
    endMs: DateTime.fromISO(b.end).toMillis(),
  }));
}

function overlapsAny(slotStartMs, slotEndMs, busyMillis) {
  // overlap condition: start < busyEnd && end > busyStart
  for (const b of busyMillis) {
    if (slotStartMs < b.endMs && slotEndMs > b.startMs) return true;
  }
  return false;
}

/**
 * Get all active doctors
 */
router.get('/', (req, res) => {
  const db = getDatabase();

  db.all('SELECT * FROM doctors WHERE active = 1 ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching doctors:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch doctors'
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

/**
 * Get available dates for a specific doctor in a month
 * Uses:
 * - SQLite reservations (doctor_name, appointment_date, appointment_time)
 * - Google Calendar FreeBusy blocks (GOOGLE_CALENDAR_ID)
 */
router.get('/:doctorName/available-dates', async (req, res) => {
  try {
    const { doctorName } = req.params;
    const { year, month } = req.query; // month is 1-12

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }

    const y = parseInt(year);
    const m = parseInt(month);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month'
      });
    }

    const db = getDatabase();
    const tz = getTz();

    // Month range
    const monthStart = DateTime.fromObject({ year: y, month: m, day: 1 }, { zone: tz }).startOf('day');
    const monthEnd = monthStart.plus({ months: 1 });

    const today = DateTime.now().setZone(tz).startOf('day');

    // Pull all reservations for this doctor in this month (single DB query)
    const reservations = await new Promise((resolve, reject) => {
      db.all(
        `SELECT appointment_date, appointment_time FROM reservations
         WHERE doctor_name = ?
           AND appointment_date >= ?
           AND appointment_date < ?
           AND status != 'cancelled'`,
        [doctorName, monthStart.toISODate(), monthEnd.toISODate()],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    // Map date -> Set(times)
    const bookedByDate = new Map();
    for (const r of reservations) {
      if (!bookedByDate.has(r.appointment_date)) bookedByDate.set(r.appointment_date, new Set());
      bookedByDate.get(r.appointment_date).add(r.appointment_time);
    }

    // Pull Google busy blocks once for the whole month (single API call)
    const busyBlocks = await getBusyBlocks({
      timeMinISO: monthStart.toISO(),
      timeMaxISO: monthEnd.toISO()
    });
    const busyMillis = intervalsToMillis(busyBlocks);

    const daysInMonth = monthStart.daysInMonth;
    const availableDates = [];

    // Use 60-min slots to decide if a day is selectable (matches your current slots API)
    const slotDurationMin = 60;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateDT = DateTime.fromObject({ year: y, month: m, day }, { zone: tz }).startOf('day');
      const dateISO = dateDT.toISODate();

      // Skip past dates
      if (dateDT < today) continue;

      const hours = businessHoursForDateISO(dateISO, tz);
      if (!hours) continue;

      const bookedTimes = bookedByDate.get(dateISO) || new Set();

      // Check if at least one slot exists not booked and not busy
      let hasAny = false;
      for (let hour = hours.startHour; hour < hours.endHour; hour++) {
        const time = `${String(hour).padStart(2, '0')}:00`;
        if (bookedTimes.has(time)) continue;

        const slotStart = DateTime.fromISO(`${dateISO}T${time}`, { zone: tz });
        const slotEnd = slotStart.plus({ minutes: slotDurationMin });

        // Ensure slot does not run past business end
        const businessEnd = DateTime.fromISO(dateISO, { zone: tz }).set({
          hour: hours.endHour, minute: 0, second: 0, millisecond: 0
        });
        if (slotEnd > businessEnd) continue;

        const slotStartMs = slotStart.toMillis();
        const slotEndMs = slotEnd.toMillis();

        if (overlapsAny(slotStartMs, slotEndMs, busyMillis)) continue;

        hasAny = true;
        break;
      }

      if (hasAny) availableDates.push(dateISO);
    }

    res.json({
      success: true,
      data: {
        doctor: doctorName,
        year: y,
        month: m,
        availableDates
      }
    });
  } catch (err) {
    console.error('Error fetching available dates:', err?.response?.data || err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available dates'
    });
  }
});

/**
 * Get available time slots for a specific doctor on a specific date
 * Uses:
 * - SQLite reservations (doctor_name, appointment_date, appointment_time)
 * - Google Calendar FreeBusy blocks (GOOGLE_CALENDAR_ID)
 */
router.get('/:doctorName/available-slots', async (req, res) => {
  try {
    const { doctorName } = req.params;
    const { date, duration } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const tz = getTz();
    const hours = businessHoursForDateISO(date, tz);
    if (!hours) {
      return res.json({
        success: true,
        data: { doctor: doctorName, date, slots: [] }
      });
    }

    const slotDurationMin = parseInt(duration) || 60;

    const db = getDatabase();

    // DB bookings for that doctor + date
    const bookings = await new Promise((resolve, reject) => {
      db.all(
        `SELECT appointment_time FROM reservations
         WHERE doctor_name = ? AND appointment_date = ? AND status != 'cancelled'`,
        [doctorName, date],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
    const bookedTimes = new Set(bookings.map(b => b.appointment_time));

    // Google busy blocks for that day
    const dayStart = DateTime.fromISO(date, { zone: tz }).startOf('day');
    const dayEnd = dayStart.plus({ days: 1 });

    const busyBlocks = await getBusyBlocks({
      timeMinISO: dayStart.toISO(),
      timeMaxISO: dayEnd.toISO()
    });
    const busyMillis = intervalsToMillis(busyBlocks);

    const availableSlots = [];

    for (let hour = hours.startHour; hour < hours.endHour; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      if (bookedTimes.has(time)) continue;

      const slotStart = DateTime.fromISO(`${date}T${time}`, { zone: tz });
      const slotEnd = slotStart.plus({ minutes: slotDurationMin });

      // Ensure slot does not run past business end
      const businessEnd = DateTime.fromISO(date, { zone: tz }).set({
        hour: hours.endHour, minute: 0, second: 0, millisecond: 0
      });
      if (slotEnd > businessEnd) continue;

      if (overlapsAny(slotStart.toMillis(), slotEnd.toMillis(), busyMillis)) continue;

      availableSlots.push(time);
    }

    res.json({
      success: true,
      data: {
        doctor: doctorName,
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
});

module.exports = router;
