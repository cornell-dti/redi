# REDI TPM Onboarding - Complete Codebase Analysis

**Generated:** January 31, 2026
**Repository:** cornell-dti/redi
**Analysis Scope:** Full codebase review for Technical Product Manager handoff

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical First Steps](#2-critical-first-steps)
3. [Complete Access Checklist](#3-complete-access-checklist)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Setup Instructions](#5-setup-instructions)
6. [Architecture Overview](#6-architecture-overview)
7. [Known Issues & Technical Debt](#7-known-issues--technical-debt)
8. [Missing Documentation](#8-missing-documentation)
9. [Recommended Handoff Document Structure](#9-recommended-handoff-document-structure)

---

## 1. Executive Summary

### What is REDI?

REDI is a **mentorship/dating platform for Cornell University students**. It's a full-stack mobile and web application that matches Cornell students weekly based on compatibility scoring, facilitates conversations through in-app messaging, and provides an admin dashboard for managing the platform.

### Technology Stack Overview

| Component | Technology | Version |
|-----------|------------|---------|
| **Mobile App** | React Native + Expo | Expo 53.0, RN 0.79.6, React 19 |
| **Web App/Admin** | Next.js | 15.5.2 with React 19 |
| **Backend API** | Express.js + TypeScript | Express 5.1.0 |
| **Database** | Firebase Firestore | Firebase Admin 13.5.0 |
| **Authentication** | Firebase Auth | Passwordless email links |
| **Cloud Functions** | Firebase Functions | Node 22 |
| **Push Notifications** | Expo Push + FCM | Expo Server SDK 4.0.0 |
| **Hosting** | Heroku (backend), Netlify (web) | - |
| **Mobile Distribution** | EAS Build | iOS App Store, Google Play |

### Repository Structure

```
redi/
├── frontend/          # React Native/Expo mobile app (iOS + Android)
├── backend/           # Express.js REST API + Firebase Cloud Functions
├── redi-web/          # Next.js web app (landing page + admin dashboard)
├── .github/           # CI/CD workflows
└── [config files]     # Procfile, netlify.toml, etc.
```

### Key Numbers

- **51 integration tests** (100% passing)
- **22 API route files** in backend
- **18 service files** handling business logic
- **6 React contexts** managing frontend state
- **8 rate limit categories** for API protection

---

## 2. Critical First Steps

### Ordered Setup Priority

1. **Get GitHub Access**
   - Repository: `cornell-dti/redi`
   - Need collaborator/team member access

2. **Get Firebase Console Access**
   - Project: `redi-1c25e`
   - Request Owner or Editor role
   - Download service account credentials

3. **Get Heroku Access**
   - App: `redi-app-8ea0a6e9c3d9`
   - View environment variables
   - Access logs and metrics

4. **Set Up Local Development**
   - Clone repository
   - Install dependencies (Node 22.x required)
   - Configure environment variables
   - Run backend locally
   - Run frontend in Expo

5. **Get App Store Access**
   - Apple Developer Account (iOS distribution)
   - Google Play Console (Android distribution)
   - App Store Connect for iOS submissions

6. **Understand the Matching Algorithm**
   - Read `backend/MATCHING_ALGORITHM_GUIDE.md`
   - Review `backend/src/services/matchingAlgorithm.ts`

---

## 3. Complete Access Checklist

### Development & Code

| Access | Purpose | Priority |
|--------|---------|----------|
| GitHub (cornell-dti/redi) | Code repository, PRs, issues | **Critical** |
| VS Code / IDE | Development environment | **Critical** |
| Node.js 22.x | Runtime environment | **Critical** |
| npm | Package management | **Critical** |

### Firebase Services

| Access | Purpose | Priority |
|--------|---------|----------|
| Firebase Console (redi-1c25e) | Database, auth, functions | **Critical** |
| Service Account JSON | Backend authentication | **Critical** |
| Firestore Database | Data storage | **Critical** |
| Firebase Authentication | User management | **Critical** |
| Cloud Functions | Scheduled jobs | **Critical** |
| Firebase Storage | Image storage | High |

### Deployment Platforms

| Access | Purpose | Priority |
|--------|---------|----------|
| Heroku Dashboard (redi-app) | Backend deployment | **Critical** |
| Heroku Redis addon | Rate limiting | High |
| Netlify (redi-web) | Web app deployment | High |
| EAS (Expo) | Mobile builds | **Critical** |

### App Stores

| Access | Purpose | Priority |
|--------|---------|----------|
| Apple Developer Account | iOS distribution | **Critical** |
| App Store Connect | iOS app management | **Critical** |
| Google Play Console | Android distribution | **Critical** |
| Firebase App Distribution | Internal testing | Medium |

### Communication & Email

| Access | Purpose | Priority |
|--------|---------|----------|
| Gmail (redicornell@gmail.com) | Transactional emails | **Critical** |
| Gmail App Password | Nodemailer auth | **Critical** |

### Optional/Analytics

| Access | Purpose | Priority |
|--------|---------|----------|
| Firebase Analytics | Usage tracking | Medium |
| Expo Push Dashboard | Notification monitoring | Medium |
| Domain registrar (redi.love) | DNS management | Low |

---

## 4. Environment Variables Reference

### Backend Environment Variables

Create `/backend/.env`:

```env
# Firebase Admin SDK (REQUIRED)
FIREBASE_PROJECT_ID=redi-1c25e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@redi-1c25e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Configuration (REQUIRED)
ADMIN_UID=<firebase-uid-of-admin-user>

# Email Service (REQUIRED for sign-in)
EMAIL_USER=redicornell@gmail.com
EMAIL_PASSWORD=<gmail-app-specific-password>

# Web Configuration
WEB_REDIRECT_URL=https://redi.love

# Server Configuration (OPTIONAL)
PORT=3001
NODE_ENV=development

# Redis (OPTIONAL - for distributed rate limiting)
REDIS_URL=<redis-connection-string>

# Push Notifications (OPTIONAL - for Expo push)
EXPO_ACCESS_TOKEN=<expo-access-token>
```

### Frontend Environment Variables

Create `/frontend/.env` (development):
```env
REACT_APP_API_BASE_URL=http://localhost:3001
```

Create `/frontend/.env.production`:
```env
REACT_APP_API_BASE_URL=https://redi-app-8ea0a6e9c3d9.herokuapp.com
```

### Web App Environment Variables

Create `/redi-web/.env`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_UID=<same-as-backend-ADMIN_UID>
```

Create `/redi-web/.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://redi-app-8ea0a6e9c3d9.herokuapp.com
NEXT_PUBLIC_ADMIN_UID=<same-as-backend-ADMIN_UID>
```

### Where to Get Secrets

| Variable | Source |
|----------|--------|
| `FIREBASE_*` credentials | Firebase Console > Project Settings > Service Accounts > Generate new private key |
| `ADMIN_UID` | Firebase Console > Authentication > Find admin user > Copy UID |
| `EMAIL_PASSWORD` | Google Account > Security > App Passwords > Generate for "Mail" |
| `REDIS_URL` | Heroku Dashboard > redi-app > Resources > Heroku Redis > View Credentials |
| `EXPO_ACCESS_TOKEN` | Expo Dashboard > Account Settings > Access Tokens |

---

## 5. Setup Instructions

### Prerequisites

- **Node.js**: 22.x (use nvm: `nvm install 22 && nvm use 22`)
- **npm**: Comes with Node.js
- **Git**: For cloning repository
- **Xcode**: For iOS development (Mac only)
- **Android Studio**: For Android development (optional)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Firebase CLI**: `npm install -g firebase-tools`

### Step-by-Step Setup

#### 1. Clone and Install

```bash
# Clone repository
git clone git@github.com:cornell-dti/redi.git
cd redi

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install web dependencies
cd redi-web && npm install && cd ..
```

#### 2. Configure Backend

```bash
cd backend

# Create .env file (see Environment Variables section above)
cp .env.example .env  # If exists, otherwise create manually

# Build TypeScript
npm run build

# Start development server
npm run dev
```

Backend should be running at `http://localhost:3001`. Test with:
```bash
curl http://localhost:3001/ping
# Should return: {"message":"pong","timestamp":"..."}
```

#### 3. Configure Frontend (Expo)

```bash
cd frontend

# Create .env file
echo "REACT_APP_API_BASE_URL=http://localhost:3001" > .env

# Start Expo
npm start
```

Options:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

#### 4. Configure Web App

```bash
cd redi-web

# Create .env file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3001" > .env

# Start development server
npm run dev
```

Web app runs at `http://localhost:3000`

### iOS-Specific Setup

```bash
cd frontend/ios

# Install CocoaPods dependencies
pod install

# Open in Xcode
open redi.xcworkspace
```

Requirements:
- Xcode 15+ (macOS only)
- iOS Simulator or physical device
- Apple Developer account for device testing

### Android-Specific Setup

```bash
cd frontend/android

# Ensure Android SDK is configured
# Open in Android Studio or run:
./gradlew assembleDebug
```

Requirements:
- Android Studio with SDK
- Android Emulator or physical device (USB debugging enabled)

---

## 6. Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REDI PLATFORM                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│  MOBILE APP      │  │    WEB APP       │  │     BACKEND API          │
│  (React Native)  │  │   (Next.js)      │  │    (Express.js)          │
│                  │  │                  │  │                          │
│  - iOS           │  │  - Landing Page  │  │  - REST Endpoints        │
│  - Android       │  │  - Admin Panel   │  │  - Authentication        │
│  - Expo          │  │  - Analytics     │  │  - Rate Limiting         │
└────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘
         │                     │                         │
         │    HTTPS/REST       │                         │
         └─────────────────────┼─────────────────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         │                                           │
         ▼                                           ▼
┌─────────────────────────┐            ┌─────────────────────────┐
│   FIREBASE SERVICES     │            │   CLOUD FUNCTIONS       │
│                         │            │                         │
│  - Firestore (DB)       │            │  - activateWeeklyPrompt │
│  - Authentication       │            │    (Mon 12:01 AM ET)    │
│  - Storage (Images)     │            │                         │
│                         │            │  - generateWeeklyMatches│
└─────────────────────────┘            │    (Fri 9:01 AM ET)     │
                                       └─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│                                                                      │
│  - Heroku (Backend Hosting)     - Expo Push (Notifications)         │
│  - Netlify (Web Hosting)        - Gmail SMTP (Email)                │
│  - Redis (Rate Limiting)        - Google Sign-In (OAuth)            │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Schema (Firestore Collections)

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User accounts | netid, email, firebaseUid, pushToken |
| `profiles` | User profiles | netid, firstName, bio, gender, pictures, clubs, interests |
| `preferences` | Match preferences | ageRange, genders, years, schools, majors |
| `weeklyPrompts` | Weekly questions | question, releaseDate, active, status |
| `weeklyPromptAnswers` | User answers | netid, promptId, answer |
| `weeklyMatches` | Generated matches | netid, promptId, matches[], revealed[] |
| `nudges` | Like/nudge system | fromNetid, toNetid, mutual |
| `conversations` | Chat threads | participantIds, messages (subcollection) |
| `notifications` | In-app notifications | netid, type, title, body, read |
| `blockedUsers` | Block relationships | blockerNetid, blockedNetid |
| `reports` | User reports | reporterNetid, reportedNetid, status |
| `admins` | Admin users | email, disabled |
| `adminAuditLogs` | Audit trail | action, adminUid, timestamp |

### Matching Algorithm Overview

**Location:** `backend/src/services/matchingAlgorithm.ts`

**Scoring Factors (0-100 points):**
- School match: 20 points
- Major overlap: 15 points
- Year proximity: 15 points
- Age proximity: 15 points
- Interest overlap: 20 points
- Club overlap: 15 points

**Process:**
1. Get all users who answered this week's prompt
2. For each user, find compatible candidates (mutual preference matching)
3. Score each candidate pair
4. Filter out blocked users and previous matches
5. Return top 3 matches per user

**Schedule:**
- Monday 12:01 AM ET: Activate weekly prompt
- Friday 9:01 AM ET: Generate matches for all users

### Authentication Flow

```
1. User enters Cornell email (@cornell.edu required)
2. Backend sends passwordless sign-in link via Firebase
3. User clicks link in email
4. Link deep-links to mobile app or web
5. App exchanges link for Firebase ID token
6. Token sent as Bearer header on all API requests
7. Backend verifies token with Firebase Admin SDK
8. Admin users have additional `admin: true` custom claim
```

### API Endpoints Overview

| Prefix | Purpose | Auth Required |
|--------|---------|---------------|
| `/api/auth` | Sign-in link generation | No (rate limited) |
| `/api/users` | User CRUD | Yes |
| `/api/profiles` | Profile management | Yes |
| `/api/preferences` | Match preferences | Yes |
| `/api/prompts` | Weekly prompts & answers | Yes |
| `/api/images` | Image upload | Yes |
| `/api/nudges` | Like/nudge system | Yes |
| `/api/chat` | Messaging | Yes |
| `/api/notifications` | In-app notifications | Yes |
| `/api/reports` | User reporting | Yes |
| `/api/admin/*` | Admin operations | Admin only |

---

## 7. Known Issues & Technical Debt

### Critical Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Password update not implemented | `frontend/app/(auth)/edit-password.tsx:47` | Users cannot change passwords |
| Preference filters missing in matching | `backend/src/routes/profiles.ts:661-666` | Matching ignores some preferences |
| Extensive `as any` type assertions | Throughout frontend | Type safety compromised |

### High Priority

| Issue | Location | Impact |
|-------|----------|--------|
| Deprecated dependencies | `glob`, `inflight`, `rimraf` | Security/stability risk |
| In-memory rate limiting fallback | When Redis unavailable | Won't work across dynos |
| Hardcoded Firebase config | `frontend/firebase.ts`, `redi-web/firebase.ts` | Should use env vars |
| Image cleanup on profile delete | `backend/src/routes/profiles.ts:609` | Storage bloat |

### Medium Priority

| Issue | Location | Impact |
|-------|----------|--------|
| Deprecated type definitions | `redi-web/src/types/admin.ts` | Code confusion |
| Deprecated `calculateAge()` | `frontend/app/utils/profileUtils.ts:8` | Should use `getProfileAge()` |
| Debug logging in production | `redi-web/src/api/api.ts:29` | Information leak |
| ImageManipulator API may be deprecated | `PhotoUploadGrid.tsx:164` | Future breakage |

### TODO Comments Found

1. `frontend/app/(auth)/edit-password.tsx:47` - Implement password update logic
2. `backend/src/routes/profiles.ts:609` - Delete associated images from storage
3. `backend/src/routes/profiles.ts:661-666` - Apply preference-based filtering
4. `frontend/README_NAVIGATION.md:51-72` - Backend integration, enhanced features

### Skipped Tests

- `frontend/app/api/__tests__/apiClient.test.ts:290` - "should throw error when user not authenticated"

---

## 8. Missing Documentation

### Documentation That Should Exist

| Document | Purpose | Priority |
|----------|---------|----------|
| `.env.example` files | Template for environment setup | **Critical** |
| `DEPLOYMENT.md` | Step-by-step deployment guide | **Critical** |
| `CONTRIBUTING.md` | Contribution guidelines | High |
| `ARCHITECTURE.md` | System design overview | High |
| `DATABASE_SCHEMA.md` | Detailed Firestore schema | High |
| `SECURITY.md` | Security practices | Medium |
| `TROUBLESHOOTING.md` | Common issues and fixes | Medium |

### Existing Documentation (Good Coverage)

| Document | Location | Quality |
|----------|----------|---------|
| API Documentation | `/API_DOCUMENTATION.md` | Excellent |
| Matching Algorithm Guide | `/backend/MATCHING_ALGORITHM_GUIDE.md` | Excellent |
| Testing Guide | `/backend/TESTING_GUIDE.md` | Excellent |
| Rate Limiting Guide | `/backend/RATE_LIMITING_GUIDE.md` | Very Good |
| Testing README | `/backend/TESTING_README.md` | Very Good |
| Cloud Functions Testing | `/TESTING_CLOUD_FUNCTIONS.md` | Good |
| Main README | `/README.md` | Good |

---

## 9. Recommended Handoff Document Structure

### Final TPM Handoff Document Outline

```markdown
# REDI Platform - TPM Handoff Document

## Part 1: Getting Started (Week 1)
1.1 Access Checklist (with confirmation checkboxes)
1.2 Local Development Setup
1.3 Understanding the Codebase
1.4 Key Contacts and Resources

## Part 2: Platform Overview
2.1 What is REDI?
2.2 User Journey (with screenshots)
2.3 Admin Dashboard Overview
2.4 Weekly Matching Cycle

## Part 3: Technical Architecture
3.1 System Architecture Diagram
3.2 Technology Stack Details
3.3 Database Schema
3.4 API Reference
3.5 Authentication Flow
3.6 Matching Algorithm Explanation

## Part 4: Development Workflow
4.1 Git Branching Strategy
4.2 Pull Request Process
4.3 Code Review Guidelines
4.4 Testing Requirements
4.5 CI/CD Pipeline

## Part 5: Deployment Guide
5.1 Backend Deployment (Heroku)
5.2 Web App Deployment (Netlify)
5.3 Mobile App Builds (EAS)
5.4 App Store Submissions
5.5 Cloud Functions Deployment
5.6 Rollback Procedures

## Part 6: Operations
6.1 Monitoring and Alerts
6.2 Common Issues and Troubleshooting
6.3 Weekly Maintenance Tasks
6.4 User Support Procedures
6.5 Admin Operations

## Part 7: Known Issues & Roadmap
7.1 Current Technical Debt
7.2 Planned Features
7.3 Performance Considerations
7.4 Security Considerations

## Appendices
A. Environment Variables Reference
B. Firebase Collections Reference
C. API Endpoints Reference
D. Emergency Contacts
E. Glossary of Terms
```

---

## Appendix A: Key File Locations Quick Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `/Procfile` | Heroku web process |
| `/netlify.toml` | Netlify deployment config |
| `/frontend/app.config.js` | Expo app configuration |
| `/frontend/eas.json` | EAS build profiles |
| `/backend/firebase.json` | Firebase project config |
| `/backend/firestore.rules` | Database security rules |
| `/backend/firestore.indexes.json` | Database indexes |

### Core Business Logic

| File | Purpose |
|------|---------|
| `/backend/src/services/matchingAlgorithm.ts` | Matching algorithm |
| `/backend/src/services/matchingService.ts` | Match generation service |
| `/backend/src/services/pushNotificationService.ts` | Push notifications |
| `/backend/src/services/emailService.ts` | Email sending |
| `/backend/src/middleware/auth.ts` | Authentication |
| `/backend/src/middleware/rateLimiting.ts` | Rate limiting |

### Frontend Entry Points

| File | Purpose |
|------|---------|
| `/frontend/app/_layout.tsx` | Root layout with providers |
| `/frontend/app/index.tsx` | Welcome/login screen |
| `/frontend/app/(auth)/(tabs)/_layout.tsx` | Main tab navigation |
| `/frontend/firebase.ts` | Firebase initialization |

### Cloud Functions

| File | Purpose |
|------|---------|
| `/backend/functions/src/index.ts` | Function definitions |
| `/backend/functions/src/services/` | Shared services (copied from backend) |

---

## Appendix B: Useful Commands

### Development

```bash
# Start all services
cd backend && npm run dev        # Backend on :3001
cd frontend && npm start         # Expo dev server
cd redi-web && npm run dev       # Web on :3000

# Run tests
cd backend && npm run test:integration  # Integration tests
cd backend && npm test                   # Unit tests
cd frontend && npm test                  # Frontend tests

# Linting and formatting
npm run format                   # Format entire repo
npm run lint                     # Lint entire repo
```

### Deployment

```bash
# Backend (Heroku)
git push heroku main

# Web (Netlify)
# Auto-deploys from main branch

# Mobile (EAS)
cd frontend
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android

# Cloud Functions
cd backend/functions
npm run build
npm run deploy
```

### Firebase

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# View function logs
firebase functions:log
```

---

*This analysis was generated by examining the complete REDI codebase. For questions or clarifications, consult the existing documentation in the repository or reach out to the development team.*
