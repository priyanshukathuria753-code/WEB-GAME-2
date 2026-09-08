# ESCAPE RUN — 3D Police Chase Endless Runner

> *"ONE ROAD. THREE LANES. NO WAY BACK."*

**ESCAPE RUN** is an adrenaline-fueled, browser-based 3D endless driving game inspired by the lane-switching mechanics of *Subway Surfers*, reimagined into a dark, neon-lit police pursuit escape thriller. 

Built entirely with **Vanilla JavaScript**, **HTML5**, **CSS3**, **Three.js**, and the **Web Audio API**—with zero external asset or audio dependencies.

---

## 🚔 Game Concept & Storyline

You are behind the wheel of a high-performance getaway sports car speeding down a locked-down metropolitan highway at midnight. 

Ahead of you, civilian commuter traffic and heavily fortified **police roadblocks** block the lanes. Behind you, an aggressive interceptor police cruiser is on your tail with flashing red and blue emergency stroboscopes, headlights beaming into your rear window, and wailing sirens. 

Every mistake, graze, or brake brings the police closer. If they box you in or you crash head-on into a barricade, you get **BUSTED!**

---

## 🎮 Controls

### Desktop (Keyboard)
| Key | Action | Description |
| :--- | :--- | :--- |
| <kbd>A</kbd> or <kbd>◀</kbd> | **Steer Left** | Shift to the left lane with chassis tilt & tire smoke |
| <kbd>D</kbd> or <kbd>▶</kbd> | **Steer Right** | Shift to the right lane with agile banking |
| <kbd>SPACE</kbd> | **Nitro Boost** | Fire twin exhaust flames, expand FOV, and exceed 220 km/h |
| <kbd>S</kbd> or <kbd>▼</kbd> | **Brake** | Decelerate to avoid tight traps (⚠️ *police close in faster!*) |

### Mobile & Touch Devices
- **On-Screen Touch Buttons**: Dedicated tactile pads for `◀ LEFT`, `⚡ BOOST`, `BRAKE`, and `▶ RIGHT`.
- **Swipe Gestures**: Swipe left or right anywhere on screen to quickly change lanes.

---

## ⚡ Core Features & Mechanics

### 1. Police Roadblock Escape (Special Mechanic)
- **Heavy Fortified Barriers**: K-rail concrete blocks, hazard-striped crossbars, and flashing warning beacons.
- **Dynamic Lane Formations**:
  - **Single-Lane Block**: Left, Center, or Right lane blocked.
  - **Double-Lane Trap**: Two lanes blocked simultaneously, leaving only a single narrow escape corridor (`>> RIGHT ONLY <<`, `<< LEFT ONLY <<`, or `-- CENTER ONLY --`).
- **Early Warning System**: An animated HUD banner sounds an alert chime 3 seconds before approaching barriers.
- **Roadblock Cleared Bonus**: Weaving through a roadblock awards **+650 points**, extends the score multiplier, and refills **+18% Nitro**!

### 2. Relentless Police Pursuit System
- **Dynamic Proximity Meter**: Real-time pursuit gauge tracking the distance between the cruiser and your rear bumper.
  - **EVADING (Safe)**: Driving cleanly at top speed widens the gap.
  - **PURSUIT CLOSE (Caution)**: Grazing cars or braking allows the police cruiser to surge forward.
  - **DANGER! (Critical)**: Head-on crash or multiple collisions lets the cruiser ram your car.
  - **BUSTED!**: Game over screen showing run stats, score, and distance.
- **Animated 3D Cruiser**: Follows with dynamic pursuit AI, active push-bumper, and alternating red/blue point lights casting real-time lighting reflections on the road.

### 3. Procedural Web Audio Synthesizer
Zero missing audio files or network latency—all sound effects are synthesized dynamically using the browser's native **Web Audio API**:
- **Engine RPM**: Dynamic pitch and low-pass filter scaling with throttle speed and nitro.
- **Police Siren**: Dual-tone frequency-modulated siren (Wail & Yelp) that grows louder and more urgent as the police cruiser approaches.
- **Tire Screeches**: Filtered white noise bursts during sharp lane changes and braking.
- **Metal Crunch & Crash**: Low-pass noise burst and rumble upon impact.
- **Near-Miss Whoosh**: Stereo frequency sweeps when dodging obstacles.
- **Audio Toggle**: One-click mute/unmute button with state persistence.

### 4. Visual Effects & Arcade Aesthetics
- **Camera Shake**: Dynamic trauma shake during near misses, collisions, and nitro thrust.
- **Speed Lines & FOV Warp**: Dynamic 3D line particles and camera FOV expansion (62° to 74°) creating intense tunnel vision at high speeds.
- **Exhaust Flames & Sparks**: Procedural nitro exhaust flames and collision spark bursts.
- **Atmospheric Metropolis**: Endless highway segments, street lamps, reflective guardrails, and distant skyscrapers with rooftop aircraft beacons.

---

## 🛠️ Tech Stack & Architecture

- **Rendering Engine**: [Three.js](https://threejs.org/) (r128 bundled locally for 100% offline capability)
- **Structure**: Semantic HTML5 with HUD overlay, mobile touch nav, and responsive modals
- **Styling**: Vanilla CSS3 (Glassmorphism, CSS Grid/Flexbox, neon glow effects, keyframe animations)
- **Audio**: Native Web Audio API procedural synthesis (Oscillators, BiquadFilters, GainNodes)
- **Font**: Google Fonts (*Orbitron* & *Rajdhani*)

### File Structure
```
├── index.html        # Game layout, HUD, start & game over screens, mobile controls
├── style.css         # Cyberpunk/midnight neon arcade styles and animations
├── game.js           # Three.js 3D scene, vehicle builders, procedural audio, game loop
├── three.min.js      # Bundled local Three.js library (runs completely offline)
└── README.md         # Project documentation and guide
```

---

## 🚀 How to Run the Game

### Option 1: Direct File Launch (No Setup Required)
Simply double-click [`index.html`](index.html) to launch the game directly in any modern web browser (Chrome, Edge, Firefox, Safari, Brave).

### Option 2: Run via Local HTTP Server
If you prefer running through a local web server:

**Using Python:**
```bash
python -m http.server 8080
```
Then visit: `http://localhost:8080`

**Using Node.js (npx):**
```bash
npx serve .
```

---

## 🏆 Scoring & Multiplier Tips

- **Near Misses**: Passing within inches of civilian cars awards **+250 points** and refills nitro.
- **Roadblocks**: Dodging roadblock barriers gives **+650 points** and raises your score multiplier up to **4.0x**.
- **Nitro Management**: Reserve boost to quickly pull away from the police when the pursuit meter enters the red *DANGER!* zone.
- **High Scores**: Your personal best escape score is saved automatically in your browser's local storage.
