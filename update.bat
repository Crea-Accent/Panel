@echo off
echo [1/4] Fetching latest changes from Git...
git pull

echo [2/4] Cleaning lockfiles & Syncing PNPM dependencies...
if exist package-lock.json del /f /q package-lock.json
call pnpm install --frozen-lockfile

echo [3/4] Compiling fresh production build with Turbopack...
call pnpm run build

echo [4/4] Update complete! Bouncing Windows Service...
:: 🔑 The text "Update complete" will now trigger your React component's window.location.reload()
:: right before the 2-second timeout finishes and NSSM recycles the engine!
start /b "" cmd /c "timeout /t 2 && nssm restart CreaPanel"
exit