# SA School Management System

A full-stack school management system for South African schools. The app includes role-based dashboards for administrators, teachers, learners, parents, and accountants, with tools for learner records, attendance, marks, fees, payments, virtual classes, profile editing, uploads, and printable payment slips.

## Live Deployment

- Frontend: https://sa-school-frontend.onrender.com
- API: https://sa-school-api.onrender.com
- API Swagger Docs: https://sa-school-api.onrender.com/api/docs

## Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Teacher | `teacher1` | `teacher123` |
| Learner | `learner1` | `learner123` |
| Parent | `parent1` | `parent123` |
| Accountant | `accountant1` | `accountant123` |

## Features

- Public landing page with school imagery
- Role-based login and dashboards
- Admin user, learner, class, subject, timetable, and notification management
- Teacher attendance, marks, learning materials, uploaded records, and virtual classes
- Parent fee, payment, attendance, and progress views
- Accountant fee, payment, and reporting tools
- Profile editing with profile photo uploads
- Payment receipt/slip printing
- Swagger API documentation
- Mobile-responsive dashboard navigation
- Render-friendly SPA routing and mobile auth fallback

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- Development database option: `pg-mem`
- Deployment: Render Static Site, Render Web Service, Render Postgres
- Package manager: pnpm workspace

## Project Structure

```text
artifacts/school-management   React frontend
artifacts/api-server          Express API server
lib/db                        Database schema and connection
lib/api-client-react          Generated React API client
lib/api-zod                   API validation schemas
lib/api-spec                  OpenAPI specification
```

## Local Development

Install dependencies:

```bash
corepack pnpm install
```

Start the API locally with an in-memory database:

```powershell
$env:DATABASE_URL="memory"
$env:PORT="8080"
corepack pnpm --filter @workspace/api-server run build
corepack pnpm --filter @workspace/api-server run start
```

Start the frontend:

```powershell
$env:PORT="5180"
$env:BASE_PATH="/"
corepack pnpm --filter @workspace/school-management run dev
```

Open:

```text
http://localhost:5180
```

## Useful Commands

Typecheck everything:

```bash
corepack pnpm run typecheck
```

Build the API:

```bash
corepack pnpm --filter @workspace/api-server run build
```

Build the frontend:

```powershell
$env:PORT="5180"
$env:BASE_PATH="/"
$env:VITE_API_URL="https://sa-school-api.onrender.com"
corepack pnpm --filter @workspace/school-management run build
```

## Environment Variables

API service:

| Variable | Description |
| --- | --- |
| `PORT` | Port provided by Render or local development |
| `NODE_ENV` | Use `production` on Render |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Long random secret for sessions and auth tokens |

Frontend:

| Variable | Description |
| --- | --- |
| `PORT` | Required by the Vite config |
| `BASE_PATH` | Usually `/` |
| `VITE_API_URL` | Deployed API URL, for example `https://sa-school-api.onrender.com` |

## Render Deployment

Create these Render services:

1. Postgres database
2. Web Service for the API
3. Static Site for the frontend

API Web Service:

```bash
Build Command:
pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
```

```bash
Start Command:
node artifacts/api-server/dist/index.mjs
```

Frontend Static Site:

```bash
Build Command:
pnpm install --frozen-lockfile && PORT=5180 BASE_PATH=/ VITE_API_URL=https://sa-school-api.onrender.com pnpm --filter @workspace/school-management run build
```

```text
Publish Directory:
artifacts/school-management/dist/public
```

Add this Render Static Site rewrite rule:

```text
Action: Rewrite
Source: /*
Destination: /index.html
```

Do not use `corepack enable` in Render build commands. Render can fail with a read-only filesystem error when Corepack tries to replace the global pnpm binary.

## Production Notes

- Use Render Postgres for production data. Do not use `DATABASE_URL=memory` in production.
- The current upload feature stores files on the API server filesystem. For real production use, connect Cloudinary, Supabase Storage, S3, or another persistent file storage provider.
- Payment pages currently support app-side payment recording and printable receipts. To accept real online payments, connect a provider such as Yoco, PayFast, Stripe, or Paystack and store the provider keys as Render environment variables.

## License

MIT
