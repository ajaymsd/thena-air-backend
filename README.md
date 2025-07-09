
# ✈️ ThenaAir Flight Booking System – Backend

This is the **backend service** for the **ThenaAir Flight Booking System**, a Node.js and Express.js application responsible for:

- ✅ Admin flight management (CRUD operations)
- ✅ Booking stats & dashboard
- ✅ Secure Razorpay payment processing
- ✅ Sending e-ticket confirmation emails
- ✅ Swagger API documentation

> Deployed on Vercel (serverless functions compatible)  
> Built with scalability and modularity in mind

---

## 🚀 Features

- **Admin APIs** to manage flights, bookings, payments, and dashboard
- **Razorpay Integration** for secure and fast payments
- **Email Notification** system using NodeMailer
- **Validation & Rate Limiting** middleware for secure request handling
- **Swagger Documentation** via `/swagger.json` and Swagger Editor
- Clean, modular project structure (`controllers`, `routes`, `middleware`, `utils`)

---

## ⚙️ Tech Stack

- **Node.js** (v18+)
- **Express.js**
- **Razorpay SDK**
- **Swagger JSDoc**
- **NodeMailer**
- **Vercel** (for serverless deployment)

---

## 🛠️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/flight-booking-backend.git
cd thena-air-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env` File

Create a `.env` file at the root of your project and add the following:

```env
PORT=3001

# Supabase Keys
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Keys
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# SMTP Credentials (for email confirmations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
MAX_EMAIL_WORKERS=2
```
> ⚠️ Keep your `.env` file private and **never commit it** to GitHub!

---

## Supabase Tables creation
1. Go to your supabase project
2. Open SQL Editor
3. Go the path - thena-air-backend/src/database/schema.sql
4. Paste the below sql queries to create tables

## 🧪 Run the App Locally

```bash
npm start
```

Access:
- Swagger JSON: `http://localhost:3001/swagger.json`
- Admin Routes: `http://localhost:3001/api/admin/*`
- Payment Routes: `http://localhost:3001/api/payment/*`

---

## 🧰 API Documentation (Swagger)

This project uses **Swagger JSDoc** for API docs.

### 🔎 View Locally:

```bash
npm start
```

Then open:  
➡️ `http://localhost:3001/api-docs`

### 🌐 View on Vercel:
Swagger UI won’t load on Vercel due to static file issues.

Instead:

1. Visit `https://thena-air-backend.vercel.app/swagger.json`
2. Go to [https://editor.swagger.io](https://editor.swagger.io)
3. Click **File → Import URL**
4. Paste the above Swagger JSON URL
5. 🎉 Full interactive docs!

---

## 📁 Project Structure

```
.
├── server.js                     # Main entry point for local/server environments
├── vercel.json                   # Vercel serverless deployment config
├── .env                          # Environment variables
├── package.json                  # Project metadata and dependencies
├── README.md                     # Project documentation
└── src/
    ├── config/                   # Configuration files
    │   ├── email.js              # Nodemailer config
    │   └── razorpay.js           # Razorpay instance setup
    │
    ├── controllers/              # Route controller logic
    │   ├── adminController.js    # Admin flight/bookings/payments
    │   ├── paymentController.js  # Razorpay payments
    │   └── ticketController.js   # Ticket handling (e.g., post-payment)
    │
    ├── lib/
    │   └── supabase.js           # Supabase database connection/util
    │
    ├── database/
    │   └── schema.sql           # Supabase Table schema(Query to execute for creating tables in supabase)
    │
    ├── middleware/               # Custom middleware
    │   ├── adminAuth.js          # Admin JWT auth guard
    │   ├── errorHandler.js       # Global error handler
    │   └── validation.js         # Request validation & rate limiting
    │
    ├── routes/                   # Express routes
    │   ├── index.js              # Master router that combines all
    │   ├── adminRoutes.js        # Admin flight/dashboard routes
    │   ├── paymentRoutes.js      # Razorpay payment routes
    │   └── ticketRoutes.js       # Ticket download/email routes
    │
    ├── services/                 # Business logic (non-controller)
    │   ├── emailService.js       # Handles sending emails
    │   ├── pdfService.js         # Generates PDFs for tickets
    │   └── workerManager.js      # Background workers for email, etc.
    │
    ├── utils/                    # Helper utilities
    │   ├── crypto.js             # Encryption, hashing utilities
    │   ├── logger.js             # Logger setup
    │   ├── swagger.js            # Swagger JSDoc setup
    │   └── validation.js         # Schema validators
    │
    └── workers/
        └── emailWorker.js        # Email processing in background

```

---

## 🧪 Sample Admin Endpoints

### 🔹 Get All Flights

```
GET /api/admin/flights
```

### 🔹 Create New Flight

```
POST /api/admin/flights
Content-Type: application/json

{
  "flight_number": "AI-202",
  "departure": "Chennai",
  "destination": "Delhi",
  "departure_time": "2025-07-09T10:00:00Z",
  "arrival_time": "2025-07-09T12:00:00Z",
  "price": 4500,
  "seats_available": 150
}
```

---

## 📮 Payment Flow

1. `POST /api/payment/create-order` → Generates Razorpay Order
2. `POST /api/payment/verify-payment` → Verifies signature and confirms payment
3. `GET /api/payment/order/:orderId` → Gets Razorpay order details
4. `GET /api/payment/payment/:paymentId` → Gets payment status

---

## 📧 Confirmation Emails

After successful payment, the backend sends:
- 📧 A confirmation email with **e-ticket PDF** (or HTML)

> Uses SMTP (NodeMailer) — configure in `.env`

---

## 🌐 Deployment Notes

### ✅ Works locally with Swagger UI

### ❌ Swagger UI does **not** work directly on Vercel due to static file serving issues.

**Use `swagger.json` + Swagger Editor instead**.

---
---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m "Add feature"`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a pull request!

---
