# TCG Hub

Web application for trading card game collectors to manage collections, track prices, and find local card shops.

**Course:** CMPSC 431W - Database Management Systems (Penn State)
**Term:** Fall 2024
**Team:** Garrett Fincke & Yash Tumuluri

---

## Features

| Feature | Description |
|---------|-------------|
| Collection Management | Organize and track your card collection |
| Price Tracking | Monitor card values with Chart.js visualizations |
| Shopping Platform | Browse and purchase cards with cart system |
| Store Locator | Find nearby card shops via Google Maps |
| User Profiles | Authentication, order history, profile editing |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, React Router, Tailwind CSS |
| Backend | Express.js, SQLite3 |
| Auth | bcrypt password hashing |
| Visualization | Chart.js |
| Maps | React Google Maps API |

---

## Pages

| Page | Description |
|------|-------------|
| Home | Dashboard and navigation |
| Collection Management | Add, edit, remove cards from collection |
| Price Tracking | View card value trends and charts |
| Shopping Platform | Browse cards, add to cart, checkout |
| User Profile | Account settings, order history |

---

## Architecture

```
tcghub/
├── src/
│   ├── components/
│   │   ├── CardGrid.jsx         # Card display grid
│   │   ├── CardItem.jsx         # Individual card component
│   │   ├── CartModal.jsx        # Shopping cart overlay
│   │   ├── LoginForm.jsx        # Authentication form
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── SearchBar.jsx        # Card search input
│   │   └── SortFilterBar.jsx    # Collection filtering
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── CollectionManagement.jsx
│   │   ├── PriceTracking.jsx
│   │   ├── ShoppingPlatform.jsx
│   │   └── UserProfile.jsx
│   ├── hooks/
│   │   ├── useAuthentication.jsx
│   │   ├── useCardData.jsx
│   │   ├── useCart.jsx
│   │   ├── useCollectionManagement.jsx
│   │   ├── useLocation.jsx
│   │   └── useOrders.jsx
│   ├── server/
│   │   └── api.jsx              # Express API server
│   └── data/
│       └── data.sqlite          # SQLite database
├── tailwind.config.js
└── package.json
```

---

## Setup

**Prerequisites:** Node.js v14+

```bash
# Clone and install
git clone https://github.com/ggfincke/TCGhub
cd tcghub/tcghub
npm install

# Terminal 1: Start React frontend (port 3000)
npm start

# Terminal 2: Start Express backend (port 3001)
node src/server/api.jsx

# Or with auto-reload
npx nodemon src/server/api.jsx
```

---

## Database

SQLite database (`src/data/data.sqlite`) stores:
- User accounts and authentication
- Card collections per user
- Order history
- Card catalog and pricing data
