# Quick Start - Run on Android

## ✅ Step 1: Install Expo Go on Your Phone
1. Open Google Play Store
2. Search "Expo Go" and install it
3. Make sure phone and computer are on same WiFi

## ✅ Step 2: Dependencies Installed
Dependencies are already installed!

## 🚀 Step 3: Start the App

### Option A: Start and Scan QR Code
```bash
npm start
```
Then:
1. A QR code will appear in terminal/browser
2. Open Expo Go on your phone
3. Tap "Scan QR Code"
4. Scan the QR code
5. App will load!

### Option B: Direct Android Command
```bash
npm run android
```
This will:
- Try to connect to your phone automatically
- Or show QR code if connection fails

## 📱 What to Test

Once app loads:
1. ✅ App shows today's date
2. ✅ Tap "+ Add Exercise" → Add "Bench Press"
3. ✅ Tap "Bench Press" → Opens detail screen
4. ✅ In Track tab: Enter weight (e.g., 100), reps (e.g., 5)
5. ✅ Tap "Save Set" → Set appears
6. ✅ Go to History tab → See your session
7. ✅ Go to Graph tab → See 1RM graph
8. ✅ Tap back → Return to workout
9. ✅ Tap 📅 button → Open calendar
10. ✅ Tap 📊 button → View summary

## 🔄 Reload App
- Shake your phone
- Or press `r` in terminal
- Or tap reload in Expo Go

## 🐛 Troubleshooting

**Phone not connecting?**
- Check same WiFi network
- Try USB debugging: `adb reverse tcp:8081 tcp:8081`

**Port in use?**
```bash
lsof -ti:8081 | xargs kill -9
npm start
```

**Clear cache:**
```bash
npm start -- --clear
```

