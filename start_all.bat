@echo off
echo ========================================================
echo   Launching Full Blockchain Land Record System
echo ========================================================
echo.
echo Launching Terminal 1: Hardhat Node...
start "1 - Hardhat Blockchain" cmd /c "1_start_blockchain.bat"

echo Waiting 4 seconds for local node to initialize...
timeout /t 4 /nobreak >nul

echo Launching Terminal 2: Deploy & Express Backend...
start "2 - Deploy & Backend" cmd /c "2_deploy_and_backend.bat"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Launching Terminal 3: React Frontend...
start "3 - React Frontend" cmd /c "3_start_frontend.bat"

echo.
echo ========================================================
echo   All 3 services launched in separate windows!
echo   Open your browser at: http://localhost:3000
echo ========================================================
pause
