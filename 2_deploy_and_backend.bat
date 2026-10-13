@echo off
title 2 - Deploy Contract ^& Start Backend
echo ========================================================
echo   Deploying Smart Contract and Starting Express Backend
echo ========================================================
echo.
echo Step 1: Deploying smart contract to local node...
call npx hardhat run scripts/deploy.js --network localhost
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Could not deploy contract. Make sure 1_start_blockchain.bat is running!
    pause
    exit /b %errorlevel%
)
echo.
echo Step 2: Starting Express backend API server on port 5000...
node backend/server.js
pause
