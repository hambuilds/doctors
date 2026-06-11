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

// ============ DATABASE SETUP (MVP - Free Offline Only) ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    role TEXT CHECK(role IN ('patient', 'doctor')) NOT NULL,
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
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY(patient_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );
`);

// ============ SEED DATA ============
const seedData = () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  console.log('Seeding demo data for MVP...');

  const insertUser = db.prepare(`INSERT INTO users (name, phone, city, role) VALUES (?, ?, ?, ?)`);

  const patients = [
    ['Rahul Sharma', '9876543210', 'Delhi', 'patient'],
    ['Priya Patel', '9876543211', 'Mumbai', 'patient'],
    ['Amit Kumar', '9876543212', 'Bangalore', 'patient'],
  ];
  const patientIds = patients.map(p => insertUser.run(...p).lastInsertRowid);

  const doctors = [
    ['Dr. Ananya Mehta', '9123456780', 'Delhi', 'doctor'],
    ['Dr. Vikram Singh', '9123456781', 'Mumbai', 'doctor'],
    ['Dr. Sneha Reddy', '9123456782', 'Bangalore', 'doctor'],
    ['Dr. Rajesh Verma', '9123456783', 'Delhi', 'doctor'],
    ['Dr. Kavita Joshi', '9123456784', 'Hyderabad', 'doctor'],
    ['Dr. Arjun Nair', '9123456785', 'Chennai', 'doctor'],
  ];
  const doctorUserIds = doctors.map(d => insertUser.run(...d).lastInsertRowid);

  const insertProfile = db.prepare(`INSERT INTO doctor_profiles (user_id, department, free_days, max_patients_per_day) VALUES (?, ?, ?, ?)`);
  const profiles = [
    [doctorUserIds[0], 'Cardiology', JSON.stringify(['Monday', 'Wednesday', 'Friday']), 4],
    [doctorUserIds[1], 'General Medicine', JSON.stringify(['Tuesday', 'Thursday', 'Saturday']), 6],
    [doctorUserIds[2], 'Pediatrics', JSON.stringify(['Monday', 'Thursday']), 3],
    [doctorUserIds[3], 'Dermatology', JSON.stringify(['Wednesday', 'Friday']), 5],
    [doctorUserIds[4], 'Orthopedics', JSON.stringify(['Monday', 'Tuesday', 'Friday']), 4],
    [doctorUserIds[5], 'General Medicine', JSON.stringify(['Wednesday', 'Saturday']), 5],
  ];
  profiles.forEach(p => insertProfile.run(...p));

  // Sample confirmed bookings (MVP)
  const insertBooking = db.prepare(`INSERT INTO bookings (patient_id, doctor_id, scheduled_date, department, city, consultation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const today = new Date();
  const futureDate1 = new Date(today.getTime() + 3*86400000).toISOString().split('T')[0];
  const futureDate2 = new Date(today.getTime() + 5*86400000).toISOString().split('T')[0];

  insertBooking.run(patientIds[1], doctorUserIds[1], futureDate1, 'General Medicine', 'Mumbai', 'inperson', 'confirmed');
  insertBooking.run(patientIds[2], doctorUserIds[2], futureDate2, 'Pediatrics', 'Bangalore', 'inperson', 'confirmed');

  console.log('MVP Demo data seeded!');
};

seedData();

// ============ HELPERS ============
const getWeekday = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

// ============ API ROUTES ============

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
  if (!user) return res.status(404).json({ error: 'User not found. Please register.' });
  res.json({ success: true, user });
});

app.get('/api/departments', (req, res) => res.json(['General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Orthopedics', 'Gynecology', 'ENT']));
app.get('/api/cities', (req, res) => res.json(['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']));

