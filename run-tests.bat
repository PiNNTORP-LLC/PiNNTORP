@echo off

echo ========================================
echo PiNNTORP Automated Tests
echo ========================================
echo.

echo [UNIT] Friends and User State
echo ----------------------------------------
node --test tests\friends.test.js
echo.

echo [UNIT] Game Stat Calculations
echo ----------------------------------------
node --test tests\games.test.js
echo.

echo [UNIT] Recommendations
echo ----------------------------------------
node --test tests\rec.test.js
echo.

echo [UNIT] Statistics
echo ----------------------------------------
node --test tests\stats.test.js
echo.

echo [UNIT] Storage
echo ----------------------------------------
node --test tests\storage.test.js
echo.

echo [UNIT] Remaining Documented Unit Coverage
echo ----------------------------------------
node --test tests\unitCoverage.test.js
echo.

echo [INTEGRATION] Documented Integration Coverage
echo ----------------------------------------
node --test tests\integrationCoverage.test.js
echo.

echo [BACKEND] Documented Java and Auth Coverage
echo ----------------------------------------
node --test tests\backendCoverage.test.js
echo.

echo [SYSTEM] Documented System Coverage
echo ----------------------------------------
node --test tests\systemCoverage.test.js

echo.
echo [TODO] Account Deletion Coverage
echo ----------------------------------------
node --test tests\accountDeletion.test.js

echo.
pause
