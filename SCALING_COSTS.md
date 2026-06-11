# FreeDoc India — Cost to Scale (Realistic 2026 Numbers)

This document gives you **honest, India-specific cost projections** as your app grows from MVP to thousands of users.

All numbers are in **INR** and based on current 2026 pricing (Render, Railway, MSG91, Fast2SMS, 2Factor, etc.).

---

## Summary Table (Monthly Recurring Cost)

| Monthly Active Users | Hosting + DB | SMS/OTP (if 30% use phone login) | Other (Domain, Tools, Misc) | **Total Monthly Cost** | Notes |
|----------------------|--------------|----------------------------------|-----------------------------|------------------------|-------|
| **0 – 300** (MVP)    | ₹0 (Free tier) | ₹0 – ₹60 | ₹0 – ₹99 (domain) | **₹0 – ₹150** | Current stage |
| **300 – 1,000**      | ₹0 – ₹800 | ₹150 – ₹400 | ₹100 – ₹200 | **₹300 – ₹1,400** | Still manageable |
| **1,000 – 5,000**    | ₹1,500 – ₹4,000 | ₹800 – ₹2,500 | ₹300 – ₹600 | **₹3,000 – ₹7,000** | Need paid plans |
| **5,000 – 15,000**   | ₹5,000 – ₹12,000 | ₹3,000 – ₹8,000 | ₹800 – ₹1,500 | **₹10,000 – ₹22,000** | Real scaling begins |
| **15,000 – 50,000**  | ₹15,000 – ₹40,000 | ₹10,000 – ₹25,000 | ₹2,000+ | **₹30,000 – ₹70,000+** | Professional infra needed |

---

## Detailed Breakdown by Component

### 1. Hosting & Compute (Biggest fixed cost after SMS)

| Scale                  | Platform & Plan          | Approx Monthly Cost | Notes |
|------------------------|--------------------------|---------------------|-------|
| 0 – 800 users          | Render Free / Railway Hobby | ₹0                  | Sleeps after inactivity |
| 800 – 3,000 users      | Render Starter / Railway Pro | ₹700 – ₹2,500      | No sleep, better CPU |
| 3,000 – 10,000 users   | Render Standard / Railway Team | ₹3,000 – ₹8,000   | 2–4 instances |
| 10,000+ users          | Multiple instances + CDN | ₹10,000 – ₹30,000+ | Need load balancing |

**Recommendation**:
- First 6–12 months → Stick with Render Free + Railway free credits
- When you hit consistent 800–1,000 users/month → Move to paid plan (~₹1,500–2,500/month)

### 2. Database

| Scale              | Solution                  | Monthly Cost     | When to Switch |
|--------------------|---------------------------|------------------|----------------|
| Up to ~2,000 users | SQLite (current)          | ₹0               | Good enough |
| 2,000 – 10,000     | Postgres on Render/Railway/Supabase | ₹0 – ₹1,500     | Recommended |
| 10,000+            | Managed Postgres (AWS RDS / Neon / Supabase Pro) | ₹2,000 – ₹8,000 | Must |

**Current SQLite is fine until you have serious concurrent bookings.**

### 3. SMS / OTP (The Silent Killer at Scale)

This is usually the **largest variable cost** in Indian apps.

Current real rates (2026):
- Fast2SMS / 2Factor / MSG91: **₹0.18 – ₹0.28 per OTP** (after DLT)
- Average realistic: **₹0.22 – ₹0.25 per SMS**

| Monthly New Signups | OTPs Sent (30% phone login) | Monthly SMS Cost |
|---------------------|-----------------------------|------------------|
| 300                 | 90                          | ₹20 – ₹25        |
| 1,000               | 300                         | ₹65 – ₹80        |
| 5,000               | 1,500                       | ₹330 – ₹400      |
| 10,000              | 3,000                       | ₹660 – ₹800      |
| 20,000              | 6,000                       | ₹1,300 – ₹1,600  |

**Important**: Many users will use the same phone for multiple logins. Real cost is usually 40–60% of the "worst case" numbers above.

**Pro Tip**: Offer email login + Google/Apple as alternatives to reduce SMS usage by 50%+.

### 4. Domain & Basic Tools

- .in Domain: ₹700 – ₹900 per year (after first year promo)
- SSL: Free (automatic)
- Error monitoring (Sentry): Free up to 5k errors/month
- Uptime monitoring: Free (UptimeRobot)

### 5. Other Costs That Appear at Scale

