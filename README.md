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
- [Xcode](https://developer.apple.com/xcode/) (required for iOS development)
- iOS Simulator (installed via Xcode > Settings > Platforms)
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

npm run [platform: ios, android, web]
```

#### Running on iOS Simulator

```bash
cd frontend/ios
npm run ios
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

#### Email Management Scripts

Located in `/backend/scripts/`:

- **Clean Email Data**: `node scripts/clean-emails.js`
  Removes test/fake emails and duplicates from `response.json`

- **Batch Upload Emails**: `npx tsx scripts/upload-emails.ts`
  Uploads cleaned emails from `response.json` to Firebase Firestore in batches
  - Processes emails in batches of 500 (Firestore limit)
  - Automatically skips duplicates
  - Updates global stats counter
  - Includes verification and detailed logging

**Usage Example:**

```bash
cd backend

# First, clean the email data
node scripts/clean-emails.js

# Then upload to Firebase
npx tsx scripts/upload-emails.ts

# Run this command from the root of project to add admin:

  cd backend
  ADMIN_EMAIL=jlc565@cornell.edu npx ts-node scripts/setAdminByEmail.ts
```

**Requirements:**

- `response.json` file in backend root containing array of `{id, email}` objects
- Firebase project configured with proper credentials in `.env`
- `landing-emails` and `stats` Firestore collections (auto-created if missing)

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

We use Heroku for our backend deployment.

### Frontend

Frontend deployment is done through Netlify.

### Landing Page

Automatically deployed via Netlify on push to main branch.

### Formatting

Available formatting commands:

From root directory:

- npm run format - Format all files across the entire codebase
- npm run format:check - Check formatting without making changes
- npm run format:backend - Format only backend files
- npm run format:frontend - Format only frontend files
- npm run format:web - Format only web files

From individual directories:

- Backend: npm run format, npm run lint, npm run lint:fix
- Frontend: npm run format, npm run format:check
- Web: npm run format

## 🎯 Development Roadmap

- [ ] Implement sophisticated matching algorithm
- [ ] Add comprehensive test coverage
- [ ] Implement push notifications
- [ ] Add real-time messaging
- [ ] Enhanced profile customization

## 👥 The Dream Team
### FA25
- **Arsh Aggarwal** - Product Manager
- **Juju Crane** - Technical Product Manager
- **Clément Rozé** - Designer/Frontend Developer 
- **Brandon Lee** - Designer/Product Marketing Manager
- **Abrar Amin** - Developer

## 📄 License

Private project - Cornell DTI
