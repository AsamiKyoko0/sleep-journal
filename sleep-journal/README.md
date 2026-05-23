# Sleep Journal — Setup Guide

A personal sleep tracker built with **Node.js + Express + MongoDB Atlas**.

---

## Project Structure

```
sleep-journal/
├── server.js               ← main entry point
├── .env                    ← your environment variables (never share this)
├── package.json
├── models/
│   ├── User.js             ← user schema (hashed password, sleep goal)
│   └── Entry.js            ← sleep entry schema
├── routes/
│   ├── auth.js             ← register, login, profile, update goal
│   └── entries.js          ← create, read, update, delete, export CSV
├── middleware/
│   └── auth.js             ← JWT verification
└── public/
    └── index.html          ← the full frontend
```

---

## Step 1 — Create a MongoDB Atlas account

Since you won't be carrying your PC to school, your database needs to live in the cloud.

1. Go to https://www.mongodb.com/cloud/atlas and click **Try Free**
2. Sign up with your email
3. Choose **Free (M0)** tier — it's completely free, no credit card needed
4. Pick any cloud provider (AWS is fine) and the region closest to you
5. Click **Create Cluster** and wait ~2 minutes for it to provision

---

## Step 2 — Create a database user

1. In the left sidebar click **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Set a username (e.g. `sleepuser`) and a strong password — **write these down**
5. Set role to **Read and Write to any database**
6. Click **Add User**

---

## Step 3 — Allow network access

1. In the left sidebar click **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   > This is fine for a school project. For real production apps you'd restrict this.
4. Click **Confirm**

---

## Step 4 — Get your connection string

1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Click **Drivers**
4. Select **Node.js** and version **5.5 or later**
5. Copy the connection string — it looks like:
   ```
   mongodb+srv://sleepuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 5 — Configure your .env

Open `.env` and paste your connection string, replacing `<password>` with your actual password and adding the database name:

```env
PORT=3000

# Local MongoDB (home PC only)
# MONGO_URI=mongodb://127.0.0.1:27017/sleep-journal

# MongoDB Atlas (cloud — works from any device)
MONGO_URI=mongodb+srv://sleepuser:yourpassword@cluster0.xxxxx.mongodb.net/sleep-journal?retryWrites=true&w=majority

JWT_SECRET=pick_any_long_random_string_here_like_this_one_1234
```

> ⚠️ Never share your `.env` file or push it to GitHub. It contains your database password.

---

## Step 6 — Deploy the backend (so school PCs can reach it)

Your `server.js` also needs to run somewhere on the internet, not just your laptop.
The easiest free option for a student project is **Railway**.

### Deploy to Railway

1. Push your project to GitHub (without the `.env` file — add it to `.gitignore`)
2. Go to https://railway.app and sign up with GitHub
3. Click **New Project → Deploy from GitHub repo**
4. Select your sleep-journal repo
5. Railway auto-detects Node.js and runs `npm start`
6. Click **Variables** and add your `.env` values one by one:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = your secret
   - `PORT` = `3000`
7. Click **Deploy** — Railway gives you a public URL like `https://sleep-journal-production.up.railway.app`

That URL works from any browser, on any device, anywhere.

---

## Running locally (on your home PC)

If you want to test on your own machine before deploying:

```bash
# Install dependencies (only needed once)
npm install

# Start with auto-reload on save
npm run dev
```

Then open http://localhost:3000

> Make sure MongoDB is running locally if you switch back to the local MONGO_URI.

---

## API Reference

All `/api/entries` routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | `{ username, email, password }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Login → returns token |
| GET  | `/api/auth/me` | — | Get current user |
| PATCH | `/api/auth/goal` | `{ sleepGoalMins }` | Update sleep goal |

### Sleep Entries

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/entries` | All entries (newest first) |
| GET    | `/api/entries/week` | Last 7 entries |
| POST   | `/api/entries` | Create new entry |
| PATCH  | `/api/entries/:id` | Edit an entry |
| DELETE | `/api/entries/:id` | Delete an entry |
| GET    | `/api/entries/export` | Download all entries as CSV |

---

## Rate Limiting

| Route | Limit |
|-------|-------|
| All `/api` routes | 100 requests / 15 min / IP |
| `/api/auth/login` and `/register` | 20 requests / 15 min / IP |

---

## Questions your teacher might ask

**Where is data stored?**
In MongoDB Atlas — a free cloud database. Collections: `users` and `entries`.

**How is authentication handled?**
Passwords are hashed with bcryptjs (never stored as plain text). Login returns a JWT valid for 7 days. Every protected request sends the token in the `Authorization` header.

**How do you prevent spam / abuse?**
`express-rate-limit` blocks IPs that exceed request limits within 15 minutes. Auth routes have a stricter limit to prevent brute-force attacks.

**Can multiple users use this at the same time?**
Yes — every entry is linked to a user ID in MongoDB, so each user only sees their own sleep data.

**Why MongoDB over SQL?**
Sleep entries are flexible objects — the fields (wakes, habits, notes) don't always have the same shape. MongoDB handles this naturally. For this scale, either would work fine.

**What's the difference between local and Atlas?**
Local MongoDB only works while your PC is on and only from your network. Atlas is always on, accessible from any device, and free up to 512MB of data.

**What would you add next?**
A mobile app (React Native), push notification reminders, and weekly email summaries.
