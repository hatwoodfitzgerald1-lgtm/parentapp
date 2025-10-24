# Parents App - iOS Mobile + Cloud API + Toy Simulator

Production-ready iOS application (React Native + Expo) with Node/Express backend for monitoring AI Toy interactions. Features real-time device communication via MQTT, safety guardrails management, conversation history, and cryptographically signed policy synchronization.

## 🎯 What's Included

This repository contains:

- **iOS Mobile App** (`apps/ios-mobile`) - React Native + Expo Dev Client
- **Cloud API Server** (`apps/server`) - Node.js + Express + Prisma + MQTT
- **Shared Packages** (`packages/shared`) - TypeScript types and Zod schemas
- **Toy Simulator** (`packages/toy-simulator`) - MQTT device simulator for development

**Note**: The actual AI Toy firmware (SBC runtime + ESP32) is a separate project. The simulator allows full-stack development without physical hardware.

## 📋 Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Xcode** (for iOS)
- **CocoaPods** (for iOS native dependencies)
- **Expo CLI** (will be installed as dev dependency)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all workspace dependencies and generate Prisma client.

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

### 3. Initialize Database

```bash
# Create SQLite database and run migrations
npm run migrate

# Seed with demo data
npm run seed
```

### 4. Run Backend + Simulator

```bash
npm run dev
```

This starts:
- **Express server** on port 3001
- **In-process MQTT broker** on port 1883
- **Toy simulator** publishing state/telemetry/chat events

### 5. Run iOS App

**Option A: iOS Simulator (BLE pairing disabled)**

```bash
cd apps/ios-mobile
npx expo prebuild
npx pod-install
npx expo run:ios
```

**Option B: Physical iPhone (BLE pairing enabled)**

```bash
cd apps/ios-mobile
npx expo prebuild
npx pod-install
npx expo run:ios --device
```

## 🔐 Demo Accounts

| Role   | Email              | Password    |
|--------|-------------------|-------------|
| Admin  | admin@demo.com    | Admin123!   |
| Parent | parent1@demo.com  | Parent123!  |

## 📱 iOS App Features

### Authentication
- Secure login/register with JWT tokens
- Access + refresh token rotation
- Tokens stored in SecureStore (encrypted)

### Dashboard
- Device status (battery, play time, adventures)
- Recent highlights feed
- Children overview

### Chat History
- View conversation sessions
- Full message timeline
- Search and filter
- Export to CSV/JSON

### Highlights
- AI-generated highlights by category:
  - Curiosity, Creativity, Social Skills, Emotions, Learning
- Link to source conversation
- Filterable by child

### Safety Guardrails
- Age rating (G, PG, PG13)
- Blocked keywords management
- Daily time limits
- Quiet hours configuration
- Custom AI instructions
- Sync policy to device (signed with Ed25519)

### Device Management
- Device pairing (BLE on physical device)
- Battery and telemetry monitoring
- Firmware version tracking
- Send commands (ping, reboot, OTA check)
- Policy synchronization

## 🔧 Backend API Routes

### Authentication (`/api/auth`)
- `POST /register` - Create new parent account
- `POST /login` - Login with email/password
- `POST /refresh` - Refresh access token
- `POST /logout` - Revoke tokens
- `GET /me` - Get current user

### Children (`/api/children`)
- `GET /` - List parent's children
- `GET /:id` - Get child details
- `PUT /:id` - Update child info

### Conversations (`/api/conversations`)
- `POST /:childId/sessions` - Create session
- `GET /:childId/sessions` - List sessions
- `GET /:childId/sessions/:sid/messages` - Get messages
- `POST /:childId/sessions/:sid/messages` - Add message
- `GET /search` - Search messages

### Highlights (`/api/highlights`)
- `GET ?childId=` - Get highlights for child
- `POST /` - Create highlight (admin only)

### Guardrails (`/api/children/:childId/guardrails`)
- `GET /` - Get safety policy
- `PUT /` - Update safety policy
- `GET /effective-policy` - Get signed edge policy

### Devices (`/api/devices`)
- `POST /pair` - Pair new device
- `GET /` - List devices
- `GET /:deviceId` - Get device details
- `POST /:deviceId/commands` - Send command
- `POST /:deviceId/policy/push` - Push policy to device
- `GET /:deviceId/health` - Device health check
- `GET /:deviceId/export/events.csv` - Export events

### Export (`/api/export`)
- `GET /child/:childId/conversations.json` - Export as JSON
- `GET /child/:childId/conversations.csv` - Export as CSV

## 🔌 IoT Architecture

### MQTT Topics

**Toy → Cloud**
- `toy/{deviceId}/state` - Device status updates
- `toy/{deviceId}/telemetry` - Play time and adventures count
- `toy/{deviceId}/events/chat` - Chat message events
- `toy/{deviceId}/policy/ack` - Policy acknowledgment

