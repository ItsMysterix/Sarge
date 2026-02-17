# Sarge Architecture

Sarge is built with a modern, scalable architecture designed for high availability and low latency.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion.
- **Backend API**: tRPC for type-safe communication.
- **Database**: Postgres (Neon) for persistent storage.
- **State Management**: React Query (via tRPC) and Zustand.
- **Security**: NextAuth.js and custom secure procedures.

## Core Components
### 1. The Dashboard (Next.js)
The primary user interface for managing resources.

### 2. tRPC Router
Aggregates all business logic and provides a type-safe interface for the frontend.

### 3. Worker Services
Background processes that handle deployments, monitoring, and AI analysis.

### 4. Database Schema
Managed via `schema.ts` with automatic migration checks on startup.
