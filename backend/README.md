# DevInspect AI Backend

Express backend for the DevInspect AI application.

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies: `npm install`.
3. Start the app: `npm run dev`.

## Structure

- `src/config` - database configuration
- `src/controllers` - route handlers
- `src/middleware` - auth and error handling
- `src/models` - Mongoose schemas
- `src/routes` - Express routers
- `src/services` - external or AI service helpers
- `src/utils` - token generation and response helpers
