const { getDatabase } = require('../config/database');

class Reservation {
  /**
   * Create a new reservation
   */
  static create(data) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      const sql = `
        INSERT INTO reservations (
          client_name, email, phone, address, doctor_name, service_type,
          appointment_date, appointment_time, duration,
          status, google_event_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.client_name,
        data.email,
        data.phone || null,
        data.address || null,
        data.doctor_name,
        data.service_type,
        data.appointment_date,
        data.appointment_time,
        data.duration || 60,
        data.status || 'pending',
        data.google_event_id || null,
        data.notes || null
      ];

      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...data });
        }
      });
    });
  }

  /**
   * Get all reservations
   */
  static getAll(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      let sql = 'SELECT * FROM reservations';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.date) {
        conditions.push('appointment_date = ?');
        params.push(filters.date);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY appointment_date, appointment_time';

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get reservation by ID
   */
  static getById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      const sql = 'SELECT * FROM reservations WHERE id = ?';

      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Update reservation
   */
  static update(id, data) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      const fields = [];
      const params = [];

      if (data.client_name) {
        fields.push('client_name = ?');
        params.push(data.client_name);
      }
      if (data.email) {
        fields.push('email = ?');
        params.push(data.email);
      }
      if (data.phone !== undefined) {
        fields.push('phone = ?');
        params.push(data.phone);
      }
      if (data.address !== undefined) {
        fields.push('address = ?');
        params.push(data.address);
      }
      if (data.doctor_name) {
        fields.push('doctor_name = ?');
        params.push(data.doctor_name);
      }
      if (data.service_type) {
        fields.push('service_type = ?');
        params.push(data.service_type);
      }
      if (data.appointment_date) {
        fields.push('appointment_date = ?');
        params.push(data.appointment_date);
      }
      if (data.appointment_time) {
        fields.push('appointment_time = ?');
        params.push(data.appointment_time);
      }
      if (data.duration) {
        fields.push('duration = ?');
        params.push(data.duration);
      }
      if (data.status) {
        fields.push('status = ?');
        params.push(data.status);
      }
      if (data.google_event_id !== undefined) {
        fields.push('google_event_id = ?');
        params.push(data.google_event_id);
      }
      if (data.notes !== undefined) {
        fields.push('notes = ?');
        params.push(data.notes);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`;

      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * Delete reservation
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      const sql = 'DELETE FROM reservations WHERE id = ?';

      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get reservations for a specific date range
   */
  static getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      const sql = `
        SELECT * FROM reservations
        WHERE appointment_date BETWEEN ? AND ?
        ORDER BY appointment_date, appointment_time
      `;

      db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Check if time slot is available
   */
  static isTimeSlotAvailable(date, time, duration) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      const sql = `
        SELECT * FROM reservations
        WHERE appointment_date = ?
        AND status != 'cancelled'
        AND (
          (appointment_time <= ? AND time(appointment_time, '+' || duration || ' minutes') > ?)
          OR (appointment_time < time(?, '+' || ? || ' minutes') AND appointment_time >= ?)
        )
      `;

      db.all(sql, [date, time, time, time, duration, time], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.length === 0);
        }
      });
    });
  }
}

module.exports = Reservation;
