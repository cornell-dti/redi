# REDI Frontend - Navigation Structure

## Folder Structure

```
app/
├── _layout.tsx                 # Root layout with auth flow
├── index.tsx                   # Welcome/Login screen
├── (auth)/                     # Authenticated users only
│   ├── _layout.tsx            # Auth stack layout
│   ├── home.tsx               # Redirects to tabs (profile check logic)
│   ├── create-profile.tsx     # Multi-step profile creation
│   └── (tabs)/                # Main app tabs
│       ├── _layout.tsx        # Tab bar configuration
│       ├── index.tsx          # Matches screen (default)
│       ├── chat.tsx           # Chat list screen
│       ├── notifications.tsx  # Notifications screen
│       └── profile.tsx        # User profile screen
├── screens/
│   └── chat-detail.tsx        # Individual chat conversation
├── components/
│   ├── TabBarIcon.tsx         # Reusable tab icon component
│   ├── AppButton.tsx          # Styled button component
│   └── AppColors.ts           # Color theme constants
└── types/
    └── navigation.ts          # TypeScript type definitions
```

## Navigation Flow

### Authentication Flow

```
index.tsx (Welcome/Login)
    ↓ (Firebase auth)
(auth)/home.tsx (Profile Check)
    ├─ → create-profile.tsx (if new user)
    └─ → (tabs)/ (if existing user)
```

### Main App Flow

```
(tabs)/ - Bottom Tab Navigation:
├── index.tsx (Matches) - Default tab
├── chat.tsx (Chat List) → chat-detail.tsx
├── notifications.tsx (Notifications)
└── profile.tsx (User Profile)
```

## Design System (TEMPORARY)

### Colors (AppColors.ts)

- **Primary**: `#FF6B6B` (Dating app red)
- **Secondary**: `#4CAF50` (Green for success)
- **Background**: `#F8F9FA` (Light gray)
- **Text**: `#333333` (Dark gray)

### Components

- **AppButton**: Consistent button styling (primary/secondary/outline variants)
- **TabBarIcon**: Unified icon component for tabs
- **Consistent spacing**: 8px, 12px, 16px, 20px grid

## TODO Items

1. **Backend Integration**
   - Connect to profile API endpoints
   - Implement real-time messaging
   - Add image upload functionality

2. **Profile Completion Logic**
   - Check if user has completed profile in `home.tsx`
   - Redirect new users to `create-profile.tsx`

3. **Enhanced Features**
   - Push notifications setup
   - Real-time chat functionality
   - Advanced matching algorithm
   - Photo validation and moderation

4. **Performance Optimization**
   - Image caching and lazy loading
   - Infinite scroll for matches
   - Message pagination
   - Background app state handling

## Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```
