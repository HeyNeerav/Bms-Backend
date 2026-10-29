# Business Management System — Backend

This is the backend for the Business Management System (BMS). It provides APIs for managing businesses, clients, products, invoices, and payments.

The project uses Express and TypeScript, with MongoDB for storing data. Users can manage multiple businesses, and each business has its own members and permissions.

**Frontend repository:** [Business Management Dashboard](https://github.com/HeyNeerav/Business-Management-Dashboard)

## Tech Stack

- Node.js
- TypeScript
- Express 5
- MongoDB and Mongoose
- JWT and Passport.js
- Google OAuth 2.0
- Zod
- Cloudinary and Multer
- Resend
- Puppeteer and Handlebars
- Vitest and Supertest
- pnpm

## Features

- User registration and login
- Google login
- Business and team management
- Different roles for business members
- Client management
- Product and service management
- Invoice creation and PDF generation
- Automatic invoice numbering
- Payment recording
- Business statistics
- Product image uploads
- Password reset emails
- Search and pagination
- Request validation
- Automated tests

## Getting Started

### Requirements

Before running the project, install or set up:

- Node.js
- pnpm
- MongoDB configured as a replica set
- A Cloudinary account
- A Resend account
- Google OAuth credentials if you want Google login

MongoDB needs replica set support for database transactions.

### Installation

Clone the repository:

```bash
git clone https://github.com/HeyNeerav/Bms-Backend.git
cd Bms-Backend
```

Install the dependencies:

```bash
pnpm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `.env` and add the required values.

### Run in Development

```bash
pnpm run dev
```
## Docker

The repository includes Docker configuration for mongodb aswell.

Create a mongo-keyfile:

```bash
openssl rand -base64 756 > mongo-keyfile
chmod 400 mongo-keyfile
sudo chown 999:999 mongo-keyfile
```

Run the container:

```bash
docker compose up -d mongo mongo-express
```

Make sure the required environment variables and database connection are configured.

## Project Structure

The backend is divided into modules, with each module handling a different part of the application.

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── businesses/
│   ├── business-members/
│   ├── clients/
│   ├── products/
│   ├── invoices/
│   ├── payments/
│   └── analytics/
├── shared/
├── env.ts
├── app.ts
└── server.ts
```

The modules contain the code for their features, such as routes, controllers, services, validation, and database models.

## API Routes

All API routes use the `/api/v1` prefix.

| Route | Purpose |
|---|---|
| `/auth` | Login and account management |
| `/users` | User management |
| `/businesses` | Business management |
| `/business-members` | Business members and roles |
| `/clients` | Client management |
| `/products` | Product and service management |
| `/invoices` | Invoice management |
| `/payments` | Payment management |
| `/analytics` | Business statistics |
| `/health` | Health check |

## Authentication

Protected routes require a valid access token.

The token can be sent through the access token cookie or the `Authorization` header.

For Bearer token authentication:

```http"
Authorization: Bearer <access-token>
```

The backend also supports Google login.

## Business Access

Business-specific requests use the `x-business-id` header to identify the business.

```http
x-business-id: <business-id>
```

The backend checks whether the logged-in user belongs to that business and has permission to perform the requested action.

Supported roles are:

- `OWNER`
- `ADMIN`
- `EMPLOYEE`

A user can have different roles in different businesses.

## Database

MongoDB stores users, businesses, team members, clients, products, invoices, and payments.

Business memberships are stored separately, allowing users to join multiple businesses.

Invoice items keep the product details and prices used when the invoice was created. Changing a product's price later does not change an existing invoice.

Invoice numbers are generated using a counter to avoid duplicate numbers when invoices are created at the same time.

Database transactions are used when multiple changes need to succeed together.

## File Uploads and PDFs

Cloudinary is used to store uploaded images, and Multer handles file uploads.

Invoice PDFs are generated using Puppeteer and Handlebars.

## Email

Resend is used to send emails, including password reset emails.

Configure the required values in `.env` before using these features.

## Validation and Error Handling

Zod is used to check incoming request data.

The backend also uses shared utilities to handle errors and return API responses.

Protected routes check authentication, business membership, and permissions on the server.

## Testing

The project uses Vitest, Supertest, and MongoDB Memory Server.

Run the tests with:

```bash
pnpm run test
```

MongoDB Memory Server is also used for tests that need database transactions.

## Development Notes

When adding new features:

- Keep related code in the correct module.
- Validate incoming request data.
- Keep business logic in services.
- Check user permissions before allowing access to business data.
- Calculate invoice totals on the backend.
- Use transactions when related database changes must succeed together.
- Add tests for important features.