const express = require('express');
const bcrypt = require('bcrypt');
const { getDatabase } = require('../config/database');

const router = express.Router();
const SALT_ROUNDS = 10;

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, phone, address, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Name, email, and password are required'
    });
  }

  // Validate password requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasSpecialChar) {
    return res.status(400).json({
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
    });
  }

  const db = getDatabase();

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user
      db.run(
        `INSERT INTO users (email, full_name, phone, address_line1, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [email, name, phone, address],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const userId = this.lastID;

          // Insert password hash
          db.run(
            `INSERT INTO user_auth (user_id, password_hash)
             VALUES (?, ?)`,
            [userId, passwordHash],
            (err) => {
              if (err) {
                console.error('Error storing password:', err);
                // Rollback user creation
                db.run('DELETE FROM users WHERE id = ?', [userId]);
                return res.status(500).json({ error: 'Failed to create user' });
              }

              res.status(201).json({
                success: true,
                message: 'Account created successfully',
                user: {
                  id: userId,
                  email,
                  name
                }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  const db = getDatabase();

  try {
    // Get user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // Get password hash
      db.get('SELECT password_hash FROM user_auth WHERE user_id = ?', [user.id], async (err, authData) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!authData) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, authData.password_hash);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Login successful
        res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.full_name,
            phone: user.phone,
            address: user.address_line1
          }
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user (for testing)
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = getDatabase();

  db.get('SELECT id, email, full_name, phone, address_line1, status FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  });
});

module.exports = router;
