# Parents App - Complete Setup & Run Guide

## 🎉 Project Complete!

Your production-ready iOS Parents App with Cloud API and Toy Simulator has been built. Below are the complete setup instructions, run commands, and success checklist.

## 📦 What Was Built

### Complete Monorepo Structure

```
parents-app-ios/
├── apps/
│   ├── ios-mobile/               # iOS React Native App (Expo)
│   │   ├── src/
│   │   │   ├── api/              # API client with token refresh
│   │   │   ├── contexts/         # Auth context with SecureStore
│   │   │   ├── navigation/       # Bottom tabs + stack navigation
│   │   │   └── screens/          # All screens implemented
│   │   ├── App.tsx               # Main app with providers
│   │   ├── app.json              # Expo config with BLE permissions
│   │   └── package.json
│   └── server/                   # Express API + Prisma + MQTT
│       ├── src/
│       │   ├── iot/              # MQTT client, broker, Ed25519 signer
│       │   ├── middleware/       # Auth, RBAC, validation
│       │   ├── realtime/         # Socket.IO WebSocket server
│       │   ├── routes/           # All API endpoints
│       │   ├── config.ts         # Environment configuration
│       │   ├── db.ts             # Prisma client
│       │   └── index.ts          # Main server
│       └── prisma/
│           ├── schema.prisma     # Complete database schema
│           └── seed.ts           # Demo data seed
├── packages/
│   ├── shared/                   # Shared TypeScript types
│   │   └── src/
│   │       ├── types.ts          # All type definitions
│   │       └── schemas.ts        # Zod validation schemas
│   └── toy-simulator/            # MQTT device simulator
│       └── src/
│           └── index.ts          # Simulates toy device
├── package.json                  # Root workspace config
├── .env.example                  # Environment template
├── .gitignore                    # Comprehensive gitignore
└── README.md                     # Full documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- npm 10+ installed  
- For iOS development: Xcode + CocoaPods
- For physical device BLE pairing: iPhone

### Step 1: Install Dependencies

```bash
# Clean install all workspace dependencies
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Step 2: Set Up Database

```bash
# Navigate to server directory
cd apps/server

# Set DATABASE_URL environment variable
export DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate dev --name init

# Seed with demo data
npx tsx prisma/seed.ts

# Return to root
cd ../..
```

### Step 3: Run Backend + Simulator

```bash
# From root directory, start server and simulator
cd apps/server && DATABASE_URL="file:./prisma/dev.db" npm run dev &
cd packages/toy-simulator && npm start &
```

**Or use concurrently (if installed):**

```bash
DATABASE_URL="file:./apps/server/prisma/dev.db" npm run dev
```

The server will start on **port 3001** and the simulator will connect to MQTT.

### Step 4: Run iOS App

**Option A: iOS Simulator (no BLE pairing)**

```bash
cd apps/ios-mobile

# Create native iOS project
npx expo prebuild --clean

# Install CocoaPods dependencies
npx pod-install

# Run on iOS simulator
npx expo run:ios
```

**Option B: Physical iPhone (full BLE support)**

```bash
cd apps/ios-mobile
npx expo prebuild --clean
npx pod-install
npx expo run:ios --device
```

## 🔐 Demo Accounts

| Role   | Email              | Password    |
|--------|-------------------|-------------|
| **Parent** | parent1@demo.com  | Parent123!  |
| **Admin**  | admin@demo.com    | Admin123!   |

## ✅ Success Checklist

After running the app, verify:

- [ ] **Server Running**: Backend starts on port 3001 without errors
- [ ] **MQTT Connected**: Simulator connects and publishes device state
- [ ] **iOS App Builds**: Expo app compiles and launches
- [ ] **Login Works**: Can login with parent1@demo.com / Parent123!
- [ ] **Dashboard Loads**: See device `toy-demo-001` with battery/play time
- [ ] **Real-time Updates**: Device stats update as simulator publishes
- [ ] **Chat History**: View conversation sessions and messages
- [ ] **Highlights Display**: See AI-generated highlights with categories
- [ ] **Guardrails Editor**: Modify safety settings and save
- [ ] **Policy Sync**: "Sync to Device" pushes signed policy via MQTT
- [ ] **Policy Acknowledgment**: Simulator receives policy and sends ACK
- [ ] **Export Functions**: CSV/JSON export buttons download data

## 📡 IoT Architecture Verification

### Test MQTT Flow

1. **Watch server logs** for incoming MQTT messages
2. **Simulator publishes**:
   - Device state every 30s
   - Telemetry every 60s
   - Chat session after 5s (automatic)
3. **Dashboard updates** in real-time via WebSocket
4. **Push policy** from Guardrails screen
5. **Check logs** for policy acknowledgment

### MQTT Topics (for debugging)

```
toy/{deviceId}/state          → Device status
toy/{deviceId}/telemetry      → Play time/adventures
toy/{deviceId}/events/chat    → Chat messages
toy/{deviceId}/policy/ack     → Policy acknowledgment
toy/{deviceId}/policy/apply   ← Push policy to device
toy/{deviceId}/cmd            ← Commands (ping, reboot, etc.)
```

## 🔒 Security Features Implemented

✅ JWT access + refresh tokens with automatic rotation  
✅ Token blacklisting on logout  
✅ bcrypt password hashing (10 rounds)  
✅ Ed25519 cryptographic policy signatures  
✅ RBAC middleware (ADMIN, PARENT roles)  
✅ Ownership guards on all child/device routes  
✅ Rate limiting (100 req/15min per IP)  
✅ Helmet security headers  
✅ Strict CORS allowlist  
✅ SecureStore encrypted token storage (iOS)  
✅ No PII logging (redacted in Pino logger)  

