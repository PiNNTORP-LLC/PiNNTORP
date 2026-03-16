# PiNNTORP

PiNNTORP is a vanilla JavaScript web app (HTML/CSS/JS).

## Team and Roles
- Eric Beaulne - Project Manager
- Mele Felix - Technical Manager
- Adrian Ahmadi - Front-End Lead
- Nikola Grujin - Back-End Lead
- Hayden Dunn - Software Quality Lead

Current contribution note: Hayden completed the initial repository/project setup and baseline wiring for Iteration 1.

## Iteration Plan
- Iteration 1: core game mechanics, friends list, statistics display
- Iteration 2: recommendation algorithm
- Iteration 3: account deletion

**Team size:** 5 members  
**Iterations**: 3 iterations, each 2 weeks  
**Team velocity**: 0.5

## Git Workflow
- `main`: stable demo only
- `develop`: integration branch
- `feature/*`: individual contributor branches

Flow: `feature/*` -> `develop` -> team test -> `main`

## Run
Double-click `start-server.bat`, or run:

```powershell
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Test
Run the unit tests with:

```powershell
npm test
```

The current unit test suite covers the `friends.js` and `stats.js` modules.
