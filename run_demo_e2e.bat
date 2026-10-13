@echo off
title 7-Step Demonstration Automated Verifier
echo ========================================================
echo   Running Complete 7-Step Scenario Verification
echo ========================================================
echo.
npx hardhat run scripts/verify_e2e_demo.js
pause
