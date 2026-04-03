# Tech Stack

## Backend
- **Runtime**: Node.js v18+
- **Framework**: NestJS v10 (TypeScript)
- **ORM**: Prisma v5 (schema at `backend/prisma/schema.prisma`)
- **Database**: PostgreSQL 14+
- **Cache / Queue broker**: Redis 6+
- **Queue**: BullMQ (`@nestjs/bullmq`) + Bull (`@nestjs/bull`)
- **Auth**: JWT (access token 15m + refresh token 7d), Passport.js, bcrypt
- **WebSockets**: Socket.io (`@nestjs/platform-socket.io`)
- **Scheduler**: `@nestjs/schedule`
- **Validation**: `class-validator` + `class-transformer`
- **PDF generation**: pdfmake, html-pdf-node
- **Excel**: exceljs
- **QR codes**: qrcode
- **HTTP client**: axios (`@nestjs/axios`)
- **Rate limiting**: `@nestjs/throttler`
- **Security**: helmet, cookie-parser, csurf
- **API docs**: Swagger (`@nestjs/swagger`)
- **Error tracking**: Sentry

## Frontend
- **Framework**: React 19 + TypeScript
- **Build tool**: Vite 7
- **Styling**: Tailwind CSS v3 + CSS Modules
- **State management**: Zustand + React Context / Hooks
- **Routing**: React Router DOM v7
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP client**: axios
- **WebSocket client**: socket.io-client
- **Notifications**: react-hot-toast
- **QR scanner**: html5-qrcode
- **QR display**: react-qr-code
- **Date utils**: date-fns
- **E2E tests**: Cypress

## Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse proxy**: Nginx (with SSL)
- **Services**: api, worker, postgres, redis, nginx
- **File storage**: local (`./uploads`) or AWS S3
- **Frontend hosting**: Vercel

---

## Common Commands

### Backend (`cd backend`)
```bash
npm run start:dev          # Dev server with watch
npm run build              # Compile TypeScript → dist/
npm run start:prod         # Run compiled production build
npm run lint               # ESLint with auto-fix
npm run test               # Jest unit tests
npm run test:cov           # Jest with coverage
npm run test:e2e           # E2E tests

npx prisma migrate dev     # Run migrations (dev)
npx prisma migrate deploy  # Run migrations (prod)
npm run prisma:generate    # Regenerate Prisma client
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open Prisma Studio

npm run docker:up          # Start all Docker services
npm run docker:down        # Stop all Docker services
```

### Frontend (`cd frontend`)
```bash
npm run dev        # Vite dev server
npm run build      # tsc + Vite production build
npm run lint       # ESLint
npm run preview    # Preview production build
npm run cy:open    # Open Cypress UI
npm run cy:run     # Run Cypress headless
```
