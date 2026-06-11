const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Setup DB
const db = new Database(path.join(__dirname, 'freedoc.db'), { verbose: console.log });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ DATABASE SETUP ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    role TEXT CHECK(role IN ('patient', 'doctor')) NOT NULL,
    balance INTEGER DEFAULT 1000,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS doctor_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    department TEXT NOT NULL,
    free_days TEXT NOT NULL,  -- JSON array e.g. ["Monday","Wednesday"]
    max_patients_per_day INTEGER DEFAULT 5,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,  -- YYYY-MM-DD
    department TEXT NOT NULL,
    city TEXT NOT NULL,
    consultation_type TEXT CHECK(consultation_type IN ('video','inperson')) DEFAULT 'video',
    status TEXT CHECK(status IN ('locked','completed','cancelled')) DEFAULT 'locked',
    lock_amount INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY(patient_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );
`);

// ============ SEED DATA ============
const seedData = () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return; // already seeded

  console.log('Seeding demo data...');

  // Sample patients
  const insertUser = db.prepare(`
    INSERT INTO users (name, phone, city, role, balance) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const patients = [
    ['Rahul Sharma', '9876543210', 'Delhi', 'patient', 1500],
    ['Priya Patel', '9876543211', 'Mumbai', 'patient', 1200],
    ['Amit Kumar', '9876543212', 'Bangalore', 'patient', 800],
  ];

  const patientIds = [];
  patients.forEach(p => {
    const info = insertUser.run(...p);
    patientIds.push(info.lastInsertRowid);
  });

  // Sample doctors
  const doctors = [
    ['Dr. Ananya Mehta', '9123456780', 'Delhi', 'doctor', 2000],
    ['Dr. Vikram Singh', '9123456781', 'Mumbai', 'doctor', 1800],
    ['Dr. Sneha Reddy', '9123456782', 'Bangalore', 'doctor', 2200],
    ['Dr. Rajesh Verma', '9123456783', 'Delhi', 'doctor', 1500],
    ['Dr. Kavita Joshi', '9123456784', 'Hyderabad', 'doctor', 1700],
    ['Dr. Arjun Nair', '9123456785', 'Chennai', 'doctor', 1900],
  ];

  const doctorUserIds = [];
  doctors.forEach(d => {
    const info = insertUser.run(...d);
    doctorUserIds.push(info.lastInsertRowid);
  });

  // Doctor profiles
  const insertProfile = db.prepare(`
    INSERT INTO doctor_profiles (user_id, department, free_days, max_patients_per_day)
    VALUES (?, ?, ?, ?)
  `);

  const profiles = [
    [doctorUserIds[0], 'Cardiology', JSON.stringify(['Monday', 'Wednesday', 'Friday']), 4],
    [doctorUserIds[1], 'General Medicine', JSON.stringify(['Tuesday', 'Thursday', 'Saturday']), 6],
    [doctorUserIds[2], 'Pediatrics', JSON.stringify(['Monday', 'Thursday']), 3],
    [doctorUserIds[3], 'Dermatology', JSON.stringify(['Wednesday', 'Friday']), 5],
    [doctorUserIds[4], 'Orthopedics', JSON.stringify(['Monday', 'Tuesday', 'Friday']), 4],
    [doctorUserIds[5], 'General Medicine', JSON.stringify(['Wednesday', 'Saturday']), 5],
  ];

  profiles.forEach(p => insertProfile.run(...p));

  // Sample bookings for demo
  const insertBooking = db.prepare(`
    INSERT INTO bookings (patient_id, doctor_id, scheduled_date, department, city, consultation_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Some past completed for monthly limit test
  insertBooking.run(patientIds[0], doctorUserIds[0], '2026-05-12', 'Cardiology', 'Delhi', 'video', 'completed');

  // Some current locked
  const today = new Date();
  const futureDate1 = new Date(today.getTime() + 3*86400000).toISOString().split('T')[0]; // +3 days
  const futureDate2 = new Date(today.getTime() + 5*86400000).toISOString().split('T')[0];

  insertBooking.run(patientIds[1], doctorUserIds[1], futureDate1, 'General Medicine', 'Mumbai', 'inperson', 'locked');
  insertBooking.run(patientIds[2], doctorUserIds[2], futureDate2, 'Pediatrics', 'Bangalore', 'video', 'locked');

  console.log('Demo data seeded successfully!');
};

seedData();

// ============ HELPER FUNCTIONS ============
const getWeekday = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
};

// ============ API ROUTES ============

// Auth
app.post('/api/register', (req, res) => {
  const { name, phone, city, role } = req.body;
  if (!name || !phone || !city || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO users (name, phone, city, role) 
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name, phone, city, role);
    
    // If doctor, create empty profile
    if (role === 'doctor') {
      db.prepare(`
        INSERT OR IGNORE INTO doctor_profiles (user_id, department, free_days, max_patients_per_day)
        VALUES (?, 'General Medicine', '["Monday","Wednesday"]', 3)
      `).run(info.lastInsertRowid);
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Phone number already registered' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.post('/api/login', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) return res.status(404).json({ error: 'User not found. Please register.' });
  
  res.json({ success: true, user });
});

// Get user
app.get('/api/user/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update user (city etc)
app.put('/api/user/:id', (req, res) => {
  const { city } = req.body;
  if (city) {
    db.prepare('UPDATE users SET city = ? WHERE id = ?').run(city, req.params.id);
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

// Top-up balance (demo only)
app.post('/api/topup', (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'Invalid' });
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ success: true, user });
});

// Departments
app.get('/api/departments', (req, res) => {
  const depts = [
    'General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 
    'Orthopedics', 'Gynecology', 'ENT', 'Neurology', 'Psychiatry'
  ];
  res.json(depts);
});

// Cities
app.get('/api/cities', (req, res) => {
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  res.json(cities);
});

// Get doctor profile
app.get('/api/doctor/profile/:userId', (req, res) => {
  const profile = db.prepare(`
    SELECT dp.*, u.name, u.phone, u.city 
    FROM doctor_profiles dp 
    JOIN users u ON dp.user_id = u.id 
    WHERE dp.user_id = ?
  `).get(req.params.userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  profile.free_days = JSON.parse(profile.free_days || '[]');
  res.json(profile);
});

// Update doctor profile
app.post('/api/doctor/profile', (req, res) => {
  const { userId, department, free_days, max_patients_per_day } = req.body;
  if (!userId || !department || !free_days) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  const freeDaysJson = JSON.stringify(free_days);
  const max = max_patients_per_day || 5;
  
  db.prepare(`
    INSERT OR REPLACE INTO doctor_profiles (user_id, department, free_days, max_patients_per_day)
    VALUES (?, ?, ?, ?)
  `).run(userId, department, freeDaysJson, max);
  
  const profile = db.prepare(`
    SELECT dp.*, u.name, u.phone, u.city 
    FROM doctor_profiles dp 
    JOIN users u ON dp.user_id = u.id 
    WHERE dp.user_id = ?
  `).get(userId);
  profile.free_days = JSON.parse(profile.free_days);
  res.json({ success: true, profile });
});

// List doctors (browse)
app.get('/api/doctors', (req, res) => {
  const { city, department } = req.query;
  let query = `
    SELECT dp.*, u.name, u.phone, u.city, u.balance 
    FROM doctor_profiles dp 
    JOIN users u ON dp.user_id = u.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (city) {
    query += ' AND u.city = ?';
    params.push(city);
  }
  if (department) {
    query += ' AND dp.department = ?';
    params.push(department);
  }
  
  const doctors = db.prepare(query).all(...params);
  doctors.forEach(d => d.free_days = JSON.parse(d.free_days || '[]'));
  res.json(doctors);
});

