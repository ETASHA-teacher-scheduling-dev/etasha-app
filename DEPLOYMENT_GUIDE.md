# 🚀 Deployment Guide

Complete guide to deploy ETASHA Teacher Scheduling App to production.

## 📋 Architecture

- **Frontend:** Vercel (React app)
- **Backend:** Render (Node.js/Express API)
- **Database:** Supabase (PostgreSQL)

---

## 🗄️ Step 1: Supabase Database (Already Done ✅)

Your Supabase project is already set up:
- **Project ID:** vuiqklucyjngwvmpzxyw
- **Region:** ap-south-1 (Mumbai)
- **Dashboard:** https://vuiqklucyjngwvmpzxyw.supabase.co
- **Tables:** 10 tables created with RLS enabled
- **Status:** Active & Healthy

### Database Credentials (You'll Need These):
- **Host:** `db.vuiqklucyjngwvmpzxyw.supabase.co`
- **User:** `postgres.vuiqklucyjngwvmpzxyw`
- **Database:** `postgres`
- **Port:** `5432`
- **Password:** Get from Supabase Dashboard → Settings → Database

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub (Already Done ✅)
Your code is already on GitHub.

### 2.2 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repository

### 2.3 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `ETASHA-teacher-scheduling-dev/etasha-app`
3. Configure the service:

**Basic Settings:**
```
Name: etasha-backend
Region: Singapore (or closest to Mumbai)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 2.4 Add Environment Variables
In the Render dashboard, go to **Environment** tab and add:

```bash
NODE_ENV=production
PORT=8080
SUPABASE_DB_PASSWORD=<your-supabase-password>
FRONTEND_URL=https://your-app.vercel.app
```

**Important:** 
- Get `SUPABASE_DB_PASSWORD` from: https://app.supabase.com/project/vuiqklucyjngwvmpzxyw/settings/database
- You'll update `FRONTEND_URL` after deploying frontend

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your backend URL: `https://etasha-backend.onrender.com`

### 2.6 Test Backend
Visit: `https://etasha-backend.onrender.com`
You should see: `{"message": "Welcome to the ETASHA scheduling API."}`

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repository

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your repository: `ETASHA-teacher-scheduling-dev/etasha-app`
3. Configure the project:

**Framework Preset:** Create React App

**Root Directory:** `frontend`

**Build & Output Settings:**
```
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### 3.3 Add Environment Variables
In the Vercel project settings, go to **Settings** → **Environment Variables** and add:

```bash
REACT_APP_API_URL=https://etasha-backend.onrender.com/api
```

Replace `etasha-backend.onrender.com` with your actual Render backend URL.

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. Once deployed, copy your frontend URL: `https://etasha-app.vercel.app`

---

## 🔗 Step 4: Connect Frontend and Backend

### 4.1 Update Backend CORS
1. Go to your Render dashboard
2. Open your backend service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` with your Vercel URL:
   ```
   FRONTEND_URL=https://etasha-app.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

### 4.2 Test the Connection
1. Visit your Vercel app: `https://etasha-app.vercel.app`
2. Try logging in with test credentials
3. Check if data loads properly

---

## 📊 Step 5: Seed the Database (Optional)

If you want to populate with initial data:

### Option A: Using Supabase MCP (Easiest)
Since you have the MCP server configured, I can populate it for you directly.

### Option B: From Render Backend
1. Go to Render dashboard → Your service
2. Go to **Shell** tab
3. Run:
   ```bash
   cd backend
   node seed.js
   ```

### Option C: Manually via Supabase Dashboard
1. Go to https://vuiqklucyjngwvmpzxyw.supabase.co
2. Use SQL Editor to insert data

---

## ✅ Step 6: Verify Deployment

### Frontend Checklist:
- [ ] App loads at Vercel URL
- [ ] Login page appears
- [ ] No console errors

### Backend Checklist:
- [ ] API responds at Render URL
- [ ] Health check endpoint works: `GET /`
- [ ] Auth endpoint works: `POST /api/auth/signin`

### Database Checklist:
- [ ] Tables exist in Supabase
- [ ] RLS is enabled
- [ ] Connection works from Render

---

## 🔧 Troubleshooting

### Backend Not Connecting to Database

**Error:** `password authentication failed`
- Go to Supabase dashboard and reset password
- Update `SUPABASE_DB_PASSWORD` in Render environment variables

**Error:** `ECONNREFUSED`
- Check if Supabase project is active
- Verify HOST and PORT in db.config.js

### Frontend Can't Reach Backend

**Error:** `Network Error` or `CORS`
- Verify `REACT_APP_API_URL` in Vercel is correct
- Check `FRONTEND_URL` in Render matches your Vercel URL
- Ensure both use HTTPS (not HTTP)

### Render Deployment Failed

- Check build logs in Render dashboard
- Verify `package.json` has all dependencies
- Ensure Node version compatibility

---

## 🎯 URLs Summary

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://etasha-app.vercel.app` | React app |
| **Backend** | `https://etasha-backend.onrender.com` | API server |
| **Database** | `db.vuiqklucyjngwvmpzxyw.supabase.co` | PostgreSQL |
| **Supabase Dashboard** | `https://vuiqklucyjngwvmpzxyw.supabase.co` | DB management |

---

## 💰 Cost Breakdown

- **Render Free Tier:**
  - 750 hours/month
  - Sleeps after 15 mins of inactivity
  - Cold starts (delay when waking up)

- **Vercel Free Tier:**
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Custom domains

- **Supabase Free Tier:**
  - 500 MB database
  - 2 GB bandwidth
  - 50,000 monthly active users

**Total: $0/month** (within free tier limits)

---

## 🔐 Security Recommendations

### Before Going to Production:

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong database passwords
   - Rotate secrets regularly

2. **Database:**
   - Review and configure RLS policies properly
   - Enable database backups in Supabase
   - Monitor query performance

3. **API:**
   - Add rate limiting
   - Implement API key rotation
   - Enable request logging

4. **Frontend:**
   - Add error boundary
   - Implement proper error handling
   - Configure CSP headers

---

## 📈 Next Steps After Deployment

1. **Custom Domain:**
   - Add custom domain in Vercel settings
   - Update `FRONTEND_URL` in Render

2. **Monitoring:**
   - Set up Render health checks
   - Enable Vercel Analytics
   - Monitor Supabase metrics

3. **CI/CD:**
   - Already automatic! Push to `main` = auto-deploy
   - Vercel: GitHub push triggers deployment
   - Render: GitHub push triggers rebuild

4. **Backups:**
   - Enable daily backups in Supabase
   - Export data periodically
   - Document recovery procedures

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

## 📝 Deployment Checklist

Copy this checklist and mark items as you complete them:

```
Database (Supabase):
✅ Project created
✅ Tables created
✅ RLS enabled
⬜ Data seeded
⬜ Backups enabled

Backend (Render):
⬜ Account created
⬜ Service connected to GitHub
⬜ Environment variables set
⬜ Deployed successfully
⬜ API tested

Frontend (Vercel):
⬜ Account created
⬜ Project imported
⬜ Environment variables set
⬜ Deployed successfully
⬜ App tested

Integration:
⬜ Frontend connects to backend
⬜ Backend connects to database
⬜ CORS configured properly
⬜ End-to-end test passed
```

---

Good luck with your deployment! 🎉
