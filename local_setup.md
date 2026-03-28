# Local Development Setup Guide

This guide will help you set up and run the GRIT project locally, providing an experience similar to the "live" environment in Replit.

## Prerequisites

- **Node.js**: Version 20 or higher is recommended.
- **PostgreSQL**: Version 16 or higher.
- **Git** (optional): For version control.

## Setup Steps

### 1. Clone or Download the Project
Ensure you have the project files on your local machine.

### 2. Install Dependencies
Run the following command in your terminal:
```bash
npm install
```

### 3. Database Setup
1.  Make sure PostgreSQL is running on your machine.
2.  Create a new database named `grit_db` (or your preferred name).
3.  Copy `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
4.  Update the `DATABASE_URL` in your `.env` file to match your local Postgres credentials:
    ```
    DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/grit_db
    ```
5.  Push the database schema:
    ```bash
    npm run db:push
    ```

### 4. Run the Development Environment
Start the frontend and backend servers concurrently with auto-reload:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: `http://localhost:5000` (Vite)
- **User Backend**: `http://localhost:3001`
- **Admin Backend**: `http://localhost:3002`

## Why this is like Replit
- **Auto-Reload**: When you change any file in `src/` (frontend) or `server/` (backend), the corresponding part of the application will automatically restart or reload.
- **Concurrent Execution**: Both frontend and backend services run simultaneously from a single command.
- **Live Preview**: You can immediately see your changes in the browser at `http://localhost:5000`.

## Common Issues
- **Port Conflict**: If port 5000, 3001, or 3002 is already in use, you might need to change them in `.env` and `vite.config.ts`.
- **Database Connection**: Ensure your Postgres service is active and the credentials in `.env` are correct.
