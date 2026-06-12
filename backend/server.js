const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database(path.join(__dirname, 'freedoc.db'), { verbose: console.log });

app.use(cors());
app.use(express.json({ limit: '10mb' })); // for base64 prescription
app.use(express.static(path.join(__dirname, 'public')));

// ============ DATABASE SETUP + MIGRATIONS ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    role TEXT CHECK(role IN ('patient', 'doctor')) NOT NULL,
    aadhaar_verified INTEGER DEFAULT 0,
    aadhaar_last4 TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS doctor_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    department TEXT NOT NULL,
    free_days TEXT NOT NULL,
    max_patients_per_day INTEGER DEFAULT 5,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    department TEXT NOT NULL,
    city TEXT NOT NULL,
    consultation_type TEXT DEFAULT 'inperson',
    status TEXT CHECK(status IN ('confirmed','completed','cancelled')) DEFAULT 'confirmed',
    prescription_data TEXT,           -- base64 or notes for uploaded prescription
    prescription_uploaded_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY(patient_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    booking_id INTEGER,
    stars INTEGER CHECK(stars BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(patient_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );
`);

// Run safe migrations for existing DBs
try { db.exec(`ALTER TABLE users ADD COLUMN aadhaar_verified INTEGER DEFAULT 0`); } catch(e){}
try { db.exec(`ALTER TABLE users ADD COLUMN aadhaar_last4 TEXT`); } catch(e){}
try { db.exec(`ALTER TABLE bookings ADD COLUMN prescription_data TEXT`); } catch(e){}
try { db.exec(`ALTER TABLE bookings ADD COLUMN prescription_uploaded_at TEXT`); } catch(e){}

console.log('Database schema ready (with Aadhaar, prescriptions, ratings)');

// ============ HELPERS ============
const getWeekday = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });

function canBookFreeConsult(patientId) {
  // Changed to every 15 days
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const cutoff = fifteenDaysAgo.toISOString().split('T')[0];

  const recent = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE patient_id = ? AND status = 'completed' 
    AND scheduled_date >= ?
  `).get(patientId, cutoff).count;

  return recent === 0;
}

function getDoctorRank(totalCompleted) {
  if (totalCompleted >= 30) return { level: "Healing Legend", color: "purple", icon: "fa-crown", desc: "30+ free consults" };
  if (totalCompleted >= 15) return { level: "Free Care Champion", color: "blue", icon: "fa-medal", desc: "15+ free consults" };
  if (totalCompleted >= 5) return { level: "Community Supporter", color: "green", icon: "fa-hands-helping", desc: "5+ free consults" };
  return { level: "New Healer", color: "gray", icon: "fa-user-md", desc: "Starting the journey" };
}

// ============ MOCK OTP (for testing) ============
// For real testing: OTP is always 123456 for any phone.
// In production you would integrate MSG91/Fast2SMS etc.
const otpStore = new Map(); // phone -> {code, expires}

app.post('/api/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) return res.status(400).json({ error: 'Valid phone required' });

  const code = '123456'; // MOCK OTP - always this for testing
  otpStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });

  // For testing, we tell the user the code
  console.log(`[MOCK OTP] For phone ${phone} → use code: ${code}`);

  res.json({ 
    success: true, 
    message: 'OTP sent (for testing use 123456)',
    // In real app, never send code to client. Here we do for easy testing.
    testCode: code  
  });
});

app.post('/api/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const stored = otpStore.get(phone);

  if (!stored || stored.expires < Date.now()) {
    return res.status(400).json({ error: 'OTP expired. Please request again.' });
  }
  if (stored.code !== code) {
    return res.status(400).json({ error: 'Invalid OTP. For testing use 123456' });
  }

  otpStore.delete(phone);
  res.json({ success: true, message: 'Phone verified' });
});

// ============ AADHAAR VERIFICATION (MOCK) ============
app.post('/api/verify-aadhaar', (req, res) => {
  const { userId, aadhaarLast4, otp } = req.body; // otp mock for aadhaar too

  if (!userId || !aadhaarLast4 || aadhaarLast4.length !== 4) {
    return res.status(400).json({ error: 'Last 4 digits of Aadhaar required' });
  }

  // Mock Aadhaar OTP - always 123456 for testing
  if (otp !== '123456') {
    return res.status(400).json({ error: 'Invalid Aadhaar OTP. Use 123456 for testing.' });
  }

  db.prepare(`
    UPDATE users SET aadhaar_verified = 1, aadhaar_last4 = ? WHERE id = ?
  `).run(aadhaarLast4, userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ success: true, user, message: 'Aadhaar verified successfully (mock)' });
});

