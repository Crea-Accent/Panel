<!-- @format -->

# Crea-Accent Panel

pm2 start "C:\Users\Ray\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe" --name cloudflared -- tunnel run panel

pm2 start node_modules/next/dist/bin/next --name panel -- start -p 3000
