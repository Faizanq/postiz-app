# Claude Configuration

This file contains configuration and notes for Claude AI assistant.

## Project Overview
- Repository: Postiz - AI-powered social media scheduling platform
- Branch: faizan
- Fork: https://github.com/Faizanq/postiz-app
- Upstream: https://github.com/gitroomhq/postiz-app

## Quick Local Setup

### Prerequisites
- Node.js 20.x (enforced by Volta)
- pnpm 10.6.1
- Docker (for PostgreSQL & Redis)
- Git

### Setup Steps
1. **Start Docker Services**
   ```bash
   docker compose -f docker-compose.dev.yaml up -d
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

4. **Setup Database**
   ```bash
   pnpm run prisma-db-push
   ```

5. **Start Development**
   ```bash
   pnpm run dev
   ```

### Access Points
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- pgAdmin: http://localhost:8081 (admin@admin.com / admin)
- RedisInsight: http://localhost:5540

### Essential .env Configuration
```env
DATABASE_URL="postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secure-random-string-make-it-long"
FRONTEND_URL="http://localhost:4200"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
BACKEND_INTERNAL_URL="http://localhost:3000"
```

## Commands
- `pnpm dev` - Start all services
- `pnpm dev:backend` - Backend only
- `pnpm dev:frontend` - Frontend only
- `pnpm dev:workers` - Workers only
- `pnpm build` - Build all
- `pnpm lint` - Run linting
- `pnpm typecheck` - Type checking
- `pnpm test` - Run tests
- `pnpm prisma-db-push` - Update database schema
- `pnpm prisma-generate` - Generate Prisma client

## Important Files
- Backend: `/apps/backend/`
- Frontend: `/apps/frontend/`
- Workers: `/apps/workers/`
- Database Schema: `/libraries/nestjs-libraries/src/database/prisma/schema.prisma`
- Environment: `.env` (copy from `.env.example`)

## Git Workflow
### Sync with Upstream
```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
git checkout faizan
git merge main
```

### Custom Feature Development Strategy
To minimize conflicts with upstream:

1. **Use separate folders**: 
   - Backend: `apps/backend/src/custom-modules/`
   - Frontend: `apps/frontend/src/custom-features/`
   - Database: `prisma/migrations-custom/`

2. **Extend, don't modify**:
   - Create wrapper services instead of modifying existing ones
   - Add new routes instead of changing existing ones
   - Use separate schema files for database extensions

3. **Single-line additions**:
   - Only add one import line to existing files
   - Use feature flags for enabling/disabling

See `docs/architecture/customer-feature-architecture.md` for detailed implementation strategy.

### Documentation Structure
All custom documentation is organized in the `docs/` folder:
- `docs/features/` - Feature plans and specifications
- `docs/architecture/` - Technical architecture decisions
- `docs/setup/` - Setup guides and scripts
- `logs/` - Development logs (gitignored)

### Available Branches
- main (mirrors upstream)
- development
- production
- faizan (current)
- zaid
- safvan
- faizan-2

## Custom Development Notes

### Initial Setup Completed (2025-06-20)
1. Forked repository to https://github.com/Faizanq/postiz-app
2. Created branches: development, production, faizan, zaid, safvan, faizan-2
3. Successfully set up local development environment
4. All services running:
   - PostgreSQL (5432) & Redis (6379) via Docker
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:4200
   - Workers and Extension built successfully

### Login Instructions
- Go to http://localhost:4200
- Click "Sign up" to create account
- Email verification disabled for local dev (RESEND_API_KEY commented out)
- Accounts activate automatically upon registration

### Known Issues
- Port 8081 conflict (pgAdmin) - not critical
- OAuth providers not configured (optional)
- MAIN_URL warning in backend (non-critical)

### Docker Services
```bash
# Start
docker compose -f docker-compose.dev.yaml up -d

# Stop
docker compose -f docker-compose.dev.yaml down

# Check status
docker ps
```

### Development Process
```bash
# Start dev servers (after Docker is running)
pnpm run dev

# Or run in background
nohup pnpm run dev > dev.log 2>&1 &

# Check logs
tail -f dev.log
```

## E2E Tests

### Customer Platform Configuration Tests
Located in `/tests/e2e/customers/`

**Running the tests:**
```bash
# With visible browser (for debugging)
node tests/e2e/customers/platform-configuration.test.js

# Headless mode (for CI/CD)
HEADLESS=true CLOSE_BROWSER=true node tests/e2e/customers/platform-configuration.test.js
```

**Test Flow:**
1. Login with test credentials (faizanqureshi0@gmail.com / 123123)
2. Navigate to Customers page
3. Open customer dropdown → Click "Manage Platforms"
4. Click "Configure" button on an unconfigured platform
5. Validate modal elements (form fields, buttons, icons)
6. Test form interactions (fill credentials, toggle password visibility)
7. Capture screenshots for documentation

**Important Notes:**
- Tests use Puppeteer for browser automation
- Default viewport: 1200x800
- Screenshots saved to `/tests/e2e/customers/screenshots/`
- Modal opening issue fixed: Use `modals.openModal()` not `modals.open()`