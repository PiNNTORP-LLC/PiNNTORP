@echo off

start "" "http://localhost:8080/"

echo Running the friends test suite...

node --test tests\friends.test.js

echo Running the stats test suite...

node --test tests\stats.test.js

echo Running the account deletion test suite...
node --test tests\accountDeletion.test.js

echo.
pause
