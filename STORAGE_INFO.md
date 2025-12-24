# Data Storage Information

## ✅ Data Storage Location

**Your workout data is stored directly in your device's internal storage** using React Native's AsyncStorage.

### Technical Details:
- **Storage Type**: AsyncStorage (uses Android's SharedPreferences internally)
- **Location**: Device internal storage (private app directory)
- **Format**: JSON data stored with stable keys: `workout:YYYY-MM-DD`
- **Persistence**: Data persists across app restarts and device reboots
- **Offline**: 100% offline - no network required

### Data Safety Features:
✅ All read/write operations wrapped in try/catch  
✅ Data merged before saving (never overwrites unrelated days)  
✅ Input validation prevents crashes  
✅ Graceful error handling  
✅ Stable keys prevent data loss  

## Backup & Restore

### Export Backup:
1. Go to Settings (⚙️ button)
2. Tap "📤 Export Backup"
3. Share the JSON file to Google Drive or save it elsewhere

### Restore Backup:
1. Go to Settings (⚙️ button)
2. Tap "📥 Restore Backup"
3. Select your backup JSON file
4. Confirm restore (data will be merged with existing)

### Backup File Format:
- **Format**: JSON
- **Filename**: `gym-logger-backup-YYYY-MM-DD-HH-MM.json`
- **Contains**: All workouts with exercises and sets
- **Safe**: Restore validates data before applying

## Important Notes:

⚠️ **Backup Regularly**: While data is safe on your device, always export backups before major updates or device changes.

✅ **Data Never Deleted**: Failed restores never delete your existing data.

✅ **Merge Behavior**: Restoring a backup merges with existing data (same dates get updated, new dates get added).