// ============ AUTH ============
app.post('/api/register', (req, res) => {
  const { name, phone, city, role } = req.body;
  if (!name || !phone || !city || !role) return res.status(400).json({ error: 'Missing fields' });
  try {
    const info = db.prepare(`INSERT INTO users (name, phone, city, role) VALUES (?, ?, ?, ?)`).run(name, phone, city, role);
    if (role === 'doctor') {
      db.prepare(`INSERT OR IGNORE INTO doctor_profiles (user_id, department, free_days, max_patients_per_day) VALUES (?, 'General Medicine', '["Monday","Wednesday"]', 3)`).run(info.lastInsertRowid);
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, user });
  } catch (e) {
    res.status(e.message.includes('UNIQUE') ? 409 : 500).json({ error: e.message });
  }
});

app.post('/api/login', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });
  res.json({ success: true, user });
});

// ============ DEPARTMENTS / CITIES ============
app.get('/api/departments', (req, res) => res.json(['General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Orthopedics', 'Gynecology', 'ENT']));
app.get('/api/cities', (req, res) => res.json(['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']));

// ============ DOCTOR PROFILE ============
app.get('/api/doctor/profile/:userId', (req, res) => {
  const profile = db.prepare(`SELECT dp.*, u.name, u.phone, u.city, u.aadhaar_verified FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE dp.user_id = ?`).get(req.params.userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  profile.free_days = JSON.parse(profile.free_days || '[]');

  // Add ranking
  const total = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND status = 'completed'`).get(profile.user_id).count;
  profile.rank = getDoctorRank(total);
  profile.total_free_consults = total;

  res.json(profile);
});

app.post('/api/doctor/profile', (req, res) => {
  const { userId, department, free_days, max_patients_per_day } = req.body;
  if (!userId || !department || !free_days) return res.status(400).json({ error: 'Missing fields' });
  db.prepare(`INSERT OR REPLACE INTO doctor_profiles (user_id, department, free_days, max_patients_per_day) VALUES (?, ?, ?, ?)`).run(userId, department, JSON.stringify(free_days), max_patients_per_day || 5);
  const profile = db.prepare(`SELECT dp.*, u.name, u.phone, u.city FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE dp.user_id = ?`).get(userId);
  profile.free_days = JSON.parse(profile.free_days);
  res.json({ success: true, profile });
});

// ============ FIND RANDOM DOCTOR (15-day limit) ============
app.post('/api/find-doctor', (req, res) => {
  const { patientId, city, department, preferred_date } = req.body;
  if (!patientId || !city || !department || !preferred_date) return res.status(400).json({ error: 'Missing fields' });

  if (!canBookFreeConsult(patientId)) {
    return res.status(403).json({ error: 'You can only get one free consultation every 15 days.' });
  }

  const weekday = getWeekday(preferred_date);

  const eligible = db.prepare(`
    SELECT dp.*, u.name, u.phone, u.city 
    FROM doctor_profiles dp 
    JOIN users u ON dp.user_id = u.id 
    WHERE u.city = ? AND dp.department = ? AND dp.free_days LIKE ?
  `).all(city, department, `%${weekday}%`);

  if (eligible.length === 0) return res.json({ success: false, message: `No doctors available in ${city} for ${department} on ${weekday}s.` });

  const availableDoctors = [];
  for (const doc of eligible) {
    const booked = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND scheduled_date = ? AND status != 'cancelled'`).get(doc.user_id, preferred_date).count;
    if (booked < (doc.max_patients_per_day || 5)) {
      doc.free_days = JSON.parse(doc.free_days || '[]');
      const total = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND status = 'completed'`).get(doc.user_id).count;
      doc.rank = getDoctorRank(total);
      doc.total_free_consults = total;
      availableDoctors.push(doc);
    }
  }

  if (availableDoctors.length === 0) return res.json({ success: false, message: 'No slots available on this date.' });

  const randomDoctor = availableDoctors[Math.floor(Math.random() * availableDoctors.length)];
  res.json({ success: true, doctor: randomDoctor, message: `Random doctor selected from ${availableDoctors.length} options.` });
});

// ============ BOOK ============
app.post('/api/book', (req, res) => {
  const { patientId, doctorId, scheduled_date } = req.body;
  if (!patientId || !doctorId || !scheduled_date) return res.status(400).json({ error: 'Missing fields' });

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(patientId);
  const doctor = db.prepare('SELECT * FROM users u JOIN doctor_profiles dp ON u.id=dp.user_id WHERE u.id = ?').get(doctorId);
  if (!patient || !doctor) return res.status(404).json({ error: 'User not found' });

  if (!canBookFreeConsult(patientId)) {
    return res.status(403).json({ error: 'You can only get one free consultation every 15 days.' });
  }

  const bookedCount = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND scheduled_date = ? AND status != 'cancelled'`).get(doctorId, scheduled_date).count;
  if (bookedCount >= (doctor.max_patients_per_day || 5)) return res.status(409).json({ error: 'No slots left.' });

  const active = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE patient_id = ? AND status = 'confirmed'`).get(patientId).count;
  if (active >= 1) return res.status(409).json({ error: 'You already have an active booking.' });

  const insert = db.prepare(`INSERT INTO bookings (patient_id, doctor_id, scheduled_date, department, city, consultation_type, status) VALUES (?, ?, ?, ?, ?, 'inperson', 'confirmed')`);
  const info = insert.run(patientId, doctorId, scheduled_date, doctor.department, doctor.city);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);

  res.json({ success: true, booking, message: 'Consultation booked successfully! (Free offline consultation)' });
});

// ============ BOOKINGS ============
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

app.get('/api/bookings/doctor/:doctorId', (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name as patient_name, u.phone as patient_phone, u.city as patient_city 
    FROM bookings b 
    JOIN users u ON b.patient_id = u.id 
    WHERE b.doctor_id = ? 
    ORDER BY b.scheduled_date ASC
  `).all(req.params.doctorId);
  res.json(bookings);
});

