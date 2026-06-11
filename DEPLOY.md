# FreeDoc India MVP — Launch & Deployment Guide (Updated for Ultra-Low Budget)

## Minimum Viable Launch Budget: ₹0 – ₹1,000 (First 1-2 Months)

This guide is tailored for someone who wants a **live, usable website** with almost no money.

### Current State of Your Project
- Fully working MVP (free offline consultations + random doctor matching)
- Already on GitHub
- Node.js + SQLite + beautiful frontend
- Ready to deploy

---

## Realistic Budget Breakdown (₹500 vs ₹1000)

| Item                          | Free / ₹0 Option                  | Cheap Paid Option                  | Recommended for Launch | Cost (First 2 months) |
|-------------------------------|-----------------------------------|------------------------------------|------------------------|-----------------------|
| **Domain (.in)**             | None (use render.app subdomain)  | Godaddy / Hostinger / BigRock     | Yes (professional)    | ₹1 – ₹99 (1st year) + ₹700 renewal |
| **Hosting**                  | Render.com (free tier)           | Render/Railway free + paid        | Render Free           | ₹0 (first months)    |
| **Database**                 | SQLite (current)                 | SQLite (fine for now)             | SQLite                | ₹0                   |
| **Basic Auth / OTP**         | Phone number only (current)      | Fast2SMS / 2Factor (₹0.20/SMS)    | Add later             | ₹50–150 (for 200-600 OTPs) |
| **Doctor Verification**      | Manual (WhatsApp/Email)          | Manual + Google Form              | Manual                | ₹0                   |
| **Legal Disclaimer**         | Simple text                      | Simple text + lawyer review (optional) | Must have          | ₹0 – ₹500 (one time) |
| **SSL / Security**           | Automatic on good hosts          | Automatic                         | Automatic             | ₹0                   |
| **Admin Tools**              | None                             | Basic (future)                    | Skip for now          | ₹0                   |
| **Total Realistic**          | **₹0 – ₹100**                    | **₹300 – ₹800**                   | —                     | **₹100 – ₹900**      |

---

## What is **Inevitable** (You Cannot Skip These)

### 1. Doctor Verification (Most Important)
You **cannot** legally or ethically let anyone register as a doctor without checking they are a registered medical practitioner.

**Cheap way under budget:**
- Doctors fill a Google Form with:
  - Name, Phone, Qualification, Registration Number (NMC/State)
  - Upload photo of degree + registration certificate
- You manually verify on NMC website (free public search)
- Only then manually create their account or approve them in the app

This is **non-negotiable** for any serious launch in India.

### 2. Basic Legal Disclaimer + Consent
Add a simple page:
- "This is a free consultation matching service only"
- "Doctors are independently verified by us"
- "We are not responsible for medical advice given"
- Patient must accept before booking

You can write this yourself (I can give you ready text). Cost: ₹0

For better protection, get a basic review from a lawyer later (₹2,000–5,000 one time — not in current budget).

### 3. Data Privacy Notice
Mention that you collect name, phone, city, and booking details.

---

## Recommended Path Under ₹1,000 (Realistic Plan)

### Week 1: Get It Live (Cost: ₹0 – ₹99)

**Option A: Almost Free (Recommended to start)**
1. Deploy on **Render.com free tier** (takes 5-10 mins)
2. Your URL will be: `https://freedoc-india-mvp.onrender.com`
3. Use this for testing with real doctors/patients first

**Option B: Professional Look (₹1–₹99)**
- Buy a .in domain (first year often ₹1–₹99 on Godaddy, Hostinger, BigRock)
- Point it to your Render app
- Looks much more serious

### Week 1-2: Make It Safer (Cost: ₹0 – ₹200)

1. **Remove all demo data** (I can help clean the seed script)
2. **Add manual doctor approval** (you control who gets in)
3. **Add a strong disclaimer** on booking page
4. **Switch from phone-only login** to phone + basic verification (later)

### Month 1: Add Light OTP (Cost: ₹50 – ₹150)

If you want real users:
- Use **Fast2SMS** or **2Factor.in**
- Cost ≈ ₹0.20 per OTP
- For 300–500 signups in first month = ₹60 – ₹100

This is the only paid service you will probably need early.

---

## What You Can Skip Completely Right Now (Save Money)

- Custom domain (use the free subdomain first)
- Paid hosting (free tier is enough for first 100-300 users)
- Moving to PostgreSQL (SQLite is fine)
- Video calling (you are doing offline only)
- Payments / Razorpay (you are free)
- Ratings, reviews, admin dashboard
- WhatsApp integration

---

## One-Time Costs You Should Budget Later (After ₹1000)

- Proper lawyer review of disclaimer + terms: ₹2,000 – 5,000
- Better SMS gateway with DLT (if volume grows): ₹1,000+
- Domain renewal (year 2): ₹700–900
- Basic logo + branding: ₹500–1,500 (can do with Canva free)

---

## Immediate Action Plan (Next 48 Hours)

1. **Today**: Deploy on Render free tier
2. **Today/Tomorrow**: Clean demo data + add disclaimer (I can generate the code)
3. **This week**: Decide on domain (₹99 or free subdomain)
4. **Next week**: Start manual doctor onboarding via Google Form + WhatsApp

---

## Summary: Minimum to Launch Under ₹1000

| Must Have                  | Cost       | Status     |
|---------------------------|------------|------------|
| Hosting (Render free)     | ₹0         | Ready      |
| Domain (optional)         | ₹1–99      | Optional   |
| OTP for first 300 users   | ₹60–100    | Recommended|
| Manual doctor verification| ₹0         | **Inevitable** |
| Basic legal text          | ₹0         | **Inevitable** |
| **Total**                 | **₹100 – ₹300** | —     |

You can realistically get a **live, usable website** for under ₹300–500 in the first 1-2 months.

The biggest risks are not technical — they are **legal/ethical** (doctor verification + disclaimers).

Would you like me to:
- Give you ready-to-paste legal disclaimer text?
- Create a "remove demo data + add manual doctor approval" update?
- Give exact step-by-step for deploying on Render right now?
- Generate a simple Google Form + approval flow?

Just tell me the next piece you want.
