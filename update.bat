@echo off
echo [1/4] Fetching latest changes from Git...
git pull

echo [2/4] Syncing package dependencies...
:: Clear npm cache to get rid of that "Cannot read properties of null" bug
call pnpm cache clean --force 
call pnpm install

echo [3/4] Compiling fresh production build...
call pnpm run build

echo [4/4] Bouncing Windows Service...
:: 🔑 The Secret Sauce: Starts a new, completely separate CMD process to restart the service,
:: allowing this active batch file to exit cleanly first without catching a ^C crash!
start /b "" cmd /c "timeout /t 2 && sudo nssm restart CreaPanel"
exit