# PiNNTORP

> A vanilla JavaScript web application built for CSCI 2040U.

---

## Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

---

## Team

| Name | Role |
|------|------|
| Eric Beaulne | Project Manager |
| Mele Felix | Technical Manager |
| Adrian Ahmadi | Front-End Lead |
| Nikola Grujin | Back-End Lead |
| Hayden Dunn | Software Quality Lead |


---

## Iteration Plan

| Iteration | Duration | Goals |
|-----------|----------|-------|
| 1 | 2 weeks | Core game mechanics, friends list, statistics display |
| 2 | 2 weeks | Recommendation algorithm |
| 3 | 2 weeks | Account deletion |

**Team size:** 5 members | **Velocity:** 0.5

---

## Git Workflow

```
feature/*  →  develop  →  (team test)  →  main
```

| Branch | Purpose |
|--------|---------|
| `main` | Stable demo only |
| `develop` | Integration branch |
| `feature/*` | Individual contributor branches |

---

## Getting Started

**Option 1 - Double-click:**
```
start-server.bat
```

**Option 2 - Terminal:**
```powershell
python -m http.server 5500
```

Then open [http://localhost:5500](http://localhost:5500) in your browser.

---

## Running Tests

```powershell
npm test
```

Current coverage: `friends.js` and `stats.js` modules.
