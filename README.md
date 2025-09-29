# REDI - Cornell's Dating App 💕

> Are you Redi to find love??

Cornell's first and best dating app, connecting students through authentic campus experiences.

## 📁 Project Structure

- **`/backend`** - Node.js/Express API server with Firebase integration
- **`/frontend`** - React Native mobile app built with Expo
- **`/redi-web`** - Next.js landing page for marketing and waitlist

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with Firestore and Authentication enabled
- Cornell NetID for testing

### 1. Clone and Install

```bash
git clone <repository-url>
cd redi
npm install  # Install root dependencies
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file with Firebase credentials
cp .env.example .env  # Edit with your Firebase config

# Start development server
npm run dev  # Runs on http://localhost:3001
```

#### Backend Environment Variables (.env)

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
REACT_APP_API_URL=http://localhost:3001
```

### 3. Mobile App Setup

```bash
cd frontend
npm install

# Configure Firebase (add your config files)
# - google-services.json (Android)
# - GoogleService-Info.plist (iOS)

# Start Expo development server
npm start  # Choose platform (iOS/Android/Web)
```

### 4. Landing Page Setup

```bash
cd redi-web
npm install

# Start Next.js development server
npm run dev  # Runs on http://localhost:3000
```

## 🔧 Development Commands

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run list-emails` - List all waitlist emails

### Frontend (Mobile App)

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

### Landing Page

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

### Firestore Collections

- **`users`** - Authentication data (netid, email, firebaseUid)
- **`profiles`** - Dating profiles (bio, photos, Cornell-specific data)
- **`landing-emails`** - Waitlist email collection

### Key Features

- Cornell NetID-based authentication
- Profile management with Cornell schools/majors
- Image uploads via Firebase Storage
- Matching system framework (algorithm TBD)

## 🚨 API Endpoints

### Authentication

- `POST /api/users` - Create new user
- `POST /api/users/login` - User login

### Profiles

- `GET /api/profiles` - List profiles (with filters)
- `GET /api/profiles/me` - Get current user's profile
- `GET /api/profiles/:netid` - Get profile by NetID
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/me` - Update current user's profile
- `DELETE /api/profiles/me` - Delete current user's profile
- `GET /api/profiles/matches` - Get potential matches

### Landing Page

- `GET /api/landing-emails` - Get waitlist emails
- `POST /api/landing-emails` - Add email to waitlist

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd backend && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

## 🚀 Deployment

### Backend

Deploy to your preferred platform (Heroku, Railway, Render, etc.) with environment variables configured.

### Frontend

```bash
# Build for production
cd frontend
npm run build:web  # For web deployment
eas build  # For app store builds (requires Expo account)
```

### Landing Page

Automatically deployed via Netlify on push to main branch.

## 🎯 Development Roadmap

- [ ] Implement sophisticated matching algorithm
- [ ] Add comprehensive test coverage
- [ ] Implement push notifications
- [ ] Add real-time messaging
- [ ] Enhanced profile customization

## 👥 The Dream Team

- **TPM**: Juju Crane
- **Designer/Frontend Dev**: Clément Rozé
- **Designer**: Brandon Lee
- **PM**: Arsh Aggarwal
- **Dev**: Abrar Amin

## 📄 License

Private project - Cornell DTI