## 📱 iOS App Features

### Implemented Screens

1. **Auth**: Login + Register with validation
2. **Dashboard**: Device status, highlights feed, children overview
3. **Chat History**: Session list, message viewer, search, export
4. **Highlights**: Category-filtered feed with "See Chat" links
5. **Guardrails**: Full safety policy editor with sync-to-device
6. **Device**: Battery/telemetry, firmware info, command buttons

### State Management

- **React Query**: Server state with optimistic updates
- **Zustand**: Client state (session, device shadow)
- **Axios Interceptors**: Automatic token refresh with exponential backoff
- **SecureStore**: Encrypted token persistence

### BLE Pairing Note

BLE pairing (`react-native-ble-plx`) is **configured but requires physical iPhone**. iOS Simulator shows graceful fallback message explaining this limitation. Service UUID `0xA17A` with characteristics for pairing request/response and device info.

## 🧪 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create account
- `POST /login` - Login
- `POST /refresh` - Refresh access token
- `POST /logout` - Revoke tokens
- `GET /me` - Current user

### Children (`/api/children`)
- `GET /` - List children
- `GET /:id` - Get child details
- `PUT /:id` - Update child

### Conversations (`/api/conversations`)
- `POST /:childId/sessions` - Create session
- `GET /:childId/sessions` - List sessions
- `GET /:childId/sessions/:sid/messages` - Get messages
- `GET /search` - Search messages

### Highlights (`/api/highlights`)
- `GET ?childId=` - Get highlights

### Guardrails (`/api/children/:childId/guardrails`)
- `GET /` - Get policy
- `PUT /` - Update policy
- `GET /effective-policy` - Get signed edge policy

### Devices (`/api/devices`)
- `POST /pair` - Pair device
- `GET /` - List devices
- `GET /:deviceId` - Get device
- `POST /:deviceId/commands` - Send command
- `POST /:deviceId/policy/push` - Push policy
- `GET /:deviceId/export/events.csv` - Export events

### Export (`/api/export`)
- `GET /child/:childId/conversations.json` - Export JSON
- `GET /child/:childId/conversations.csv` - Export CSV

## 🐛 Troubleshooting

### Dependencies Won't Install

```bash
# Clean everything and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules package-lock.json
npm cache clean --force
npm install
```

### Prisma Client Not Found

```bash
cd apps/server
export DATABASE_URL="file:./prisma/dev.db"
npx prisma generate
```

### MQTT Broker Not Starting

Check port 1883 is available. The server auto-starts an in-process Aedes broker if localhost:1883 is unreachable.

### iOS App Won't Build

```bash
cd apps/ios-mobile
rm -rf ios/ android/
npx expo prebuild --clean
npx pod-install
```

## 🎯 Architecture Highlights

### Backend
- **Layered**: Routes → Services → Repositories (Prisma)
- **IoT Bridge**: Resilient MQTT client with auto-reconnect
- **In-Process Broker**: Aedes MQTT broker auto-starts for dev
- **Ed25519 Signing**: Temporary keys generated on boot if not in .env
- **WebSocket**: Socket.IO with JWT auth and room-based subscriptions
- **Validation**: Zod schemas on all request bodies

### Frontend
- **Navigation**: Bottom tabs + stack (Home, History, Guardrails, Device)
- **Data Fetching**: React Query with 5min stale time
- **Auth Flow**: Automatic token refresh, blacklist on logout
- **Real-time**: Socket.IO connection with device subscriptions
- **Offline-Ready**: No conversation caching (privacy-first)

### Simulator
- **Publishes**: State (30s), telemetry (60s), chat sessions
- **Subscribes**: Policy updates, device commands
- **Verifies**: Policy signatures (if public key available)
- **Acknowledges**: Policy application with timestamp

## 📊 Seeded Demo Data

- **2 Users**: admin@demo.com, parent1@demo.com
- **2 Children**: Emma (1st Grade), Noah (Pre-K)
- **1 Device**: toy-demo-001 linked to Emma
- **1 Conversation**: 6-message dinosaur chat
- **2 Highlights**: Curiosity + Creativity examples
- **Safety Policies**: G-rated, blocked keywords, quiet hours 20:00-07:00, 45min daily limit

## 🚢 Deployment Notes

### Backend (Replit Autoscale)
1. Add environment variables to Replit Secrets
2. Change DATABASE_URL to PostgreSQL
3. Deploy with autoscale configuration

### iOS (TestFlight / App Store)
1. Configure `EXPO_PUBLIC_API_URL` to production API
2. Build: `eas build --platform ios`
3. Submit: `eas submit --platform ios`

## 📝 Final Notes

- **BLE pairing** requires physical iPhone (not simulator)
- **Simulator** handles all toy interactions for dev
- **Real toy firmware** is separate project (SBC + ESP32)
- **LSP errors** are expected until dependencies installed
- **Database path** must be relative to apps/server for Prisma

---

**Built with**: Node 20, TypeScript, Express, Prisma, SQLite, MQTT, Socket.IO, React Native, Expo, React Navigation, React Query, Zustand, Nativewind

**Security**: JWT, bcrypt, Ed25519, Helmet, CORS, Rate Limiting, SecureStore