app.get('/api/doctor/profile/:userId', (req, res) => {
  const profile = db.prepare(`SELECT dp.*, u.name, u.phone, u.city FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE dp.user_id = ?`).get(req.params.userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  profile.free_days = JSON.parse(profile.free_days || '[]');
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

// Find random doctor (MVP - free offline)
app.post('/api/find-doctor', (req, res) => {
  const { patientId, city, department, preferred_date } = req.body;
  if (!patientId || !city || !department || !preferred_date) return res.status(400).json({ error: 'Missing fields' });

  const weekday = getWeekday(preferred_date);
  const currentMonth = getCurrentMonth();

  const completedThisMonth = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE patient_id = ? AND status = 'completed' AND strftime('%Y-%m', scheduled_date) = ?`).get(patientId, currentMonth).count;
  if (completedThisMonth >= 1) return res.status(403).json({ error: 'You have already used your 1 free consultation this month.' });

  const eligible = db.prepare(`SELECT dp.*, u.name, u.phone, u.city FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.city = ? AND dp.department = ? AND dp.free_days LIKE ?`).all(city, department, `%${weekday}%`);
  if (eligible.length === 0) return res.json({ success: false, message: `No doctors available in ${city} for ${department} on ${weekday}s.` });

  const availableDoctors = [];
  for (const doc of eligible) {
    const booked = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND scheduled_date = ? AND status != 'cancelled'`).get(doc.user_id, preferred_date).count;
    if (booked < (doc.max_patients_per_day || 5)) {
      doc.free_days = JSON.parse(doc.free_days || '[]');
      availableDoctors.push(doc);
    }
  }
  if (availableDoctors.length === 0) return res.json({ success: false, message: 'No slots available on this date.' });

  const randomDoctor = availableDoctors[Math.floor(Math.random() * availableDoctors.length)];
  res.json({ success: true, doctor: randomDoctor, message: `Random doctor selected from ${availableDoctors.length} options.` });
});

// Book - MVP: Free + Offline only
app.post('/api/book', (req, res) => {
  const { patientId, doctorId, scheduled_date } = req.body;
  if (!patientId || !doctorId || !scheduled_date) return res.status(400).json({ error: 'Missing fields' });

  const patient = db.prepare('SELECT * FROM users WHERE id = ?').get(patientId);
  const doctor = db.prepare('SELECT * FROM users u JOIN doctor_profiles dp ON u.id=dp.user_id WHERE u.id = ?').get(doctorId);
  if (!patient || !doctor) return res.status(404).json({ error: 'User not found' });

  const currentMonth = getCurrentMonth();
  const completedThisMonth = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE patient_id = ? AND status = 'completed' AND strftime('%Y-%m', scheduled_date) = ?`).get(patientId, currentMonth).count;
  if (completedThisMonth >= 1) return res.status(403).json({ error: 'Monthly free consultation limit reached.' });

  const bookedCount = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ? AND scheduled_date = ? AND status != 'cancelled'`).get(doctorId, scheduled_date).count;
  if (bookedCount >= (doctor.max_patients_per_day || 5)) return res.status(409).json({ error: 'No slots left.' });

  const active = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE patient_id = ? AND status = 'confirmed'`).get(patientId).count;
  if (active >= 1) return res.status(409).json({ error: 'You already have an active booking. Cancel or complete it first.' });

  const insert = db.prepare(`INSERT INTO bookings (patient_id, doctor_id, scheduled_date, department, city, consultation_type, status) VALUES (?, ?, ?, ?, ?, 'inperson', 'confirmed')`);
  const info = insert.run(patientId, doctorId, scheduled_date, doctor.department, doctor.city);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);

  res.json({ success: true, booking, message: 'Consultation booked successfully! (Free offline consultation)' });
});

app.get('/api/bookings/patient/:patientId', (req, res) => {
  const bookings = db.prepare(`SELECT b.*, u.name as doctor_name, u.phone as doctor_phone FROM bookings b JOIN users u ON b.doctor_id = u.id WHERE b.patient_id = ? ORDER BY b.scheduled_date DESC`).all(req.params.patientId);
  res.json(bookings);
});

app.get('/api/bookings/doctor/:doctorId', (req, res) => {
  const bookings = db.prepare(`SELECT b.*, u.name as patient_name, u.phone as patient_phone, u.city as patient_city FROM bookings b JOIN users u ON b.patient_id = u.id WHERE b.doctor_id = ? ORDER BY b.scheduled_date ASC`).all(req.params.doctorId);
  res.json(bookings);
});

// Complete - no refund in MVP
app.post('/api/complete', (req, res) => {
  const { bookingId, doctorId } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND doctor_id = ?').get(bookingId, doctorId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Can only complete confirmed bookings' });

  db.prepare(`UPDATE bookings SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(bookingId);
  res.json({ success: true, message: 'Consultation marked as completed. Thank you!' });
});

// Cancel
app.post('/api/cancel', (req, res) => {
  const { bookingId } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking || booking.status !== 'confirmed') return res.status(400).json({ error: 'Can only cancel active bookings' });

  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(bookingId);
  res.json({ success: true, message: 'Booking cancelled successfully.' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 FreeDoc India MVP (Free Offline) running on http://localhost:${PORT}`);
  console.log('Demo phones: 9876543210 (patient) | 9123456780 (doctor)');
});
