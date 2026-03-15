
# Interactive Digital Banking Simulation Platform

Web-based financial literacy platform for children and teenagers (ages 5-17) in Uganda using virtual UGX.

## Stack

- Next.js 14 App Router + Route Handlers
- TypeScript + Tailwind CSS
- SQLite + Prisma ORM
- JWT authentication with role-based access
- Prisma Studio for database management

## Roles

- `parent`: register, create child accounts, monitor wallets, approve/reject pending transactions, set spending limits
- `child`: view wallet, request spend/earn transactions, view transaction history, create savings goals
- `admin`: manage lessons/quizzes, view analytics

## Core Prisma Models

- `User`
- `ChildProfile`
- `Wallet`
- `Transaction`
- `SavingsGoal`
- `Budget`
- `Achievement`

Additional admin content models:

- `Lesson`
- `Quiz`

## Setup

1. Copy `.env.example` to `.env` and configure values.
2. Install packages:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run migrations:

```bash
npm run prisma:migrate
```

5. Seed initial admin user and demo content:

```bash
npm run prisma:seed
```

6. Start development server:

```bash
npm run dev
```

7. Open Prisma Studio:

```bash
npm run prisma:studio
```

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Parent

- `GET /api/parent/children`
- `POST /api/parent/children`
- `POST /api/parent/spending-limit`
- `GET /api/parent/transactions/pending`
- `POST /api/parent/transactions/[id]/decision`

### Child

- `GET /api/child/wallet`
- `GET /api/child/transactions`
- `POST /api/child/transactions`
- `GET /api/child/savings-goals`
- `POST /api/child/savings-goals`

### Admin

- `GET/POST /api/admin/lessons`
- `GET/POST /api/admin/quizzes`
- `GET /api/admin/analytics`

## Architecture Note

The platform is API-first. A future mobile app can reuse the same secured Route Handler APIs, minimizing duplicated business logic.
