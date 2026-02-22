# pranay Software Solution — Monorepo

Monorepo with **frontend** (Next.js App Router, TypeScript, Tailwind) and **backend** (NestJS, TypeScript, Prisma, PostgreSQL).

## Structure

- `frontend/` — Next.js 14 App Router, TypeScript, Tailwind CSS
- `backend/` — NestJS REST API, Prisma, PostgreSQL

## Prerequisites

- Node.js 18+
- PostgreSQL (for backend)

## Setup

### 1. Install dependencies

From the repo root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend (NestJS + Prisma)

```bash
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL (PostgreSQL) and JWT_SECRET
npx prisma migrate dev
npx prisma generate
npm run prisma:seed # seeds Admin user
npm run dev
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:4000 (Swagger at /api/docs)

---

## Test Credentials

The system uses RBAC (Role-Based Access Control) with **ADMIN**, **EMPLOYEE**, and **CLIENT** roles.

| Role     | Email                | Password      | Description                               |
|----------|----------------------|---------------|-------------------------------------------|
| **Admin**    | `admin@example.com`  | `SecurePass123!`   | Total control (Stats, CRUD Users, Projects) |
| **Employee** | `jhon@example.com` | `SecurePass123!`| View assigned projects, update status       |
| **Client**   | `praveen@amazon.com`   | `SecurePass123!`  | Request services, view own projects         |

> [!NOTE]
> Run `npm run prisma:seed` in the backend to ensure the Admin user exists. Employees and Clients can be created by the Admin via the Users dashboard.
