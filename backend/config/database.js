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

// Initialize database schema (based on Db_scheme.md)
async function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();

    db.serialize(() => {
      // Table 1: users - Stores identity + contact info
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          phone TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          postal_code TEXT,
          country TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        }
      });

      // Table 2: user_auth - Stores password hash
      db.run(`
        CREATE TABLE IF NOT EXISTS user_auth (
          user_id INTEGER PRIMARY KEY,
          password_hash TEXT NOT NULL,
          password_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating user_auth table:', err);
          reject(err);
        }
      });

      // Table 3: plans - Defines subscription plans
      db.run(`
        CREATE TABLE IF NOT EXISTS plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          price_cents INTEGER NOT NULL,
          billing_period TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error creating plans table:', err);
          reject(err);
        }
      });

      // Table 4: subscriptions - Links user to plan
      db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          plan_id INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          start_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          current_period_start DATETIME,
          current_period_end DATETIME,
          cancel_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (plan_id) REFERENCES plans(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating subscriptions table:', err);
          reject(err);
        }
      });

      // Table 5: appointments - Stores appointment records
      db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          doctor_name TEXT,
          start_at DATETIME NOT NULL,
          end_at DATETIME NOT NULL,
          status TEXT DEFAULT 'booked',
          notes TEXT,
          google_calendar_id TEXT,
          google_calendar_event_id TEXT,
          sync_status TEXT DEFAULT 'synced',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating appointments table:', err);
          reject(err);
        }
      });

      // Table 6: password_reset_tokens - For password reset functionality
      db.run(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating password_reset_tokens table:', err);
          reject(err);
        }
      });

      // Legacy tables for existing booking system compatibility
      // Create doctors table with Google Calendar integration
      db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          specialization TEXT,
          google_calendar_id TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating doctors table:', err);
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

      // Insert default plans
      db.run(`
        INSERT OR IGNORE INTO plans (id, name, price_cents, billing_period, is_active)
        VALUES
          (1, 'Basic', 9900, 'monthly', 1),
          (2, 'Premium', 19900, 'monthly', 1),
          (3, 'Annual', 199900, 'yearly', 1)
      `, (err) => {
        if (err && !err.message.includes('UNIQUE constraint')) {
          console.error('Error inserting default plans:', err);
        }
      });

      // Insert default doctors
      db.run(`
        INSERT OR IGNORE INTO doctors (id, name, specialization)
        VALUES
          (1, 'Tommy', 'NAD+ Therapy Specialist'),
          (2, 'Andy', 'Cellular Wellness Expert')
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
