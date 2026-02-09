# MeetBook Backend

The server-side application for the **MeetBook** project, built with **Node.js**, **Express**, and **PostgreSQL**. It provides a secure REST API for user authentication and management.

## 🚀 Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Web Framework:** [Express 5](https://expressjs.com/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) (via `pg` pool)
* **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) with Access & Refresh token strategy
* **Validation:** [Zod](https://zod.dev/)
* **Security:** [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing

## 🛠 Features

* **Secure Authentication:** Registration and Login with encrypted passwords.
* **JWT Token Management:** Short-lived Access tokens (15m) and long-lived Refresh tokens (7d) stored in secure HTTP-only cookies.
* **Data Validation:** Strict schema validation for all authentication requests.
* **Centralized Error Handling:** Custom `AppError` class and async wrapper for consistent API responses.

## 📋 API Endpoints

### Authentication
* `POST /auth/register` - Create a new user account.
* `POST /auth/login` - Authenticate user and receive cookies.
* `POST /auth/refresh` - Refresh access tokens using a valid refresh token.
* `POST /auth/logout` - Clear authentication cookies.
* `GET /auth/user` - Get current authenticated user profile (Protected).

### Users
* `GET /api/users` - List all registered users (Protected).

## ⚙️ Setup & Installation

### Prerequisites
* Node.js (v18+ recommended)
* PostgreSQL database
* [pnpm](https://pnpm.io/) package manager

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3.  Create a `.env` file in the root directory and set the environment variables:
    ```env
    PORT=3001
    DATABASE_URL=postgres://user:password@localhost:5432/meetbook
    JWT_ACCESS_SECRET=ваш_секрет_access
    JWT_REFRESH_SECRET=ваш_секрет_refresh
    ```

### Development
Starting the server in development mode with automatic reboot:
```bash
pnpm run dev