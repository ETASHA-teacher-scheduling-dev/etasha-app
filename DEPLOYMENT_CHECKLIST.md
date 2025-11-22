# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment Complete

- [x] Supabase project created: `vuiqklucyjngwvmpzxyw`
- [x] Database tables created (10 tables)
- [x] RLS enabled on all tables
- [x] Frontend configured for environment variables
- [x] Backend CORS configured
- [x] Render configuration file created

## 📝 What You Need

### Supabase Database Password
Get it from: https://app.supabase.com/project/vuiqklucyjngwvmpzxyw/settings/database
- Click "Reset Database Password"
- Copy the new password immediately
- Save it somewhere safe (you'll need it for Render)

## 🎯 Deployment Steps

### Step 1: Deploy Backend to Render (15 minutes)

1. **Go to Render:** https://render.com
   - Sign up with GitHub
   
2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect repository: `ETASHA-teacher-scheduling-dev/etasha-app`
   
3. **Configure Service:**
   ```
   Name: etasha-backend
   Region: Singapore
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8080
   SUPABASE_DB_PASSWORD=<paste-your-supabase-password>
   FRONTEND_URL=*
   ```
   (You'll update FRONTEND_URL after deploying frontend)

5. **Deploy & Wait**
   - Takes 5-10 minutes
   - Copy your backend URL when done (e.g., `https://etasha-backend-xxxx.onrender.com`)

### Step 2: Deploy Frontend to Vercel (10 minutes)

1. **Go to Vercel:** https://vercel.com
   - Sign up with GitHub
   
2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select repository: `ETASHA-teacher-scheduling-dev/etasha-app`
   
3. **Configure Project:**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   ```

4. **Add Environment Variable:**
   ```
   REACT_APP_API_URL=https://etasha-backend-xxxx.onrender.com/api
   ```
   (Replace with your actual Render URL from Step 1)

5. **Deploy & Wait**
   - Takes 2-5 minutes
   - Copy your frontend URL when done (e.g., `https://etasha-app-xxxx.vercel.app`)

### Step 3: Update Backend CORS (5 minutes)

1. **Go back to Render Dashboard**
   - Open your backend service
   - Go to "Environment" tab
   
2. **Update FRONTEND_URL:**
   ```
   FRONTEND_URL=https://etasha-app-xxxx.vercel.app
   ```
   (Replace with your actual Vercel URL from Step 2)

3. **Save Changes**
   - Render will auto-redeploy (takes 2-3 minutes)

### Step 4: Test Your App! 🎉

1. **Visit your Vercel URL**
2. **Try to log in:**
   - You'll need to seed the database first (see below)
   
## 🌱 Seed the Database

### Option A: Via Render Shell
1. Go to Render dashboard → Your service → "Shell" tab
2. Run:
   ```bash
   node seed.js
   ```

### Option B: I can seed it via Supabase MCP
Just tell me and I'll populate it with test data directly!

## 🎯 Expected URLs

After deployment:
- **Frontend:** `https://etasha-app-xxxx.vercel.app`
- **Backend:** `https://etasha-backend-xxxx.onrender.com`
- **Backend Health:** `https://etasha-backend-xxxx.onrender.com/` (should show welcome message)

## 🆘 Troubleshooting

**Backend won't start:**
- Check logs in Render dashboard
- Verify SUPABASE_DB_PASSWORD is correct

**Frontend can't connect:**
- Check REACT_APP_API_URL in Vercel settings
- Verify it ends with `/api`
- Make sure CORS is configured in backend

**Can't log in:**
- Database needs to be seeded first
- Check if backend is responding: visit backend URL

---

Ready to deploy! 🚀
