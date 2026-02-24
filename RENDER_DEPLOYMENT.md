# Render Deployment Guide

This project requires **two separate deployments** on Render: Backend and Frontend.

## Prerequisites
- Render account (render.com)
- GitHub repository connected to Render
- Environment variables ready

---

## 1. Deploy Backend (Web Service)

### Steps:
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (Sonusk4/consult)
4. Fill in the following:

| Setting | Value |
|---------|-------|
| **Name** | consultancy-backend |
| **Environment** | Node |
| **Build Command** | `cd backend-new && npm install && npx prisma migrate deploy` |
| **Start Command** | `cd backend-new && npm start` |
| **Node Version** | 22 |

### Environment Variables:
Add these in the **Environment** section:

```
DATABASE_URL=postgresql://consultancy_db_y5yl_user:zCeeOVxPIooKyQkM9MaJukWIsOq6tH10@dpg-d6eph9juibrs73djblb0-a/consultancy_db_y5yl?schema=public

FIREBASE_PROJECT_ID=consultancy-platform-2d615
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@consultancy-platform-2d615.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
JWT_SECRET=dev-secret-key-for-testing-only

RAZORPAY_KEY_ID=rzp_test_SHwPxTs74SFbLu
RAZORPAY_KEY_SECRET=cAGBWCZkJhN4AcGaY121N6sC

EMAIL_USER=sonuayadavsk@gmail.com
EMAIL_PASS=aqxclmyigeqheosq

CLOUDINARY_CLOUD_NAME=dyk3q1r8l
CLOUDINARY_API_KEY=296618884693174
CLOUDINARY_API_SECRET=4C6-PNi9mV4qzhV8uSBUvFEdU8Q
```

5. Click **Deploy**

After deployment, copy the backend URL (e.g., `https://consultancy-backend.onrender.com`)

---

## 2. Deploy Frontend (Static Site)

### Steps:
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository (Sonusk4/consult)
4. Fill in the following:

| Setting | Value |
|---------|-------|
| **Name** | consultancy-frontend |
| **Build Command** | `cd frontend && npm run build` |
| **Publish Directory** | `frontend/dist` |

### Environment Variables:
Add these in the **Environment** section:

```
VITE_FIREBASE_API_KEY=AIzaSyCED2RV44Vpl8SAx9NqsPCrdRoG9lg4ue8
VITE_FIREBASE_AUTH_DOMAIN=consultancy-platform-2d615.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=consultancy-platform-2d615
VITE_FIREBASE_STORAGE_BUCKET=consultancy-platform-2d615.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=797509573284
VITE_FIREBASE_APP_ID=1:797509573284:web:fecddc25ab602f341fe431

VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_test_SHwPxTs74SFbLu
```

*Replace `https://your-backend-url.onrender.com` with the backend URL from step 1*

5. Click **Deploy**

---

## 3. Update Frontend `.env` After Backend Deployment

After both services are deployed:

1. Go to Frontend service settings
2. Update **VITE_API_BASE_URL** to your actual backend URL
3. Trigger a redeploy

---

## Troubleshooting

### Backend Build Failed
- Check that `DATABASE_URL` is correct
- Verify `FIREBASE_PRIVATE_KEY` has proper formatting (newlines with `\n`)
- Ensure Prisma migrations run: `npx prisma migrate deploy`

### Frontend Won't Connect to Backend
- Verify `VITE_API_BASE_URL` points to correct backend domain
- Check CORS settings in `backend-new/index.js`
- Ensure both services are deployed and running

### Deployment Logs
- Click **"Logs"** on Render dashboard to view real-time build/runtime logs

---

## Quick Links
- Backend Unit: https://render.com/dashboard
- Frontend Unit: https://render.com/dashboard
- Database: Render PostgreSQL (already created)
