# Mobile App Setup Guide with Screen Protection

This app has been configured with Capacitor for native mobile development with **screenshot/screen recording protection**.

## Security Features Enabled

- ✅ **Screenshot blocking** - Users cannot take screenshots
- ✅ **Screen recording blocking** - Screen recording apps will capture black screen
- ✅ **Screen sharing prevention** - Cannot share screen while app is open
- ✅ **App switcher protection** - Content is blurred in recent apps view

## Setup Instructions

### 1. Export and Clone the Project

1. Click "Export to Github" button in Lovable
2. Clone the repository to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Native Platforms

```bash
# Add Android
npx cap add android

# Add iOS (Mac only)
npx cap add ios
```

### 4. Copy Native Security Code

After adding platforms, you need to copy the security code:

#### For Android:
Replace `android/app/src/main/java/.../MainActivity.java` content with the code from `android/app/src/main/java/app/lovable/MainActivity.java` in this repo.

Or simply add this to your MainActivity:
```java
import android.view.WindowManager;

// In onCreate method:
getWindow().setFlags(
    WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE
);
```

#### For iOS:
Copy `ios/App/App/ScreenProtection.swift` to your iOS project and update `AppDelegate.swift` with the provided code.

### 5. Build and Sync

```bash
npm run build
npx cap sync
```

### 6. Run the App

```bash
# Android
npx cap run android

# iOS (Mac with Xcode required)
npx cap run ios
```

## Requirements

- **Android**: Android Studio installed
- **iOS**: Mac with Xcode installed

## Important Notes

- The `FLAG_SECURE` on Android is the strongest protection available and cannot be bypassed by normal means
- iOS uses a combination of secure text field technique and screen capture detection
- These protections work on physical devices; emulators may behave differently for testing

## Hot Reload (Development)

The app is configured to connect to the Lovable preview URL for hot reload during development. For production, remove the `server` config from `capacitor.config.ts`.
