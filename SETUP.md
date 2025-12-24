# Setup & Running Guide

## Prerequisites

1. **Node.js** (v18+ recommended) - ✅ You have v22.18.0
2. **npm** - ✅ You have v10.9.3
3. **Expo CLI** (will be installed automatically)
4. **Android Device or Emulator**

## Option 1: Using Physical Android Device (Recommended)

### Step 1: Install Expo Go App
1. On your Android phone, go to Google Play Store
2. Search for "Expo Go" and install it
3. Make sure your phone and computer are on the same WiFi network

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Expo Development Server
```bash
npm start
```

This will:
- Start the Metro bundler
- Open a QR code in your terminal/browser
- Show options to run on Android

### Step 4: Connect Your Phone
**Option A: Scan QR Code**
1. Open Expo Go app on your phone
2. Tap "Scan QR Code"
3. Scan the QR code from terminal/browser
4. App will load on your phone

**Option B: Direct Android Command**
```bash
npm run android
```

This will:
- Try to open on connected Android device/emulator
- Or show QR code if no device found

## Option 2: Using Android Emulator

### Step 1: Install Android Studio
1. Download from https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio → More Actions → SDK Manager
4. Install Android SDK (API 33+ recommended)
5. Go to Tools → Device Manager → Create Virtual Device
6. Choose a device (e.g., Pixel 5) and Android version
7. Start the emulator

### Step 2: Install Expo Go on Emulator
1. In the emulator, open Google Play Store
2. Search and install "Expo Go"

### Step 3: Run the App
```bash
npm install
npm run android
```

The app should automatically open in the emulator.

## Troubleshooting

### "adb not found" or Android device not detected
```bash
# Install Android SDK Platform Tools
# On Linux:
sudo apt-get install android-tools-adb

# Or add Android SDK to PATH:
export PATH=$PATH:$HOME/Android/Sdk/platform-tools
```

### "Expo Go not found" on emulator
- Make sure Expo Go is installed on the emulator
- Restart the emulator

### Network connection issues
- Ensure phone and computer are on same WiFi
- Try using USB debugging:
  ```bash
  adb reverse tcp:8081 tcp:8081
  ```

### Port already in use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
expo start --port 8082
```

## Development Workflow

1. **Start development server:**
   ```bash
   npm start
   ```

2. **Make changes** to any file in `src/`

3. **Reload app:**
   - Shake device/emulator
   - Or press `r` in terminal
   - Or tap reload in Expo Go

4. **View logs:**
   - Press `j` in terminal to open debugger
   - Or check terminal output

## Testing Checklist

Once the app loads, test these features:

- [ ] App loads today's workout automatically
- [ ] Add a new exercise
- [ ] Remove an exercise
- [ ] Tap exercise to open detail screen
- [ ] Add sets with weight/reps/RIR
- [ ] View History tab (should show previous sessions)
- [ ] View Graph tab (should show 1RM estimation)
- [ ] Navigate to Calendar (📅 button)
- [ ] Tap a date in calendar to view that workout
- [ ] View Summary (📊 button)
- [ ] Data persists after closing/reopening app

## Building for Production

When ready to build a standalone APK:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android
```

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android (device/emulator)
npm run android

# Clear cache if issues
npm start -- --clear
```

