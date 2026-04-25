# TaskFlow Pro — Full Stack Setup Guide

## Project Structure

```
taskflow/
├── backend/                  ← Node.js + Express + MongoDB API
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   └── Goal.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   ├── goals.js
│   │   ├── reminders.js
│   │   └── stats.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                 ← React + Vite
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── TaskContext.jsx
    │   ├── components/
    │   │   ├── Layout.jsx / .module.css
    │   │   ├── TaskModal.jsx / .module.css
    │   │   └── SettingsModal.jsx / .module.css
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Tasks.jsx
    │   │   ├── Kanban.jsx
    │   │   ├── Calendar.jsx
    │   │   ├── Reminders.jsx
    │   │   └── Goals.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## STEP 1 — Install Prerequisites

Make sure you have these installed on your computer:

### Node.js (v18 or higher)
- Download from: https://nodejs.org
- Check: `node --version`

### MongoDB
Choose ONE option:

**Option A — MongoDB Atlas (Cloud, Free, Recommended)**
1. Go to https://cloud.mongodb.com
2. Create free account → Create free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like):
   `mongodb+srv://username:password@cluster.mongodb.net/taskflow`
5. Paste it in `backend/.env` as `MONGO_URI`

**Option B — Local MongoDB**
- Download from: https://www.mongodb.com/try/download/community
- Install and start the service
- Use: `MONGO_URI=mongodb://localhost:27017/taskflow`

### Git (optional but recommended)
- Download from: https://git-scm.com

---

## STEP 2 — Download / Extract Project

Place the `taskflow` folder somewhere on your computer, for example:
```
C:\Projects\taskflow        (Windows)
~/projects/taskflow         (Mac/Linux)
```

---

## STEP 3 — Setup Backend

Open a terminal (Command Prompt / PowerShell / Terminal):

```bash
# Go into the backend folder
cd taskflow/backend

# Install all dependencies
npm install
```

### Configure Environment Variables

Open `backend/.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/taskflow
JWT_SECRET=make_this_a_long_random_string_like_abc123xyz789
JWT_EXPIRE=7d
NODE_ENV=development
```

> ⚠️ Change JWT_SECRET to any long random string. Keep it secret!

### Start the Backend Server

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
🚀 TaskFlow API running on http://localhost:5000
✅ MongoDB connected
```

Test it by visiting: http://localhost:5000/api/health
You should see: `{"status":"OK","time":"..."}`

---

## STEP 4 — Setup Frontend

Open a **NEW terminal** (keep backend running):

```bash
# Go into the frontend folder
cd taskflow/frontend

# Install all dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:3000/
```

Open your browser at: **http://localhost:3000**

---

## STEP 5 — Create Your First Account

1. Open http://localhost:3000
2. Click "Create one" to register
3. Enter your name, email, password
4. You'll be logged in automatically

---

## STEP 6 — Test the App

Try these features:
- ✅ Add a task from the "+ New Task" button
- ✅ View the Dashboard stats
- ✅ Drag cards on the Kanban board
- ✅ Click a date on the Calendar to add a task
- ✅ Create a Goal and link tasks to it
- ✅ Check Reminders view

---

## API Endpoints Reference

### Auth
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /api/auth/register    | Create account     |
| POST   | /api/auth/login       | Login              |
| GET    | /api/auth/me          | Get current user   |
| PUT    | /api/auth/profile     | Update profile     |
| PUT    | /api/auth/password    | Change password    |

### Tasks
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /api/tasks                       | Get all tasks (filtered) |
| GET    | /api/tasks/today                 | Today's tasks            |
| GET    | /api/tasks/overdue               | Overdue tasks            |
| GET    | /api/tasks/:id                   | Get single task          |
| POST   | /api/tasks                       | Create task              |
| PUT    | /api/tasks/:id                   | Update task              |
| PATCH  | /api/tasks/:id/complete          | Toggle complete          |
| PATCH  | /api/tasks/:id/subtask/:subId    | Toggle subtask           |
| DELETE | /api/tasks/:id                   | Delete task              |
| DELETE | /api/tasks/batch/completed       | Delete all completed     |

### Goals
| Method | Endpoint        | Description   |
|--------|-----------------|---------------|
| GET    | /api/goals      | Get all goals |
| POST   | /api/goals      | Create goal   |
| PUT    | /api/goals/:id  | Update goal   |
| DELETE | /api/goals/:id  | Delete goal   |

### Stats & Reminders
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/stats/dashboard | Dashboard metrics   |
| GET    | /api/reminders       | Upcoming reminders  |

---

## Build for Production

### Backend (Deploy to Railway / Render / Heroku)

```bash
cd backend
npm start
```

Set these environment variables on your hosting platform:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — your secret key
- `PORT` — usually set automatically
- `NODE_ENV=production`

### Frontend (Deploy to Vercel / Netlify)

```bash
cd frontend

# Build the production bundle
npm run build

# This creates a 'dist' folder — deploy that folder
```

**For Vercel:**
```bash
npm install -g vercel
vercel
```

**For Netlify:**
1. Go to netlify.com
2. Drag and drop the `dist` folder

> ⚠️ Before building, update `frontend/src/utils/api.js`:
> Change `baseURL: '/api'` to `baseURL: 'https://your-backend-url.com/api'`

---

## Common Issues & Fixes

### "Cannot connect to MongoDB"
- Check your MONGO_URI in .env
- Make sure your IP is whitelisted in MongoDB Atlas (Network Access → Add 0.0.0.0/0)
- Try pinging: `mongosh "your-connection-string"`

### "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# Mac/Linux
lsof -ti:5000 | xargs kill
```

### "npm install fails"
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### CORS errors in browser
- Make sure backend is running on port 5000
- Check that frontend proxy is set in `vite.config.js`
- The proxy setting handles CORS automatically in development

### "JWT token invalid"
- Clear localStorage in browser DevTools → Application → Local Storage
- Log out and log back in

---

## Tech Stack

| Layer     | Technology          | Purpose                     |
|-----------|---------------------|-----------------------------|
| Frontend  | React 18 + Vite     | UI framework + build tool   |
| Routing   | React Router v6     | Client-side routing         |
| State     | Context API         | Global state management     |
| HTTP      | Axios               | API requests                |
| Styling   | CSS Modules         | Scoped component styles     |
| Backend   | Node.js + Express   | REST API server             |
| Database  | MongoDB + Mongoose  | Data persistence            |
| Auth      | JWT + bcryptjs      | Authentication & security   |
| Scheduler | node-cron           | Background reminder checks  |
| Toasts    | react-hot-toast     | Notifications               |

---

## Environment Variables Summary

### backend/.env

Create this file locally from `backend/.env.example`. Do not commit the real `.env`.

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### frontend (for production only)
Set `VITE_API_URL` in Vercel to your deployed backend API URL, for example:

```
https://your-render-service.onrender.com/api
```
