# XCash — Enterprise Mobile Financial Service

Stack: **React Native (Expo 53)** · **Go (Fiber v2)** · **PostgreSQL 16** · **Redis 7** · **Kafka**

---

## Prerequisites (install once)

| Tool | Download |
|------|----------|
| **Go 1.22+** | https://go.dev/dl/ → `go1.22.x.windows-amd64.msi` |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ |
| **Node.js 20+** | https://nodejs.org (already installed) |

After installing Go and Docker Desktop, **restart your terminal** so PATH updates take effect.

---

## Quick Start (Windows)

### 1. Start infrastructure (Docker Desktop must be running)
```powershell
docker compose up -d
```
Services: PostgreSQL :5432 · Redis :6379 · Kafka :9092

### 2. Start Go backend
```powershell
cd backend
go mod tidy
go run ./cmd/main.go
```
API runs on **http://localhost:8080**

Seed test accounts (first time only):
```powershell
go run ./cmd/seed/main.go
```

### 3. Start Expo mobile app
```powershell
cd mobile
npm install
npx expo start
```
Scan QR code with **Expo Go** app, or press `a` for Android emulator.

### One-click start (after Go is installed)
Double-click **`start.bat`** in the project root — opens backend and mobile in separate windows.

---

## Test Accounts (PIN: `123456`)

| Phone         | Role     | Balance  |
|---------------|----------|----------|
| 01711111111   | user     | ৳5,000   |
| 01722222222   | user     | ৳3,000   |
| 01733333333   | user     | ৳1,000   |
| 01800000001   | agent    | ৳50,000  |
| 01900000001   | merchant | ৳10,000  |
| 01000000000   | admin    | ৳0       |

---

## Features

- Send / Request Money (with PIN confirmation)
- Add Money (Bank / Card / Agent)
- Cash Out (1.8% fee via agents)
- Merchant Payment (QR/phone)
- Mobile Recharge (all operators)
- Bill Pay (electricity, gas, water, internet, TV, education, loan EMI)
- Savings (General / DPS / Goal-based)
- Loan (apply, EMI calculator at 12% p.a.)
- Notifications (Kafka-driven, real-time)
- Rewards & Cashback offers
- Transaction history with filters

---

## Project Structure

```
XCash/
├── backend/          Go + Fiber API
│   ├── cmd/main.go   Entry point
│   ├── cmd/seed/     Test data seeder
│   ├── handlers/     HTTP handlers
│   ├── models/       GORM models
│   ├── kafka/        Producer + consumer
│   └── .env          Config
├── mobile/           React Native + Expo
│   ├── app/          Expo Router screens
│   ├── components/   PinPad, TransactionCard
│   └── context/      Auth, Wallet providers
└── docker-compose.yml
```

---

## Environment

Backend `.env` (pre-configured for local Docker):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=xcash
DB_PASSWORD=xcash_secret
DB_NAME=xcash_db
REDIS_ADDR=localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=xcash_enterprise_jwt_secret_2024_very_long_key
JWT_EXPIRY_HOURS=720
```

**Physical device**: change `mobile/services/api.ts` baseURL from `localhost` to your machine's LAN IP (e.g., `192.168.1.x:8080`).
