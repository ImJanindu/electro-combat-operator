# Electro Combat Operator

**Electro Combat Operator** is a high-tech, offline-capable desktop match management system designed specifically for robotic combat tournaments. It features a sophisticated dual-dashboard architecture that empowers tournament operators to control match timers, track scores, and resolve knockouts with precision, while seamlessly broadcasting real-time, synchronized match data to a visually stunning Audience Display.

## 🎓 Event Details
This application was developed for the **Electro Combat** robotics tournament, an electrifying event proudly organized and hosted by the **Mechatronics Technology Students' Society** at the Faculty of Technology, **University of Sri Jayewardenepura**.

## ⚙️ Working Mechanism & Features
Electro Combat Operator utilizes an Electron-based multi-window IPC (Inter-Process Communication) architecture tailored for live event reliability:
- **Operator Dashboard:** A secure, neon-styled control panel utilized by the referee or tournament operator. It features strict safety locks, including custom PIN validation for destructive actions (like data wiping) and an OS-level anti-close lock that prevents the app from being force-closed during an active match.

- **Audience Display:** A synchronized, HUD-style interface optimized for large screens and projectors. It provides the live audience with high-fidelity, real-time views of the match timer, competing teams, and critical match events (like Knockouts and Recoveries).

### 🎮 Core Controls
- **Match Timer**: Start, Pause, Resume, and dynamically adjust match time (+/- 10s) on the fly.

- **Knockout System**: Trigger an authoritative 10-second knockout countdown for robotic incapacitation. Can be interrupted and recovered if the robot regains mobility.

- **Emergency Stop**: Instantly halt the match and freeze the timer in the event of arena hazards or rule violations.

- **Match Resolution**: Officially resolve matches by assigning wins or draws, which automatically updates the tournament Leaderboard.

- **Secure Data Management**: Includes a 2-step PIN verification flow for wiping tournament history, complete with a JSON data export tool for safe backups.

## 🛠️ Tech Stack
Built with cutting-edge web technologies and securely packaged into a standalone Windows `.exe`:
- **Core Framework**: React 19 & Next.js 16 (App Router).

- **Desktop Environment**: Electron & Electron-Builder (NSIS Installer).

- **Styling**: Tailwind CSS v4 & custom Neon UI CSS architecture.

- **State Management**: Custom React Hooks & LocalStorage data persistence, synchronized across desktop windows via Electron IPC.

## 👨‍💻 Developer
Architected and developed by **[Janindu Malshan](https://linkedin.com/in/imjanindu)**.