// Find random eligible doctor for a date
app.post('/api/find-doctor', (req, res) => {
  const { patientId, city, department, preferred_date } = req.body;
  if (!patientId || !city || !department || !preferred_date) {
    return res.status(400).json({ error: 'Missing required fields: patientId, city, department, preferred_date' });
  }

  const weekday = getWeekday(preferred_date);
  const currentMonth = getCurrentMonth();

  // Check patient's monthly limit (1 completed free consult per month)
  const completedThisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE patient_id = ? 
    AND status = 'completed' 
    AND strftime('%Y-%m', scheduled_date) = ?
  `).get(patientId, currentMonth).count;

  if (completedThisMonth >= 1) {
    return res.status(403).json({ 
      error: 'You have already used your 1 free consultation this month. Please try next month.' 
    });
  }

  // Find eligible doctors
  const eligible = db.prepare(`
    SELECT dp.*, u.name, u.phone, u.city 
    FROM doctor_profiles dp 
    JOIN users u ON dp.user_id = u.id 
    WHERE u.city = ? 
    AND dp.department = ?
    AND dp.free_days LIKE ?
  `).all(city, department, `%${weekday}%`);

  if (eligible.length === 0) {
    return res.json({ success: false, message: `No doctors available in ${city} for ${department} on ${weekday}s.` });
  }

  // Filter by available slots
  const availableDoctors = [];
  for (const doc of eligible) {
    const bookedCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE doctor_id = ? 
      AND scheduled_date = ? 
      AND status != 'cancelled'
    `).get(doc.user_id, preferred_date).count;

    const max = doc.max_patients_per_day || 5;
    if (bookedCount < max) {
      doc.free_days = JSON.parse(doc.free_days || '[]');
      availableDoctors.push(doc);
    }
  }

  if (availableDoctors.length === 0) {
    return res.json({ success: false, message: 'No slots available on this date. Try another day.' });
  }

  // Pick random
  const randomIndex = Math.floor(Math.random() * availableDoctors.length);
  const selectedDoctor = availableDoctors[randomIndex];

  res.json({ 
    success: true, 
    doctor: selectedDoctor,
    weekday,
    availableSlots: availableDoctors.length,
    message: `Random doctor selected from ${availableDoctors.length} available options.`
  });
});

