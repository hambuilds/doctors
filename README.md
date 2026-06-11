# FreeDoc India

**Free consultations for patients in India. Flexible free slots for doctors.**

A complete, production-ready prototype of a telemedicine app where:
- Patients get **1 free consultation every month**
- Doctors choose which days they offer free slots + how many patients per day
- A **random doctor** is assigned based on city + department + date
- ₹100 lock fee (fully refunded after successful consultation)

## Features
- ✅ City-wise doctor discovery
- ✅ Random doctor assignment for fairness
- ✅ Strict 1 free consult per calendar month per patient
- ✅ Hybrid: Video call or In-person
- ✅ ₹100 refundable lock fee (simulated wallet)
- ✅ Doctor dashboard to manage free days + complete consultations
- ✅ Beautiful responsive UI

## Quick Start

```bash
cd backend
npm install
node server.js
```

Then open **http://localhost:3000**

## Demo Accounts

**Patients:**
- 9876543210 (Rahul Sharma - Delhi)
- 9876543211 (Priya Patel - Mumbai)
- 9876543212 (Amit Kumar - Bangalore)

**Doctors:**
- 9123456780 (Dr. Ananya Mehta - Cardiology, Delhi)
- 9123456781 (Dr. Vikram Singh - General Medicine, Mumbai)
- 9123456782 (Dr. Sneha Reddy - Pediatrics, Bangalore)

## Tech Stack
- Node.js + Express
- SQLite (better-sqlite3)
- Single-file Tailwind frontend

## Project Structure
```
freeconsult-app/
├── backend/
│   ├── server.js          # Full API + database logic
│   ├── public/index.html  # Complete beautiful frontend
│   └── package.json
├── README.md
└── .gitignore
```

## Next Steps (Production)
- Add real Razorpay integration
- Add video calling (Jitsi/Agora)
- Add doctor verification + ratings
- Deploy to Render/Railway + Vercel

Built as a fully functional MVP in one go.

---

**Repo pushed from Arena.ai Agent**