**Cloud → Toy**
- `toy/{deviceId}/policy/apply` - Push signed safety policy
- `toy/{deviceId}/cmd` - Device commands

### Edge Policy Format

```json
{
  "schemaVersion": 1,
  "version": 2,
  "deviceId": "toy-demo-001",
  "childId": "child-emma-001",
  "ageRating": "G",
  "blockedKeywords": ["violence", "location", "phone number"],
  "allowedTopics": ["science", "art", "nature"],
  "quietHours": { "startMin": 1200, "endMin": 420 },
  "dailyMinutesMax": 45,
  "customInstructions": "Keep responses age-appropriate",
  "issuedAt": "2025-10-24T12:00:00Z",
  "signature": {
    "alg": "Ed25519",
    "sigBase64": "..."
  }
}
```

### Real-time WebSocket

- Path: `/realtime`
- Auth: Access token via `socket.handshake.auth.token`
- Rooms: `user:{userId}`, `device:{deviceId}`
- Events: `device:update`, `conversation:update`, `highlight:new`

## 🔒 Security Features

- **Authentication**: JWT with access + refresh tokens, token blacklist
- **RBAC**: Role-based access (ADMIN, PARENT) with ownership guards
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: HTTP security headers
- **CORS**: Strict allowlist
- **Password Hashing**: bcrypt with salt rounds
- **Policy Signing**: Ed25519 cryptographic signatures
- **SecureStore**: Encrypted token storage on iOS
- **No PII Logging**: Structured logging with sensitive data redaction

## 🧪 Development

### Run Tests

```bash
npm test
```

### Lint & Type Check

```bash
npm run lint
npm run typecheck
```

### Prisma Commands

```bash
# Generate client
npm run prisma:generate

# Create migration
npx prisma migrate dev --schema=apps/server/prisma/schema.prisma --name your_migration_name

# View database
npx prisma studio --schema=apps/server/prisma/schema.prisma
```

## 📦 Project Structure

```
parents-app-ios/
├── apps/
│   ├── ios-mobile/          # Expo React Native app
│   │   ├── src/
│   │   │   ├── api/         # API client with interceptors
│   │   │   ├── contexts/    # Auth context
│   │   │   ├── navigation/  # React Navigation setup
│   │   │   └── screens/     # All app screens
│   │   ├── app.json         # Expo config
│   │   └── package.json
│   └── server/              # Express API
│       ├── src/
│       │   ├── iot/         # MQTT client, broker, policy signer
│       │   ├── middleware/  # Auth, validation, RBAC
│       │   ├── realtime/    # Socket.IO server
│       │   ├── routes/      # API endpoints
│       │   └── index.ts     # Main server
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
├── packages/
│   ├── shared/              # Shared TypeScript types
│   │   └── src/
│   │       ├── types.ts     # Type definitions
│   │       └── schemas.ts   # Zod validation schemas
│   └── toy-simulator/       # Development simulator
│       └── src/
│           └── index.ts     # MQTT device simulator
└── package.json             # Root workspace config
```

## ✅ Success Checklist

- [ ] iOS app builds and launches (Dev Client)
- [ ] Login works with demo accounts
- [ ] Device `toy-demo-001` appears on Dashboard
- [ ] Device shows battery, play time, adventures
- [ ] Sync to Toy pushes signed policy
- [ ] Policy acknowledgment received (check server logs)
- [ ] Conversation messages stream into Chat History
- [ ] Highlights render with categories
- [ ] Export CSV/JSON downloads work
- [ ] Guardrails editor saves and syncs

## 🚀 Production Deployment

### Backend (Replit Autoscale recommended)

1. Set environment variables in Replit Secrets
2. Change `DATABASE_URL` to PostgreSQL connection string
3. Run migrations: `npm run migrate`
4. Deploy API with autoscale configuration

### iOS App

1. Configure API URL: Set `EXPO_PUBLIC_API_URL` in `.env`
2. Build: `cd apps/ios-mobile && eas build --platform ios`
3. Submit: `eas submit --platform ios`

## 🔮 Future Enhancements

- **Redis**: Token blacklist, session management, pub/sub scaling
- **E2E Encryption**: Encrypt chat messages using ECDH keys
- **Admin Dashboard**: Web interface for fleet management
- **OTA Updates**: Firmware update pipeline with signed manifests
- **PostgreSQL**: Migrate from SQLite for production
- **Android Support**: Cross-platform mobile app

## 📄 License

Proprietary - All rights reserved

---

**Note**: BLE pairing only works on physical iPhone devices. iOS Simulator will show a helpful message explaining this limitation. All other features work in the simulator.
