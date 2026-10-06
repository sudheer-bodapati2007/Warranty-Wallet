# 🛡️ Warranty Wallet

**Warranty Wallet** is a polished, modern full-stack web application that helps users keep track of products they own, purchase dates, warranty periods, auto-calculated warranty expiry dates, countdowns, and uploaded invoice/warranty documents.

---

## ✨ Features

- **📊 Dashboard Summary**: Quick overview of Total Products, Active Warranties, Expiring Soon, and Expired items.
- **⏱️ Live Warranty Expiry & Countdown Calculation**: Automatically computes warranty expiry date based on purchase date, duration, and unit (Months/Years) with human-readable countdowns ("245 days left", "Expires today", "Expired 18 days ago").
- **🚨 Priority Expiring Soon Section**: Highlighting products whose warranty expires within 30 days, sorted by nearest expiry date.
- **🔍 Advanced Search & Filtering**: Instantly search products by name, brand, or store, filter by category or warranty status, and sort by date or title.
- **📁 File Uploads**: Upload product photos and invoice receipts (PDF / JPG / PNG) powered by Multer.
- **📝 Product Management**: Complete CRUD functionality (Create, Read, Edit, Delete with safety modal confirmation).
- **📱 Modern & Responsive Design**: Clean SaaS interface built with React, Vite, Tailwind CSS, and Lucide React icons.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **File Uploads**: Multer
- **Utilities**: CORS, dotenv

---

## 📂 Project Structure

```
warranty-wallet/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── WarrantyCard.jsx
│   │   ├── pages/
│   │   │   ├── AddWarranty.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditWarranty.jsx
│   │   │   ├── MyWarranties.jsx
│   │   │   └── WarrantyDetails.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── warrantyController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   └── Warranty.js
│   ├── routes/
│   │   └── warrantyRoutes.js
│   ├── utils/
│   │   └── warrantyHelpers.js
│   ├── uploads/
│   │   └── .gitkeep
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Running Locally

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (MongoDB Atlas connection string or local MongoDB instance `mongodb://localhost:27017/warranty_wallet`)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```
The backend server will run on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```
The frontend application will run on `http://localhost:5173`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/warranties` | Retrieve warranties (supports `search`, `category`, `status`, `sort`) |
| `GET` | `/api/warranties/stats` | Fetch summary stats and expiring soon items |
| `GET` | `/api/warranties/:id` | Fetch single warranty details by ID |
| `POST` | `/api/warranties` | Create new warranty (multipart/form-data for file uploads) |
| `PUT` | `/api/warranties/:id` | Update existing warranty and recalculate expiry |
| `DELETE` | `/api/warranties/:id` | Delete warranty product and remove associated uploaded files |

---

## 🖼️ Screenshots

*(Place application screenshots here)*
- Dashboard Overview
- Warranty Catalog & Search
- Add / Edit Warranty Form
- Product Details & Invoice View

---

## 🚀 Future Improvements

- User Authentication & Multi-user accounts (JWT)
- Email / Push notifications for upcoming warranty expiries
- Barcode / QR Code scanner for serial numbers
- Cloud storage integration (AWS S3 or Cloudinary) for receipts
