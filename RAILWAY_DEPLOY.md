# Alternative: Deploy on Railway.app (No Credit Card Needed)

Render sometimes asks for a credit card even on the free plan (very common for users in India and some other countries).

**Railway.app** is currently the best free alternative for your use case.

### Step-by-Step: Deploy on Railway (Free)

1. Go to: [https://railway.app](https://railway.app)

2. Click **"Login"** → Choose **GitHub**

3. After logging in, click **"New Project"**

4. Click **"Deploy from GitHub Repo"**

5. Select your repo: `hambuilds/doctors`

6. Railway will detect it. In the settings that appear:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

7. Click **"Deploy"**

8. Wait for the build (usually 2-4 minutes).

9. Once deployed, you will see a live URL like:
   ```
   https://freedoc-india-mvp-production.up.railway.app
   ```

This is your **free subdomain**.

### Important: Add Environment Variable

After deployment:
- Go to your project → **Variables** tab
- Add:
  - `NODE_ENV` = `production`

Then click **"Deploy"** again (or it will redeploy automatically).

### How to Use It

Same as before:
- Open the Railway URL
- Friends can register with their real phone numbers
- Test booking flow

### Railway Free Tier Notes (2026)

- You get **$5 credit per month** (usually enough for small testing)
- App stays awake better than Render free tier
- No credit card required for most users during initial setup
- If you exceed the credit, it will pause (you'll get warned)

### If Railway Also Asks for Card

Try these in order:
1. Use a different browser / incognito
2. Try **Koyeb.com** (also has free tier)
3. As last resort, add a low-limit virtual card (like from some Indian banks or services like Wise) just to verify, then you can often remove it.

---

Would you like me to also create instructions for **Koyeb** as a backup?

Once deployed, share the URL here and I can help you with:
- Adding a testing disclaimer
- Making small improvements for your friends
- Removing any remaining demo references (already mostly done)

Good luck with the deployment!
