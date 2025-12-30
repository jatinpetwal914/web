# Phadizon (local dev)

This repository contains a small Express backend and a frontend shipped in `/frontend`.

## Quick start (run MySQL in Docker and start server)

1. Copy env example:

   cp .env.example .env

2. Start the database (this will initialize schema from `database/phadizon.sql`):

   docker-compose up -d

3. Install Node dependencies (only needed once):

   npm install

4. Start the server:

   npm run start

5. Health check:

   curl -s http://localhost:5000/api/health

If health returns `{ "db": true }` the DB is reachable and the registration endpoint should work.

