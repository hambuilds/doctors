# How to Test FreeDoc India with a Free Domain (Using GitHub)

You **cannot** get a free domain directly from GitHub for a backend app.

However, you **can** connect your GitHub repo to free hosting platforms that give you a **free subdomain** (like `yourapp.onrender.com`).

This is the closest and easiest thing to a "GitHub free domain".

---

## Recommended: Deploy on Render.com (Free Tier + GitHub)

This is the **fastest and cleanest** way.

### Step-by-Step (Takes 5–10 minutes)

1. **Go to Render**
   - Open: https://render.com
   - Sign up with **GitHub** (recommended — it will directly access your repo)

2. **Create a New Web Service**
   - After logging in, click the big **"+ New +"** button
   - Choose **"Web Service"**

3. **Connect Your GitHub Repo**
   - Click **"Connect"** next to your GitHub account
   - Find and select the repo: `hambuilds/doctors`
   - Click **Connect**

4. **Configure the Service**
   Fill these details:

   | Field                  | Value                                      |
   |------------------------|--------------------------------------------|
   | **Name**               | `freedoc-india-mvp` (or anything you like) |
   | **Region**             | Oregon (or the closest to you)             |
   | **Branch**             | `main`                                     |
   | **Root Directory**     | (leave empty)                              |
   | **Build Command**      | `cd backend && npm install`                |
   | **Start Command**      | `cd backend && node server.js`             |
   | **Plan**               | **Free**                                   |

   Add these **Environment Variables**:
   - `NODE_ENV` → `production`
   - `PORT` → `10000`

5. **Click "Create Web Service"**

6. **Wait for Deployment**
   - Render will automatically build and deploy from your GitHub repo.
   - First deploy takes 3–6 minutes.

7. **Get Your Free Domain**
   - Once deployed, you will see a URL like:
     ```
     https://freedoc-india-mvp.onrender.com
     ```
   - This is your **free domain** (subdomain provided by Render).

---

## How to Test It Live

1. Open the URL in your browser (e.g. `https://freedoc-india-mvp.onrender.com`)

2. Use the demo accounts:
   - **Patient**: `9876543210`
   - **Doctor**: `9123456780`

3. Test the full flow:
   - Login as patient → Book a free consultation
   - Login as doctor → See the booking → Mark as completed

---

## Important Notes About Free Tier

- **Sleeps after inactivity**: If no one visits for ~15 minutes, the app goes to sleep.
- First request after sleep can take **20–40 seconds** (cold start).
- This is normal and acceptable for testing / early MVP.
- The URL will always be free as long as you use the Free plan.

---

## Alternative: Railway.app (Also Free + GitHub)

If you want another option:

1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub repo
4. Select `hambuilds/doctors`
5. In settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add variable: `NODE_ENV=production`

You will get a free URL like: `https://your-project-name.up.railway.app`

---

## Next Steps After Testing

Once you're happy with the live test:

1. Remove demo data (I can help generate the code)
2. Add a proper disclaimer
3. Start manual doctor verification process
4. (Optional) Buy a cheap .in domain later (~₹99 first year) and point it to this URL

---

## Quick Commands (if you make changes)

After any code change:

```bash
git add .
git commit -m "your message"
git push origin main
```

Render/Railway will automatically redeploy.

---

**You now have a live public URL connected to your GitHub repo — completely free.**

Would you like me to:
- Give you the exact steps with screenshots description?
- Prepare the code to remove demo data before going live?
- Add a nice landing/disclaimer page?
- Help you set up a custom domain later?

Just say the word!
