@echo off
echo [LocalGem] Creating assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo [LocalGem] Bundling JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res

echo.
echo [LocalGem] Done! Now go to Android Studio and Build APK.
pause
