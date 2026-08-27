@echo off
echo Starting D-Journal (backend + frontend)...
start "D-Journal Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "D-Journal Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo  Backend:  http://localhost:4000/health
echo  Frontend: http://localhost:5173
echo.
pause
