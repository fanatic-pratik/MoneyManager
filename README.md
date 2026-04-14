# 💰 MoneyManager

A full-stack personal finance tracker built with React, Express, and MongoDB.

## Features

- **Authentication** — Register/login with JWT-based sessions
- **Transactions** — Add income & expenses with categories, tags, payment method, notes
- **Dashboard** — Monthly trend charts, category breakdown (pie chart), budget overview, recent transactions
- **Budgets** — Set per-category monthly spending limits with alert thresholds
- **Categories** — Custom categories with icons and colors (14 defaults created on signup)
- **Filters** — Search, filter by type/category/date range, paginated results
- **Settings** — Update name, currency, change password

## Tech Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 18, React Router 6, Recharts|
| Backend  | Node.js, Express 4                |
| Database | MongoDB + Mongoose                |
| Auth     | JWT + bcryptjs                    |
| Styles   | Pure CSS (no UI library)          |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Clone & install

```bash
git clone <your-repo-url>
cd MoneyManager
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy env file and fill in your values
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/moneymanager
JWT_SECRET=pick_a_long_random_string_here
```

Start backend:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs at **http://localhost:5000**

---

### 3. Frontend setup

```bash
cd client
npm install
npm start
```

Frontend runs at **http://localhost:3000**  
The `"proxy": "http://localhost:5000"` in `client/package.json` forwards all `/api` calls to the backend automatically in dev.

---

### 4. MongoDB Atlas (optional)

Replace `MONGO_URI` in `.env` with your Atlas connection string:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/moneymanager?retryWrites=true&w=majority
```

---

## Project Structure

```
MoneyManager/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── categories.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── client/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── layout/
        │   │   └── AppShell.js       # Sidebar + layout wrapper
        │   └── ui/
        │       ├── TransactionModal.js
        │       └── ConfirmDialog.js
        ├── context/
        │   └── AuthContext.js
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   ├── Transactions.js
        │   ├── Budgets.js
        │   ├── Categories.js
        │   └── Settings.js
        ├── utils/
        │   ├── api.js                # Axios instance
        │   └── helpers.js
        ├── App.js
        ├── index.js
        └── index.css
```

---

## API Reference

### Auth
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /api/auth/register    | Register new user  |
| POST   | /api/auth/login       | Login              |
| GET    | /api/auth/me          | Get current user   |
| PUT    | /api/auth/profile     | Update profile     |
| PUT    | /api/auth/change-password | Change password |

### Transactions
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/transactions               | List (paginated, filtered)|
| POST   | /api/transactions               | Create                   |
| PUT    | /api/transactions/:id           | Update                   |
| DELETE | /api/transactions/:id           | Delete                   |
| GET    | /api/transactions/summary/monthly | Monthly summary        |

### Budgets
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | /api/budgets     | Get budgets with spent % |
| POST   | /api/budgets     | Create/upsert budget     |
| PUT    | /api/budgets/:id | Update                   |
| DELETE | /api/budgets/:id | Delete                   |

### Categories
| Method | Endpoint            | Description     |
|--------|---------------------|-----------------|
| GET    | /api/categories     | List            |
| POST   | /api/categories     | Create          |
| PUT    | /api/categories/:id | Update          |
| DELETE | /api/categories/:id | Delete (custom) |

### Dashboard
| Method | Endpoint                          | Description             |
|--------|-----------------------------------|-------------------------|
| GET    | /api/dashboard/summary            | This month summary      |
| GET    | /api/dashboard/monthly-trend      | 12-month income/expense |
| GET    | /api/dashboard/category-breakdown | Expense by category     |
| GET    | /api/dashboard/budget-overview    | Budgets with spent      |

---

## Production Build

```bash
# Build React app
cd client && npm run build

# Serve static files from Express (add to server.js)
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
```
