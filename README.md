# Booking & Workforce Allocation System

This is a full-stack web application built for managing agricultural bookings and workforce allocation. The idea is simple — a farmer books a service for their land, and the system automatically schedules all the crop activities and assigns the most cost-efficient team to each one when the farmer approves it.

---

## What It Does

When we creates a booking, the system generates a full activity schedule based on the crop type (Rice or Wheat). Each crop has 18 activities — things like land preparation, sowing, irrigation, pest control, and harvesting. These activities are scheduled one after another, each starting the day after the previous one finishes.

No team is assigned upfront. The farmer reviews each activity and clicks **Accept** when they're ready. At that point, the system finds the best available team — the one that can complete the job at the lowest cost — and assigns them. If no team is free, the activity gets a **Resource Conflict** status and shows the next available date.

The farmer can also **Reschedule** an activity (up to 3 times). When rescheduled, all downstream activities shift automatically. On the 3rd reschedule, the activity is auto-accepted.

Once a team finishes a job, the farmer clicks **Mark Complete**. The team is freed up and becomes available for new assignments.

---

## Tech Stack

- **Frontend** — React 18, TypeScript, Tailwind CSS, Vite
- **Backend** — Node.js, Express, TypeScript
- **Database** — MongoDB Atlas with Mongoose

---

## Getting Started

You'll need Node.js (v18+) and a MongoDB connection string.

**Backend:**
```bash
cd backend
npm install
cp .env.example .env     # paste your MongoDB URI here
npm run seed             # sets up teams and crop templates
npm run dev              # runs on port 5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev              # runs on port 3000
```

Then open `http://localhost:3000`.

---

## How Team Allocation Works

This was the trickiest part to get right. When a farmer accepts an activity, the system loops through all teams and for each one calculates:

```
duration = ceil(landSize / (workerCount × efficiency))
cost     = duration × workerCount × ₹500
```

It picks whichever team gives the **lowest total cost**. The efficiency value is fixed per activity per crop — for example, harvesting has a lower efficiency (0.08) because it's labor-intensive, while soil testing is quicker (0.15). These are baked into the crop templates.

One more rule — the same team can't be assigned to two consecutive activities in the same booking, just to avoid overloading a single team.

---

## Activity Status Flow

```
Proposed → Accept → Confirmed → Mark Complete → Completed
         → Reschedule → re-Proposed (new dates, downstream shifts)
                      → 3rd reschedule auto-accepts
```

---

## Rescheduling

If a farmer isn't happy with a scheduled date, they can pick a new start date. The system then shifts every activity after that one accordingly — each one starts the day after the previous ends. Any team that was already confirmed on those activities gets released and the farmer has to re-accept them.

---

## Teams Page

Each team card shows whether the team is currently **Available** or **Unavailable**, and lists their ongoing or upcoming jobs. A team becomes available again as soon as the farmer marks their current activity as complete.

---

## Financials

Cost and profit are only calculated once a team is confirmed — before that there's nothing to calculate since we don't know which team will be assigned.

| | Formula |
|-|---------|
| Revenue | `landSize × rate per acre` (fixed per activity) |
| Cost | `duration × workerCount × ₹500` |
| Profit | `Revenue − Cost` |

The summary at the top of the schedule page adds up all confirmed and completed activities.

---

## API Endpoints

**Bookings**
- `GET /api/bookings` — list all
- `GET /api/bookings/:id` — single booking with activities
- `POST /api/bookings` — create booking
- `DELETE /api/bookings/:id` — delete booking and free team schedules

**Activities**
- `PATCH /api/activities/:id/confirm` — accept, allocates team at runtime
- `PATCH /api/activities/:id/reject` — reschedule with new date
- `PATCH /api/activities/:id/complete` — mark done, frees the team
- `PATCH /api/activities/:id/cancel` — cancel activity

**Teams**
- `GET /api/teams` — all teams
- `POST /api/teams` — add team
- `PUT /api/teams/:id` — edit team

**Other**
- `GET /api/dashboard` — summary stats and team utilization
- `GET /api/crops` — crop templates

---

## Environment Variables

```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
DAILY_WAGE=500
```