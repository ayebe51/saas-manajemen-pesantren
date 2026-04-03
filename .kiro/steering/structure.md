# Project Structure

## Root
```
/
├── backend/       # NestJS API
├── frontend/      # React + Vite SPA
├── scanner/       # (standalone scanner utility)
└── .kiro/         # Kiro specs and steering
```

---

## Backend (`backend/`)

```
backend/
├── src/
│   ├── app.module.ts          # Root module
│   ├── main.ts                # Bootstrap (Helmet, CORS, Swagger, pipes)
│   ├── common/
│   │   ├── decorators/        # @CurrentUser, @Public, @Roles, @TenantId
│   │   ├── guards/            # JwtAuthGuard, RolesGuard, TenantGuard, ApiKeyGuard
│   │   ├── interceptors/      # LoggingInterceptor, AuditLogInterceptor, TenantCacheInterceptor
│   │   ├── middleware/        # TenantMiddleware
│   │   └── prisma/            # PrismaModule, PrismaService
│   ├── jobs/                  # Scheduled jobs (ScheduledService)
│   └── modules/               # Feature modules (one folder per domain)
│       ├── auth/
│       ├── santri/
│       ├── academic/
│       ├── attendance/
│       ├── pembayaran/        # SPP payments
│       ├── payment/           # General payment / wallet top-up
│       ├── wallet/
│       ├── perizinan/
│       ├── pelanggaran/
│       ├── kesehatan/
│       ├── kunjungan/
│       ├── dormitory/         # Asrama
│       ├── employee/          # Kepegawaian
│       ├── ppdb/
│       ├── catatan/           # Buku penghubung
│       ├── points/            # Poin reward
│       ├── dashboard/
│       ├── analytics/
│       ├── report/
│       ├── audit-log/
│       ├── notification/      # Internal notifications
│       ├── external-notification/ # WhatsApp engine
│       ├── tenant/
│       ├── upload/
│       ├── inventory/
│       ├── tahfidz/
│       ├── wali-portal/
│       └── public/            # Public-facing endpoints
├── prisma/
│   ├── schema.prisma          # Single source of truth for DB schema
│   ├── migrations/
│   └── seed/
└── docker-compose.yml
```

### Backend Module Convention
Each module follows NestJS standard structure:
```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
└── dto/                       # CreateXxxDto, UpdateXxxDto, response DTOs
```
Entities are defined in Prisma schema, not as separate class files.

---

## Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Router setup
│   ├── index.css              # Global styles + Tailwind base
│   ├── components/
│   │   ├── auth/              # Auth-specific components
│   │   ├── common/            # Generic reusable UI components
│   │   ├── layout/            # Shell, sidebar, navbar
│   │   └── shared/            # Cross-module shared components
│   ├── pages/                 # One folder per module/domain
│   │   ├── dashboard/
│   │   ├── santri/
│   │   ├── akademik/
│   │   ├── presensi/
│   │   ├── pembayaran/
│   │   ├── perizinan/
│   │   ├── pelanggaran/
│   │   ├── kesehatan/
│   │   ├── kunjungan/
│   │   ├── dormitory/
│   │   ├── hr/                # Kepegawaian
│   │   ├── ppdb/
│   │   ├── catatan/
│   │   ├── poin/
│   │   ├── wallet/
│   │   ├── inventory/
│   │   ├── laporan/
│   │   ├── audit-log/
│   │   ├── id-card/
│   │   ├── settings/
│   │   ├── wali/              # Wali santri portal
│   │   ├── auth/
│   │   └── public/
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── api/               # Axios instances and API call functions
│       ├── socket/            # Socket.io client setup
│       └── store/             # Zustand stores
└── public/
```

---

## Key Conventions

- **Backend**: All DTOs use `class-validator` decorators. Always apply `ValidationPipe` globally.
- **Backend**: Use `@Public()` decorator to bypass JWT guard on public endpoints.
- **Backend**: All database timestamps use server time (`new Date()` server-side), never client-provided timestamps for critical operations.
- **Backend**: Soft deletes — never hard-delete student or financial records.
- **Backend**: Audit logging is mandatory for auth, RBAC changes, financial transactions, and student data mutations.
- **Frontend**: Pages are organized by domain matching backend module names.
- **Frontend**: API calls live in `src/lib/api/`, not inline in components.
- **Frontend**: Global state in Zustand stores (`src/lib/store/`); local/server state via hooks.
- **Naming**: Domain terms stay in Indonesian (`santri`, `wali`, `perizinan`, `pelanggaran`, `asrama`, etc.).