// ============ COMPLETE + PRESCRIPTION ============
app.post('/api/complete', (req, res) => {
  const { bookingId, doctorId } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND doctor_id = ?').get(bookingId, doctorId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Can only complete confirmed bookings' });

  db.prepare(`UPDATE bookings SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(bookingId);
  res.json({ success: true, message: 'Consultation marked as completed. Patient can now upload prescription and give feedback.' });
});

// Patient uploads prescription (base64 or text notes)
app.post('/api/upload-prescription', (req, res) => {
  const { bookingId, patientId, prescriptionData } = req.body; // prescriptionData = base64 image or text
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND patient_id = ? AND status = "completed"').get(bookingId, patientId);
  if (!booking) return res.status(404).json({ error: 'Completed booking not found' });

  db.prepare(`UPDATE bookings SET prescription_data = ?, prescription_uploaded_at = datetime('now') WHERE id = ?`).run(prescriptionData, bookingId);
  res.json({ success: true, message: 'Prescription uploaded. Thank you!' });
});

// ============ RATINGS (Stars + Feedback) ============
app.post('/api/rate-doctor', (req, res) => {
  const { patientId, doctorId, bookingId, stars, feedback } = req.body;
  if (!patientId || !doctorId || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Valid stars (1-5) required' });
  }

  // Prevent duplicate rating for same booking
  const existing = db.prepare(`SELECT id FROM ratings WHERE booking_id = ?`).get(bookingId);
  if (existing) return res.status(409).json({ error: 'You have already rated this consultation.' });

  db.prepare(`
    INSERT INTO ratings (patient_id, doctor_id, booking_id, stars, feedback) 
    VALUES (?, ?, ?, ?, ?)
  `).run(patientId, doctorId, bookingId, stars, feedback || '');

  res.json({ success: true, message: 'Thank you for your feedback!' });
});

// Get doctor ratings + average
app.get('/api/doctor-ratings/:doctorId', (req, res) => {
  const ratings = db.prepare(`
    SELECT r.*, u.name as patient_name 
    FROM ratings r 
    JOIN users u ON r.patient_id = u.id 
    WHERE r.doctor_id = ? 
    ORDER BY r.created_at DESC
  `).all(req.params.doctorId);

  const avgRow = db.prepare(`SELECT AVG(stars) as avg_stars, COUNT(*) as total FROM ratings WHERE doctor_id = ?`).get(req.params.doctorId);
  const totalCompleted = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND status = 'completed'`).get(req.params.doctorId).count;

  res.json({
    ratings,
    average: avgRow.avg_stars ? parseFloat(avgRow.avg_stars).toFixed(1) : null,
    total_ratings: avgRow.total,
    total_free_consults: totalCompleted,
    rank: getDoctorRank(totalCompleted)
  });
});

// ============ HEALTH ============
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 FreeDoc India (Real Test Version) running on port ${PORT}`);
  console.log('Features: Aadhaar mock, OTP mock (123456), 15-day limit, Prescription upload, Stars + Creative doctor ranking');
});
