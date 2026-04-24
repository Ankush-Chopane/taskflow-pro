⚠️ RENDER DEPLOYMENT CHECKLIST - MONGODB FIX

══════════════════════════════════════════════════════════════════════════════

✅ STEP 1: VERIFY MONGODB ATLAS CONNECTION STRING

1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Create a cluster (or use existing)
3. Click "CONNECT" button
4. Select "Drivers" → Node.js
5. Copy the connection string:
   
   mongodb+srv://username:password@cluster-name.mongodb.net/taskflow?retryWrites=true&w=majority

   ⚠️ IMPORTANT: Replace:
   - <password> with your database user password
   - <username> with your database user username

✅ STEP 2: SET ENVIRONMENT VARIABLES IN RENDER

Go to Render Dashboard → taskflow-backend → Environment

CRITICAL VARIABLES (must be exact):

┌─ MONGO_URI ─────────────────────────────────────────────────────────
│ mongodb+srv://username:password@cluster-name.mongodb.net/taskflow?retryWrites=true&w=majority
└─────────────────────────────────────────────────────────────────────

┌─ JWT_SECRET ─────────────────────────────────────────────────────────
│ (generate random: openssl rand -base64 32)
│ Example: kT8mJhX2nP9qR5sY7vW3aB4cD6eF1gH9iJ0kL
└─────────────────────────────────────────────────────────────────────

┌─ GROQ_API_KEY ───────────────────────────────────────────────────────
│ gsk_Your_Actual_Groq_API_Key_Here
└─────────────────────────────────────────────────────────────────────

┌─ NODE_ENV ────────────────────────────────────────────────────────────
│ production
└─────────────────────────────────────────────────────────────────────

┌─ PORT ────────────────────────────────────────────────────────────────
│ 10000
└─────────────────────────────────────────────────────────────────────

┌─ FRONTEND_URL ────────────────────────────────────────────────────────
│ https://your-vercel-domain.vercel.app
└─────────────────────────────────────────────────────────────────────

Optional:
- EMAIL_HOST: smtp.gmail.com
- EMAIL_PORT: 587
- EMAIL_USER: your-email@gmail.com
- EMAIL_PASS: your-app-password

✅ STEP 3: PUSH CODE CHANGES

Run in terminal:
  
  git add .
  git commit -m "Add MongoDB connection debugging"
  git push

✅ STEP 4: REDEPLOY IN RENDER

Option A: Automatic (recommended)
  - Push to GitHub → Render auto-deploys

Option B: Manual
  - Go to Render Dashboard → taskflow-backend
  - Click "Manual Deploy" button
  - Select "Deploy latest commit"

✅ STEP 5: CHECK LOGS IN RENDER

After deployment:
1. Go to Render Dashboard → taskflow-backend
2. Click "Logs" tab
3. Look for:
   ✅ "ENVIRONMENT VARIABLES CHECK:"
   ✅ "Attempting MongoDB connection..."
   ✅ "MongoDB connected successfully"

If you see "MONGO_URI: ❌ MISSING" → Variables not set in Render!

══════════════════════════════════════════════════════════════════════════════

🔴 COMMON ERRORS & FIXES:

Error: "MongoParseError: Invalid scheme"
→ MONGO_URI is undefined or wrong format
→ FIX: Check MongoDB connection string in Render env vars

Error: "authentication failed"
→ Wrong username/password in MongoDB Atlas
→ FIX: Verify credentials in MongoDB Atlas

Error: "no server found matching host"
→ IP whitelist in MongoDB Atlas
→ FIX: Go to MongoDB Atlas → Network Access → Add IP Address 0.0.0.0/0

Error: "Cannot GET /api/health"
→ Backend not running
→ FIX: Check Render logs for startup errors

══════════════════════════════════════════════════════════════════════════════

📍 VERIFY IT WORKS:

After successful deployment:

1. Test health endpoint:
   curl https://your-render-backend-url/api/health

   Should return: {"status":"OK","time":"2026-04-25T..."}

2. Check logs for:
   ✅ ENVIRONMENT VARIABLES CHECK:
   ✅ MONGO_URI: ✅ SET
   ✅ MongoDB connected successfully

═══════════════════════════════════════════════════════════════════════════════
