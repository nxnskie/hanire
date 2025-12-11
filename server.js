/* server.js
  Purpose: Minimal express API for demo auth endpoints (development)
  Edited: 2025-12-11
  
  FEATURES:
  - User registration with bcryptjs password hashing
  - Login authentication with JWT tokens
  - Persistent user storage in users.json
  - CORS enabled for local development
*/

/* ========================================
   DEPENDENCIES & INITIALIZATION
   ======================================== */

const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs'); // Password hashing library
const cors = require('cors'); // Cross-Origin Resource Sharing
const jwt = require('jsonwebtoken'); // JWT token generation for session management

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'users.json'); // File where user data persists
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production'; // Secret for signing JWT tokens

/* ========================================
   MIDDLEWARE
   ======================================== */

// Enable CORS - allows API calls from different origins
app.use(cors());

// Parse incoming JSON bodies with 1MB size limit
app.use(express.json({ limit: '1mb' }));

// Serve static files (HTML, CSS, JS) from the server's root directory
// This makes pages accessible at http://localhost:3000/
app.use(express.static(__dirname));

/* ========================================
   UTILITY FUNCTIONS - FILE OPERATIONS
   ======================================== */

/**
 * Reads users from the JSON file and returns as array
 * Returns empty array if file doesn't exist or fails to parse
 */
function readUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

/**
 * Writes users array to JSON file with formatting
 * Called after register or update operations
 */
function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

/* ========================================
   API ENDPOINT - USER REGISTRATION
   ======================================== */

/**
 * POST /api/register
 * Creates a new user account
 * 
 * Request body:
 *   - fullName (required): User's full name
 *   - email (required): User's email address (unique)
 *   - password (required): Plain text password (will be hashed)
 *   - phone (optional): Contact phone number
 *   - location (optional): User's location
 *   - role (optional): User role designation
 *   - avatarUrl (optional): Profile picture URL
 * 
 * Response:
 *   - success: boolean
 *   - user: Public user object (no password hash)
 *   - token: JWT token for session authentication
 */
app.post('/api/register', async (req, res) => {
  const { fullName, email, phone, location, role, avatarUrl, password } = req.body || {};
  
  // Validate required fields
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Check if email already registered (prevent duplicates)
  const users = readUsers();
  const exists = users.find(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  // Hash password using bcryptjs (10 salt rounds)
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Auto-generate memberSince as YYYY-MM format (current date)
  const now = new Date();
  const memberSince = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Create user object with generated ID and hashed password
  const user = {
    id: Date.now(), // Unique ID based on timestamp
    fullName,
    email,
    phone: phone || '',
    location: location || '',
    role: role || 'Standard Member',
    avatarUrl: avatarUrl || '',
    memberSince: memberSince,
    passwordHash: hash // Never send plain password
  };

  // Save to file and send response
  users.push(user);
  writeUsers(users);
  
  // Return public user data (no password hash) + JWT token for auto-login
  const publicUser = { 
    id: user.id, 
    fullName: user.fullName, 
    email: user.email, 
    phone: user.phone, 
    location: user.location, 
    role: user.role, 
    avatarUrl: user.avatarUrl, 
    memberSince: user.memberSince 
  };
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ success: true, user: publicUser, token });
});

/* ========================================
   API ENDPOINT - USER LOGIN
   ======================================== */

/**
 * POST /api/login
 * Authenticates user with email/name and password
 * 
 * Request body:
 *   - username (required): Email or full name
 *   - password (required): Plain text password
 * 
 * Response:
 *   - success: boolean
 *   - user: Public user object
 *   - token: JWT token for session authentication
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  
  // Validate required fields
  if (!username || !password) return res.status(400).json({ success: false, message: 'Missing username or password' });

  // Find user by email or full name (case-insensitive)
  const users = readUsers();
  const user = users.find(u => 
    (u.email && u.email.toLowerCase() === username.toLowerCase()) || 
    (u.fullName && u.fullName.toLowerCase() === username.toLowerCase())
  );
  
  // Return 401 if user not found
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  // Compare provided password with stored hash
  const match = await bcrypt.compare(password, user.passwordHash || '');
  if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  // Return public user data + JWT token for session management
  const publicUser = { 
    id: user.id, 
    fullName: user.fullName, 
    email: user.email, 
    phone: user.phone, 
    location: user.location, 
    role: user.role, 
    avatarUrl: user.avatarUrl, 
    memberSince: user.memberSince 
  };
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ success: true, user: publicUser, token });
});

/* ========================================
   API ENDPOINT - GET ALL USERS (PUBLIC)
   ======================================== */

/**
 * GET /api/users
 * Returns list of all registered users (public data only)
 * 
 * Response: Array of user objects with id, fullName, email
 */
app.get('/api/users', (req, res) => {
  const users = readUsers();
  // Return only public info (never send password hashes)
  const publicOnly = users.map(u => ({ id: u.id, fullName: u.fullName, email: u.email }));
  res.json(publicOnly);
});

/* ========================================
   START SERVER
   ======================================== */

// Listen on specified port and log startup message
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
