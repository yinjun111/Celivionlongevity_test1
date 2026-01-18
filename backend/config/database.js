const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.db');

let db;

// Initialize database connection
function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
      console.log('Connected to SQLite database');
    });
  }
  return db;
}

// Initialize database schema
async function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();

    db.serialize(() => {
      // Create doctors table
      db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          specialization TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating doctors table:', err);
          reject(err);
        }
      });

      // Create reservations table
      db.run(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          doctor_name TEXT NOT NULL,
          service_type TEXT NOT NULL,
          appointment_date TEXT NOT NULL,
          appointment_time TEXT NOT NULL,
          duration INTEGER DEFAULT 60,
          status TEXT DEFAULT 'pending',
          google_event_id TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating reservations table:', err);
          reject(err);
        }
      });

      // Create services table
      db.run(`
        CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          price DECIMAL(10, 2),
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating services table:', err);
          reject(err);
        }
      });

      // Create availability table (optional - for managing available time slots)
      db.run(`
        CREATE TABLE IF NOT EXISTS availability (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day_of_week INTEGER NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error creating availability table:', err);
          reject(err);
        }
      });

      // Insert default doctors
      db.run(`
        INSERT OR IGNORE INTO doctors (id, name, specialization)
        VALUES
          (1, 'Tommy', 'NAD+ Therapy Specialist'),
          (2, 'Andy', 'Cellular Wellness Expert'),
          (3, 'Cindy', 'Longevity Medicine Specialist')
      `, (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error inserting default doctors:', err);
        }
      });

      // Insert default services
      db.run(`
        INSERT OR IGNORE INTO services (id, name, description, duration, price)
        VALUES
          (1, 'NAD+ IV Therapy', 'Direct intravenous infusion for maximum bioavailability', 75, 299.00),
          (2, 'Cellular Optimization', 'Comprehensive protocol combining NAD+ with targeted nutrients', 105, 499.00),
          (3, 'Longevity Protocol', 'Signature treatment for sustained vitality and healthy aging', 120, 699.00),
          (4, 'Cognitive Enhancement', 'Specialized NAD+ formulation for mental performance', 75, 399.00)
      `, (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error inserting default services:', err);
        }
      });

      // Insert default availability (Monday-Friday, 9 AM - 5 PM)
      db.run(`
        INSERT OR IGNORE INTO availability (id, day_of_week, start_time, end_time)
        VALUES
          (1, 1, '09:00', '17:00'),
          (2, 2, '09:00', '17:00'),
          (3, 3, '09:00', '17:00'),
          (4, 4, '09:00', '17:00'),
          (5, 5, '09:00', '17:00'),
          (6, 6, '10:00', '15:00')
      `, (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error inserting default availability:', err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Close database connection
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase
};
