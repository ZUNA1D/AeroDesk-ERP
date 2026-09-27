# AeroDesk
### Modern Travel & Aviation Agency Management ERP

[![Live Demo](https://img.shields.io/badge/Demo-aero--desk--erp.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://aero-desk-erp.vercel.app)
![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Live Application**: [https://aero-desk-erp.vercel.app](https://aero-desk-erp.vercel.app)  
**Demo Credentials**: `admin@aerodesk.com` / `admin123`

---

**AeroDesk** is an enterprise-grade ERP engineered specifically for Travel & Aviation agencies, ticketing consolidators, and visa brokers. It features atomic double-entry bookkeeping, prepaid GDS/BSP portal wallet tracking, consolidator payable credit lines, printable money receipts (with English & Bengali Lakh/Crore word formatting), and a self-healing ledger.

---

## Key Features

### 1. Air Ticketing & Multi-Pax Invoicing
- **Multi-passenger batch invoicing**: Issue tickets for families and corporate groups in a single transaction with individual passenger names, ticket numbers, PNRs, routes, buy prices, and sell prices.
- **Dynamic profit calculations**: Automatic real-time cost, sell, and net margin computation.
- **Real-time balance adjustments**: Instantly increases client outstanding due and automatically draws down from the selected BSP/GDS portal wallet or consolidator credit line.

### 2. Visa Processing & Service Fees
- Comprehensive visa invoice workflow with case tracking, embassy visa fees, service charges, cost price vs sell price margins, and passenger-level records.

### 3. Money Receipts & Client Accounts Receivable
- Collect payments across multiple payment channels: **Cash, Bank Transfer (NPSB / BEFTN / RTGS), Cheques, Cards / POS, Mobile Banking (bKash / Nagad / Rocket)**.
- **Printable Money Receipts**: Standardized vouchers with words conversion (`Taka Ten Thousand Only` / Lakh / Crore formatting).
- Automatic reduction of client outstanding receivables with real-time running balance recalculation.

### 4. Suppliers: BSP Portals & Consolidators
- **Prepaid Portal Wallets**: Track real-time balances of top-up accounts (e.g., Sabre, Amadeus, Galileo, Flyhub, ShareTrip).
- **Consolidator Agency Credit Lines**: Track payable dues and credit limits for credit-line consolidators.
- **In-House / Direct Inventory Stock**: Support for airline direct-allocated inventory with zero liability accounting.
- **ADM & ACM Tracking**: Agency Debit Memos and Agency Credit Memos for airline penalty and rebate adjustments.

### 5. Immutable General Ledger
- Complete financial record of every transaction: Invoices, Receipts, Top-ups, Payments, Expenses, and Memos.
- **Voiding with Audit History**: Safely void erroneous transactions with mandatory audit reasons and automatic ledger reversals.
- **Export to CSV**: One-click download of all filtered records.

### 6. Analytics & Financial Statements
- **Printable Client Statements**: Detailed period-based statement with opening due, billed transactions, payments received, and closing due.
- **Printable Supplier Statements**: Running balance statement for ticket suppliers.
- **Margin Analytics**: Ticket & Visa profit margins by date range with per-transaction breakdowns.
- **Aging Receivables**: Outstanding client balances organized into 0-30, 31-60, 61-90, and 90+ days overdue buckets.

### 7. Security & Self-Healing Maintenance
- **Role-Based Access Control**: `ADMIN`, `MANAGER`, and `STAFF` roles with granular route protections.
- **Compliance Audit Trail**: Immutable logging of all creation, modification, void, and deletion events.
- **Self-Healing Balances**: One-click recalculation tool that audits the raw transaction ledger and repairs any out-of-sync client dues or supplier balances.
- **Light & Dark Theme**: Interface tailored for daytime counter desks or dark-mode finance operations.

---

## Architecture & Double-Entry Ledger

```mermaid
flowchart TD
    subgraph UI ["AeroDesk Frontend (React 18 + Vite)"]
        UI_INV["Issue Ticket / Visa Invoice"]
        UI_REC["Client Money Receipt"]
        UI_SUP["Portal Top-up / Supplier Payment"]
    end

    subgraph API ["Express REST API & Middleware"]
        AUTH["JWT & Role Authorization"]
        TXN["Atomic Transaction Controller"]
        AUDIT["Audit Trail Logger"]
    end

    subgraph DB ["MongoDB Atomic Session"]
        M_TXN[("Transaction Ledger\n(Immutable Record)")]
        M_CLI[("Client Account\n(Current Due)")]
        M_SUP[("Supplier Wallet\n(Balance / Credit)")]
    end

    UI --> API
    API --> DB

    UI_INV -->|Sell: +Due / Cost: -Balance| TXN
    UI_REC -->|Receipt: -Due| TXN
    UI_SUP -->|Top-up: +Balance / Pay: -Payable| TXN
```

Every financial movement executes inside an atomic MongoDB transaction session:
- If an invoice is issued, the **Client Due increases** by the sell total and the **Supplier Balance decreases** by the buy total.
- If an invoice is voided, an exact **reversal entry** is created and balances revert cleanly.
- If data integrity is ever questioned, the **Recalculate Balances** engine re-runs the entire ledger mathematically to verify 100% accuracy.

---

## Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 18 | Client application built with functional hooks & modern state management |
| **Build Tool** | Vite 6 | Lightning-fast HMR and optimized production bundle |
| **Styling** | Vanilla CSS + Tailwind CSS | Custom design tokens with automatic Light/Dark mode transitions |
| **Icons** | Lucide React | Clean, scalable vector icon library |
| **Data Fetching** | TanStack Query v5 | Server state caching, optimistic updates, and background refetching |
| **Backend Runtime** | Node.js (ES Modules) | Asynchronous backend services |
| **Web Framework** | Express 4 | Secure RESTful API with helmet, cors, and cookie-parser |
| **Database** | MongoDB & Mongoose 8 | Document database with atomic session transactions |
| **Authentication** | JWT (JSON Web Tokens) | Secure stateless authentication with role-based access control |

---

## Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/ZUNA1D/AeroDesk-ERP.git
cd AeroDesk-ERP
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/AeroDesk_db
JWT_SECRET=super_secret_jwt_key_aerodesk_2026
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
```
*(Note: If no local MongoDB is running, the backend automatically initializes an embedded in-memory MongoDB replica set for zero-config testing!)*

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Install & Run
```bash
# Install dependencies across all workspaces
npm install

# Run backend (terminal 1)
npm run dev:backend

# Run frontend (terminal 2)
npm run dev:frontend
```

Visit **http://localhost:5173** in your browser.

### 4. Seed Demo Data
To populate demo booking portals, consolidators, sample airlines, routes, and default admin credentials:
```bash
npm run seed
```
- **Email**: `admin@aerodesk.com`
- **Password**: `admin123`

---

## Deployment (Vercel)

AeroDesk is pre-configured with `vercel.json` and `api/index.js` for full-stack monorepo deployment:

1. Push your repository to **GitHub**.
2. In the [Vercel Dashboard](https://vercel.com), click **"Add New Project"** &rarr; Import **`AeroDesk-ERP`**.
3. Leave **Root Directory** as `./` and set **Framework Preset** to `Vite`.
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random secret string
   - `VITE_API_BASE_URL`: `/api`
5. Click **Deploy**. Vercel will build the frontend and serve the backend API serverlessly.

---

## Role-Based Access Control (RBAC)

| Feature / Resource | STAFF | MANAGER | ADMIN |
|---|:---:|:---:|:---:|
| View Dashboard & Metrics | ✅ | ✅ | ✅ |
| Issue Ticket & Visa Invoices | ✅ | ✅ | ✅ |
| Collect Client Money Receipts | ✅ | ✅ | ✅ |
| View General Ledger | ✅ | ✅ | ✅ |
| Top-up Portal & Pay Agency | ❌ | ✅ | ✅ |
| Void Transactions | ❌ | ❌ | ✅ |
| View Financial Profit Reports | ❌ | ✅ | ✅ |
| Recalculate Ledger Balances | ❌ | ❌ | ✅ |
| Manage Agency Settings | ❌ | ❌ | ✅ |
| Manage User Accounts | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ✅ |

---

## Repository Structure

```text
AeroDesk-ERP/
├── api/                       # Vercel serverless function entry point (api/index.js)
├── backend/                   # Express REST API, models, controllers, and services
│   ├── src/
│   │   ├── controllers/       # Handlers for ticketing, visas, ledger, users, reports
│   │   ├── models/            # Mongoose schemas (Transactions, Clients, Suppliers, Users)
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Audit logging, PDF vouchers, ledger calculations
│   │   └── server.js          # HTTP bootstrap server
│   └── package.json
├── frontend/                  # React 18 + Vite Single Page Application
│   ├── src/
│   │   ├── components/        # Reusable UI cards, tables, modals, layout
│   │   ├── pages/             # Dashboard, Invoices, Visas, Ledger, Suppliers, Reports
│   │   └── index.css          # Design system & theme tokens
│   └── package.json
├── vercel.json                # Vercel full-stack routing & build rules
├── package.json               # Root monorepo workspace configuration
└── README.md
```

---

## License

This project is licensed under the **MIT License**. Free for personal and commercial travel agency operations.
