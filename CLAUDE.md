# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React Native mobile application** (version 0.77.2) for worker management with biometric features. The app includes attendance tracking, messaging, task management, worker profiles, and integrates with ML Kit for face detection. It supports offline synchronization, push notifications, and internationalization (English/Spanish).

## Development Commands

### Core Commands
```bash
# Start the Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator/device
npm run android

# Lint code with ESLint
npm run lint

# Run tests with Jest
npm test
```

### Build & Deployment
```bash
# Generate release APK for Android
npm run generate-apk

# Generate debug APK for Android
npm run debug-apk

# Install iOS dependencies
npm run pod

# Clean Android build
npm run clean

# Run release variant on Android
npm run android-release
```

### Prettier Configuration
The project uses Prettier with these settings:
- Single quotes: `true`
- Trailing commas: `all`
- Arrow parens: `avoid`
- Bracket same line: `true`
- Bracket spacing: `false`

## Architecture Overview

### State Management
The app uses **Redux Toolkit** for state management with the following key slices:
- `authSlice` - Authentication state (user data, login status, remember me)
- `Theme` - Theme management (dark/light mode, button colors)
- `MessageCountSlice` - Message count tracking
- `rememberMeSlice` - Saved account management

### Navigation Structure
The app uses **React Navigation** with a nested navigation structure:
- **Auth Stack** (`src/navigations/AuthStack.js`) - Login/signup screens
- **Bottom Tab Bar** (`src/navigations/BottomTabBar.js`) - Main app tabs
- **Main Stack** (`src/navigations/MainStack.js`) - Stack navigation within tabs

Main bottom tabs include:
- Home (`src/Screens/BottomTabs/Home.js`)
- Messages (`src/Screens/BottomTabs/Messages.js`)
- Attendance (`src/Screens/BottomTabs/Attendence/`)
- Tasks (`src/Screens/BottomTabs/Tasks/`)
- Worker (`src/Screens/BottomTabs/Worker.js`)
- Menu (`src/Screens/BottomTabs/Menu.js`)

### Key Features & Integrations

#### Offline Synchronization
Robust offline-first architecture with multiple sync managers:
- `OfflineSyncManager` (`src/services/OfflineSyncManager.js`) - Master sync coordinator
- `MessageSyncService` (`src/services/MessageSyncService.js`) - Message sync
- `ProfileSyncService` (`src/services/ProfileSyncService.js`) - Profile sync
- Queue-based offline operations for messages, expenses, leave requests, and documents

#### Firebase Integration
- **Firebase App** - Core Firebase initialization
- **Firebase Messaging** - Push notifications
- **NotificationService** (`src/utils/NotificationService.js`) - Handles FCM

#### Biometric Features
- **ML Kit Face Detection** (`@react-native-ml-kit/face-detection`) - Face recognition
- **React Native Vision Camera** - Camera functionality

#### Internationalization
- **i18next** with **react-i18next** for translations
- Supported languages: English (`en.json`), Spanish (`es.json`)
- Language auto-detection using device locale
- Configuration in `src/Translations/i18n.js`

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── BottomSheets/    # Bottom sheet components
│   ├── Buttons/         # Custom button components
│   ├── Cards/           # Card components
│   ├── Charts/          # Chart components
│   ├── Header/          # Header components
│   └── ...              # Other UI components
├── Screens/             # Screen components
│   ├── BottomTabs/      # Bottom tab screens
│   ├── auth/            # Authentication screens
│   └── ...              # Other screens
├── navigations/         # Navigation configuration
│   ├── AuthStack.js     # Auth flow
│   ├── BottomTabBar.js  # Bottom tabs
│   ├── MainStack.js     # Main stack
│   └── router.js        # Root router
├── redux/               # Redux store and slices
│   ├── Slices/          # Redux slices
│   ├── Store/           # Store configuration
│   └── middleware/      # Custom middleware
├── services/            # Business logic and API services
│   ├── MessageSyncService.js
│   ├── ProfileSyncService.js
│   ├── OfflineSyncManager.js
│   └── ...              # Other services
├── utils/               # Utility functions
│   ├── LanguageInitializer.js
│   ├── NotificationService.js
│   ├── reduxStorage.js  # Redux persistence
│   └── ...              # Other utilities
├── Providers/           # Context providers
│   └── AlertContext.js  # Global alert system
├── Translations/        # i18n translations
│   ├── en.json          # English translations
│   ├── es.json          # Spanish translations
│   └── i18n.js          # i18n configuration
├── Constants/           # App constants
├── hooks/               # Custom React hooks
└── assets/              # Static assets
```

## Testing

- **Test Framework**: Jest (configured in `jest.config.js`)
- **Test Location**: `__tests__/` directory
- **Preset**: `react-native`
- Run tests: `npm test`

## Build Configuration

### Metro Bundler (`metro.config.js`)
- SVG transformer configured
- Custom asset extensions
- Watchman disabled

### React Native Config (`react-native.config.js`)
- Fonts assets: `./assets/fonts/`
- Custom configuration for `react-native-screens`

### TypeScript
- TypeScript config in `tsconfig.json`
- Uses `@react-native/typescript-config`

## Key Services & Managers

1. **OfflineSyncManager** - Coordinates all offline operations
2. **SyncStatusBarManager** - Shows sync status to users
3. **NotificationService** - Handles FCM and local notifications
4. **LanguageInitializer** - Sets up i18n on app start
5. **DebugQueueButton** - Debug tool for viewing offline queue

## Important Implementation Notes

- The app uses **AsyncStorage** for Redux state persistence
- Redux state is rehydrated in `App.js` on app startup
- Custom alert system via `AlertContext` and `DynamicAlert` component
- Theme system supports dark/light mode
- Face detection requires camera permissions
- Offline queues use SQLite storage (`react-native-sqlite-storage`)

## Dependencies

Key dependencies include:
- React Native 0.77.2
- Redux Toolkit (@reduxjs/toolkit)
- React Navigation (navigation)
- Firebase (app, messaging)
- React Native Vision Camera
- React Native ML Kit Face Detection
- i18next (internationalization)
- Socket.io Client (real-time messaging)
- React Native Maps
- And many UI and utility libraries