| Cost Type                    | 1,000 users | 10,000 users | 50,000 users |
|-----------------------------|-------------|--------------|--------------|
| Customer Support (part-time) | ₹0 – ₹3,000 | ₹8,000 – ₹15,000 | ₹25,000+ |
| Doctor Verification (manual) | ₹0          | ₹5,000 – ₹10,000 | Need automation |
| Legal / Compliance          | ₹0 – ₹2,000 | ₹5,000 – ₹15,000 (one time + annual) | High |
| Marketing / Doctor Acquisition | ₹0       | ₹10,000+     | Very high |
| Payment Gateway (if you add paid consults later) | — | 2% + GST     | 2% + GST |

---

## Scaling Tiers – What Changes at Each Level

### Tier 1: MVP / Validation (0 – 500 users/month)
**Monthly Cost**: ₹0 – ₹200
- Render Free tier
- SQLite
- Manual doctor verification via WhatsApp
- Phone number login (no OTP)
- One person handling everything

**Goal**: Prove people actually want this.

### Tier 2: Early Traction (500 – 3,000 users/month)
**Monthly Cost**: ₹800 – ₹3,500
- Move to Render Starter or Railway paid (~₹1,500–2,500)
- Add cheap OTP (Fast2SMS)
- Start semi-manual verification process
- Add basic clinic address + doctor profile

### Tier 3: Real Business (5,000 – 15,000 users/month)
**Monthly Cost**: ₹8,000 – ₹20,000
- Proper Postgres database
- 2–3 server instances
- Automated or semi-automated doctor verification
- Dedicated support person (part-time)
- Monitoring + logging tools
- Start thinking about ABDM integration

### Tier 4: Serious Scale (20,000+ users/month)
**Monthly Cost**: ₹30,000 – ₹1,00,000+
- Multiple regions / load balancing
- Full DLT registered SMS gateway
- Dedicated backend + support team
- Proper compliance (ABDM, DPDP Act audits)
- Possibly move to custom infrastructure

---

## One-Time Costs When Scaling

| Item                              | Estimated Cost     | When You Need It |
|-----------------------------------|--------------------|------------------|
| Basic lawyer review (disclaimer + terms) | ₹3,000 – ₹8,000 | Before 1,000 users |
| DLT Registration (for SMS)        | ₹1,000 – ₹2,500 (one time) | When sending > few hundred SMS/month |
| Domain + Branding                 | ₹1,000 – ₹3,000    | Early |
| Basic Admin Panel development     | ₹0 (you build) or ₹15k–30k | 3,000+ users |
| ABDM Integration (if required)    | ₹50,000 – ₹2,00,000 | Government schemes or high trust |

---

## Cost Optimization Tips (Very Important)

1. **Reduce SMS usage aggressively**
   - Allow email + social login
   - Remember devices for 30–60 days
   - Use WhatsApp for reminders instead of SMS (much cheaper)

2. **Keep SQLite as long as possible**
   - Many successful Indian startups ran on SQLite for first 5k–10k users.

3. **Manual verification first**
   - Don't build automated doctor verification until you have real volume.

4. **Start with one or two cities**
   - Much cheaper to acquire and support users in Delhi + Mumbai than pan-India.

5. **Use free tiers smartly**
   - Render + Railway free credits can last 6–12 months if you're careful.

---

## Final Recommendation by Your Goal

| Your Goal                          | Target Monthly Cost | Timeline | Key Investments |
|------------------------------------|---------------------|----------|-----------------|
| Test with 50–200 real users        | ₹0 – ₹200           | Now      | None (use current setup) |
| Reach 1,000 users                  | ₹800 – ₹2,000       | 3–6 months | Paid hosting + OTP |
| Reach 5,000–10,000 users           | ₹5,000 – ₹12,000    | 9–18 months | DB upgrade + verification system |
| Sustainable business               | ₹20,000 – ₹50,000+  | 18+ months | Team + compliance |

---

**Bottom Line:**

- Up to **1,000 users/month** → You can run this for **under ₹2,000/month**.
- Up to **5,000 users/month** → Expect **₹5,000 – ₹8,000/month**.
- The two biggest costs as you grow will be:
  1. **SMS/OTP**
  2. **Hosting + Database**

Would you like me to create a **specific 6-month scaling roadmap** with exact milestones and when to spend money?

Or tell me your target number of users in the next 6–12 months and I’ll give you a precise cost + tech upgrade plan.