// Book / Lock consultation
app.post('/api/book', (req, res) => {
  const { patientId, doctorId, scheduled_date, consultation_type = 'video' } = req.body;
  if (!patientId || !doctorId || !scheduled_date) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(patientId);
  const doctor = db.prepare('SELECT * FROM users u JOIN doctor_profiles dp ON u.id=dp.user_id WHERE u.id = ?').get(doctorId);
  if (!patient || !doctor) return res.status(404).json({ error: 'User or doctor not found' });

  // Re-validate monthly limit
  const currentMonth = getCurrentMonth();
  const completedThisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE patient_id = ? 
    AND status = 'completed' 
    AND strftime('%Y-%m', scheduled_date) = ?
  `).get(patientId, currentMonth).count;

  if (completedThisMonth >= 1) {
    return res.status(403).json({ error: 'Monthly free consultation limit reached.' });
  }

  // Check slot availability
  const bookedCount = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE doctor_id = ? AND scheduled_date = ? AND status != 'cancelled'
  `).get(doctorId, scheduled_date).count;

  const max = doctor.max_patients_per_day || 5;
  if (bookedCount >= max) {
    return res.status(409).json({ error: 'No more slots available on this date for this doctor.' });
  }

  // Check if patient already has a locked booking this month (optional strict rule)
  const activeLocks = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE patient_id = ? AND status = 'locked'
  `).get(patientId).count;
  if (activeLocks >= 1) {
    return res.status(409).json({ error: 'You already have an active locked consultation. Please complete or cancel first.' });
  }

  // Simulate payment: check balance
  const lockAmount = 100;
  if (patient.balance < lockAmount) {
    return res.status(402).json({ error: 'Insufficient balance. Please top-up your demo wallet.' });
  }

  // Deduct balance
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(lockAmount, patientId);

  // Get dept and city
  const dept = doctor.department;
  const city = doctor.city;

  // Create booking
  const insert = db.prepare(`
    INSERT INTO bookings (patient_id, doctor_id, scheduled_date, department, city, consultation_type, status, lock_amount)
    VALUES (?, ?, ?, ?, ?, ?, 'locked', ?)
  `);
  const info = insert.run(patientId, doctorId, scheduled_date, dept, city, consultation_type, lockAmount);

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
  
  const updatedPatient = db.prepare('SELECT * FROM users WHERE id = ?').get(patientId);
  
  res.json({ 
    success: true, 
    booking, 
    patient: updatedPatient,
    message: `Consultation locked! ₹${lockAmount} deducted. It will be refunded after successful completion.`
  });
});

// Get patient bookings
app.get('/api/bookings/patient/:patientId', (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name as doctor_name, u.phone as doctor_phone 
    FROM bookings b
    JOIN users u ON b.doctor_id = u.id
    WHERE b.patient_id = ?
    ORDER BY b.scheduled_date DESC
  `).all(req.params.patientId);
  res.json(bookings);
});

// Get doctor bookings (upcoming + recent)
app.get('/api/bookings/doctor/:doctorId', (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name as patient_name, u.phone as patient_phone, u.city as patient_city 
    FROM bookings b
    JOIN users u ON b.patient_id = u.id
    WHERE b.doctor_id = ?
    ORDER BY b.scheduled_date ASC, b.created_at DESC
  `).all(req.params.doctorId);
  res.json(bookings);
});

// Complete consultation (doctor action) -> refund
app.post('/api/complete', (req, res) => {
  const { bookingId, doctorId } = req.body;
  if (!bookingId || !doctorId) return res.status(400).json({ error: 'Missing fields' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND doctor_id = ?').get(bookingId, doctorId);
  if (!booking) return res.status(404).json({ error: 'Booking not found or not yours' });
  if (booking.status !== 'locked') return res.status(400).json({ error: 'Booking is not in locked state' });

  // Mark completed
  db.prepare(`
    UPDATE bookings 
    SET status = 'completed', completed_at = datetime('now') 
    WHERE id = ?
  `).run(bookingId);

  // Refund to patient
  const refundAmount = booking.lock_amount || 100;
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(refundAmount, booking.patient_id);

  const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(booking.patient_id);

  res.json({ 
    success: true, 
    booking: updatedBooking,
    patient,
    message: `Consultation marked complete. ₹${refundAmount} refunded to patient.`
  });
});

// Simple cancel (for demo)
app.post('/api/cancel', (req, res) => {
  const { bookingId, userId } = req.body; // userId can be patient or doctor
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  
  if (booking.status !== 'locked') {
    return res.status(400).json({ error: 'Can only cancel locked bookings' });
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', bookingId);
  
  // Refund if locked
  const refundAmount = booking.lock_amount || 100;
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(refundAmount, booking.patient_id);

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  res.json({ success: true, booking: updated, message: 'Booking cancelled and amount refunded.' });
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FreeDoc India backend running on http://localhost:${PORT}`);
  console.log(`📱 Open in browser: http://localhost:${PORT}`);
  console.log('Demo phones: 9876543210 (patient), 9123456780 (doctor)');
});
