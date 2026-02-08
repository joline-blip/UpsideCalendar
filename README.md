## UpsideCalendar

Calendly-like scheduling MVP (staff availability + admin scheduling + public booking links), built with **Next.js (TS)** + **Prisma** + **Render Postgres**.

## Getting Started

### Local dev

1) Create a `.env` (this repo ignores it) with at least:

```bash
DATABASE_URL="postgresql://..."
APP_BASE_URL="http://localhost:3000"
MAGIC_LINK_SECRET="dev_dev_dev_dev_change_me"
ADMIN_EMAILS="you@domain.com"
AVAILABILITY_CUTOFF_HOURS="24"
```

2) Run migrations and start the server:

```bash
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### MVP URLs

- `/login`: request a magic link
- `/staff/availability`: staff availability blocks
- `/admin`: invite staff + create event types
- `/admin/schedule`: admin creates bookings from availability
- `/admin/bookings`: reschedule/cancel/reassign
- `/admin/audit`: audit log
- `/book/<eventTypeSlug>`: public booking page
- `/bookings/<id>`: confirmation + add-to-calendar
- `/bookings/<id>/ics`: download `.ics`
- `/cal/<token>`: subscription feed (bookings only)

### Deploy to Render

Render setup expects the GitHub repo to have a first commit on `main`.

1) From the app directory:

```bash
cd "upsidecalendar"
git init
git add .
git commit -m "Initial UpsideCalendar MVP"
git branch -M main
git remote add origin https://github.com/joline-blip/UpsideCalendar.git
git push -u origin main
```

2) In Render, set these env vars for the web service:

- `DATABASE_URL`
- `APP_BASE_URL` (your Render service URL)
- `MAGIC_LINK_SECRET` (random 32+ chars)
- `ADMIN_EMAILS` (comma-separated)
- `AVAILABILITY_CUTOFF_HOURS` (e.g. `24`)
- Optional: `EMAIL_FROM`, `RESEND_API_KEY`

The Render build command runs migrations automatically via `npm run db:migrate`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
