/**
 * ESCAPE RUN — 3D Police Chase Endless Runner
 * "ONE ROAD. THREE LANES. NO WAY BACK."
 * Fully procedural Three.js 3D engine with Web Audio API sound synthesis.
 */

// ==========================================
// 1. SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    this.engineGain = null;
    this.engineOsc = null;
    this.sirenGain = null;
    this.sirenOsc = null;
    this.sirenLfo = null;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.initialized = true;

    // Continuous Engine Sound
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    // Continuous Police Siren Sound
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.setValueAtTime(750, this.ctx.currentTime);

    this.sirenLfo = this.ctx.createOscillator();
    this.sirenLfo.type = 'sine';
    this.sirenLfo.frequency.setValueAtTime(1.4, this.ctx.currentTime); // Wail cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(260, this.ctx.currentTime); // Frequency swing
    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.ctx.destination);
    this.sirenOsc.start();
    this.sirenLfo.start();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.sirenGain) this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  updateEngine(speedKmh, isBoosting) {
    if (!this.initialized || this.isMuted || !this.engineOsc) return;
    const norm = Math.min(1.0, speedKmh / 260);
    const targetFreq = 50 + norm * 140 + (isBoosting ? 50 : 0);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.1);
  }

  updateSiren(proximity, isPlaying) {
    if (!this.initialized || this.isMuted || !this.sirenGain) return;
    if (!isPlaying) {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      return;
    }
    // Proximity: 0 (busted / right behind) to 1 (safe distance)
    const danger = 1.0 - proximity; // 0 (safe) to 1 (extreme close)
    const targetGain = 0.03 + Math.pow(danger, 1.8) * 0.22;
    this.sirenGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    // Faster siren wail when dangerously close
    this.sirenLfo.frequency.setTargetAtTime(1.2 + danger * 2.2, this.ctx.currentTime, 0.2);
  }

  playScreech() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playCrash() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    // Noise buffer for metal crunch
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playNearMiss() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playBoost() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playAlert() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    [0, 0.12].forEach((delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + delay);
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    });
  }

  playGameOver() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [440, 392, 349, 293];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      gain.gain.setValueAtTime(0.3, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.18 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.3);
    });
  }
}

// ==========================================
// 2. MAIN GAME CONTROLLER
// ==========================================
class EscapeRunGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.sound = new SoundFX();

    // Game State
    this.state = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
    this.score = 0;
    this.distanceMeters = 0;
    this.speedKmh = 130;
    this.baseSpeedKmh = 130;
    this.maxBaseSpeedKmh = 270;
    this.targetSpeedKmh = 130;
    this.scoreMultiplier = 1.0;
    this.roadblocksCleared = 0;
    this.nearMissesCount = 0;
    this.highScore = parseInt(localStorage.getItem('escapestat_high') || '0', 10);

    // Chase Proximity: 1.0 = Safe (~25m behind), 0.0 = Busted (Right on bumper)
    this.chaseDistance = 0.85; 

    // Nitro System
    this.nitro = 100;
    this.isBoosting = false;
    this.isBraking = false;

    // Lanes: -1 (Left), 0 (Center), 1 (Right)
    this.laneWidth = 3.6;
    this.currentLane = 0;
    this.targetX = 0;
    this.playerX = 0;
    this.playerRoll = 0;

    // Camera Shake
    this.shakeIntensity = 0;

    // Spawn Timers
    this.obstacleSpawnTimer = 0;
    this.roadblockTimer = 0;
    this.nextRoadblockInterval = 14; // seconds

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Scene Entities
    this.playerCar = null;
    this.policeCar = null;
    this.flameLeft = null;
    this.flameRight = null;
    this.policeLightRed = null;
    this.policeLightBlue = null;

    this.roadSegments = [];
    this.roadSegmentLength = 40;
    this.numRoadSegments = 10;

    this.obstacles = [];
    this.particles = [];
    this.speedLines = [];
    this.cityBuildings = [];
    this.streetLamps = [];

    // Cached UI elements
    this.initDOM();
    this.initThree();
    this.buildScene();
    this.bindEvents();

    // Start render loop
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  // ==========================================
  // DOM & UI SETUP
  // ==========================================
  initDOM() {
    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudMultiplier = document.getElementById('score-multiplier');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudSpeed = document.getElementById('hud-speed');
    this.chaseStatus = document.getElementById('chase-status');
    this.chaseProgress = document.getElementById('chase-progress');
    this.chasePoliceIcon = document.getElementById('chase-police-icon');
    this.nitroFill = document.getElementById('nitro-fill');
    this.nitroPercent = document.getElementById('nitro-percent');
    this.speedVignette = document.getElementById('speed-vignette');
    this.damageFlash = document.getElementById('damage-flash');
    this.roadblockAlert = document.getElementById('roadblock-alert');
    this.alertSafeLane = document.getElementById('alert-safe-lane');
    this.comboNotification = document.getElementById('combo-notification');

    this.startScreen = document.getElementById('start-screen');
    this.startHighScore = document.getElementById('start-highscore');
    this.gameOverScreen = document.getElementById('gameover-screen');
    this.gameoverReason = document.getElementById('gameover-reason');
    this.goScore = document.getElementById('go-score');
    this.goDistance = document.getElementById('go-distance');
    this.goSpeed = document.getElementById('go-speed');
    this.goRoadblocks = document.getElementById('go-roadblocks');
    this.newRecordBanner = document.getElementById('new-record-banner');

    this.btnStart = document.getElementById('btn-start');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnMenu = document.getElementById('btn-menu');
    this.btnAudio = document.getElementById('audio-toggle');
    this.audioIcon = document.getElementById('audio-icon');

    this.mobileControls = document.getElementById('mobile-controls');
    this.btnLeft = document.getElementById('btn-left');
    this.btnRight = document.getElementById('btn-right');
    this.btnBoost = document.getElementById('btn-boost');
    this.btnBrake = document.getElementById('btn-brake');

    this.startHighScore.textContent = `${this.highScore.toLocaleString()} PTS`;

    // Detect touch device to show mobile controls
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.mobileControls.classList.remove('hidden');
    }
  }

  // ==========================================
  // THREE.JS SETUP
  // ==========================================
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.012);

    this.camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 3.8, 7.5);
    this.camera.lookAt(0, 1.2, -10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Global Lights
    const ambientLight = new THREE.AmbientLight(0x223355, 0.9);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x5588cc, 1.1);
    moonLight.position.set(20, 40, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 120;
    moonLight.shadow.camera.left = -25;
    moonLight.shadow.camera.right = 25;
    moonLight.shadow.camera.top = 25;
    moonLight.shadow.camera.bottom = -25;
    this.scene.add(moonLight);
  }

  // ==========================================
  // 3D MODELS BUILDERS (Procedural Mesh)
  // ==========================================
  createCarModel(colorHex, isPolice = false) {
    const car = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.65,
      roughness: 0.25,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Main Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(1.9, 0.55, 4.2);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    car.add(chassis);

    // Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.45, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.92, -0.2);
    cabin.castShadow = true;
    car.add(cabin);

    // Aerodynamic Hood Slope
    const hoodGeo = new THREE.BoxGeometry(1.7, 0.15, 1.2);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.68, -1.2);
    hood.rotation.x = 0.08;
    car.add(hood);

    // Wheels (4)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 8);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      [-0.95, 0.38, 1.25],
      [0.95, 0.38, 1.25],
      [-0.95, 0.38, -1.25],
      [0.95, 0.38, -1.25]
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);
      car.add(wheel);
    });

    // Headlights (Front Glowing Bulbs)
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.05);
    const hlLeft = new THREE.Mesh(hlGeo, hlMat);
    hlLeft.position.set(-0.68, 0.55, -2.12);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.68;
    car.add(hlLeft, hlRight);

    // Taillights (Rear Glowing Neon Red)
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff1144 });
    const tlGeo = new THREE.BoxGeometry(0.4, 0.12, 0.05);
    const tlLeft = new THREE.Mesh(tlGeo, tlMat);
    tlLeft.position.set(-0.68, 0.58, 2.12);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.68;
    car.add(tlLeft, tlRight);

    // Headlight Spotlights for active vehicles
    if (!isPolice) {
      const headSpot = new THREE.SpotLight(0xcceeff, 2.5, 35, Math.PI / 5, 0.4, 1.5);
      headSpot.position.set(0, 0.6, -2.1);
      headSpot.target.position.set(0, 0, -25);
      car.add(headSpot);
      car.add(headSpot.target);
    }

    if (isPolice) {
      // Push bumper / Bullbar on front
      const barMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      const barGeo = new THREE.BoxGeometry(1.8, 0.45, 0.25);
      const pushBar = new THREE.Mesh(barGeo, barMat);
      pushBar.position.set(0, 0.45, -2.25);
      car.add(pushBar);

      // Police Lightbar on Roof
      const lightbarBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
      );
      lightbarBase.position.set(0, 1.2, -0.2);
      car.add(lightbarBase);

      const strobeRedMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
      const strobeBlueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });

      const strobeGeo = new THREE.BoxGeometry(0.45, 0.14, 0.24);
      const redMesh = new THREE.Mesh(strobeGeo, strobeRedMat);
      redMesh.position.set(-0.35, 0.1, 0);
      lightbarBase.add(redMesh);

      const blueMesh = new THREE.Mesh(strobeGeo, strobeBlueMat);
      blueMesh.position.set(0.35, 0.1, 0);
      lightbarBase.add(blueMesh);

      // Real Pointlights for red/blue strobe reflections on asphalt
      this.policeLightRed = new THREE.PointLight(0xff0033, 4, 25);
      this.policeLightRed.position.set(-0.6, 1.6, -0.2);
      car.add(this.policeLightRed);

      this.policeLightBlue = new THREE.PointLight(0x0066ff, 4, 25);
      this.policeLightBlue.position.set(0.6, 1.6, -0.2);
      car.add(this.policeLightBlue);

      // Police Pursuit Headlights
      const policeSpot = new THREE.SpotLight(0xfff5e6, 3.2, 45, Math.PI / 4, 0.3);
      policeSpot.position.set(0, 0.8, -2.1);
      policeSpot.target.position.set(0, 0, -25);
      car.add(policeSpot);
      car.add(policeSpot.target);
    }

    return car;
  }

  createRoadblockMesh() {
    const group = new THREE.Group();

    // Concrete K-Rail barrier base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x555c68, roughness: 0.9 });
    const baseGeo = new THREE.BoxGeometry(3.3, 0.7, 0.7);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.35;
    base.castShadow = true;
    group.add(base);

    // Hazard striped wooden crossbars (Police Roadblock)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f59e0b'; // Amber yellow
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#0f172a'; // Black hazard stripes
    for (let i = -64; i < 256; i += 36) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 24, 0);
      ctx.lineTo(i - 12, 64);
      ctx.lineTo(i - 36, 64);
      ctx.closePath();
      ctx.fill();
    }
    const stripeTex = new THREE.CanvasTexture(canvas);
    stripeTex.wrapS = THREE.RepeatWrapping;

    const boardMat = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.5 });
    const boardGeo = new THREE.BoxGeometry(3.3, 0.5, 0.12);
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 1.15, 0);
    group.add(board);

    // Support poles
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    const pole1 = new THREE.Mesh(poleGeo, poleMat);
    pole1.position.set(-1.4, 0.85, 0);
    const pole2 = pole1.clone();
    pole2.position.x = 1.4;
    group.add(pole1, pole2);

    // Flashing Warning Beacons on Top
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const beaconGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.28, 12);
    const b1 = new THREE.Mesh(beaconGeo, beaconMat);
    b1.position.set(-1.3, 1.55, 0);
    const b2 = b1.clone();
    b2.position.x = 1.3;
    group.add(b1, b2);

    // Pulsing light
    const beaconLight = new THREE.PointLight(0xff0044, 2.5, 12);
    beaconLight.position.set(0, 1.6, 0);
    group.add(beaconLight);
    group.userData.beaconLight = beaconLight;

    return group;
  }

  // ==========================================
  // SCENE CONSTRUCTION
  // ==========================================
  buildScene() {
    // 1. Road Segments
    for (let i = 0; i < this.numRoadSegments; i++) {
      const seg = this.createRoadSegment(i * -this.roadSegmentLength);
      this.roadSegments.push(seg);
      this.scene.add(seg);
    }

    // 2. Player Sports Car (Electric Cyan / Sleek Silver)
    this.playerCar = this.createCarModel(0x00f0ff, false);
    this.playerCar.position.set(0, 0, 0);
    this.scene.add(this.playerCar);

    // Dual Nitro Exhaust Flame Meshes
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });
    const flameGeo = new THREE.ConeGeometry(0.12, 0.8, 8);
    flameGeo.rotateX(-Math.PI / 2);

    this.flameLeft = new THREE.Mesh(flameGeo, flameMat);
    this.flameLeft.position.set(-0.45, 0.4, 2.3);
    this.flameLeft.scale.set(0, 0, 0);
    this.playerCar.add(this.flameLeft);

    this.flameRight = this.flameLeft.clone();
    this.flameRight.position.x = 0.45;
    this.playerCar.add(this.flameRight);

    // 3. Police Pursuit Cruiser (Trailing behind)
    this.policeCar = this.createCarModel(0x111111, true);
    this.policeCar.position.set(0, 0, 18);
    this.scene.add(this.policeCar);

    // 4. Distant City Skyline & Highway Lights
    this.buildCitySkyline();

    // 5. Speed Lines VFX Mesh pool
    this.buildSpeedLines();
  }

  createRoadSegment(zPos) {
    const seg = new THREE.Group();
    seg.position.z = zPos;

    // Asphalt Surface
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x181c26,
      roughness: 0.85,
      metalness: 0.15,
    });
    const roadWidth = this.laneWidth * 3 + 2.4; // 3 lanes + shoulders
    const roadGeo = new THREE.PlaneGeometry(roadWidth, this.roadSegmentLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.receiveShadow = true;
    seg.add(roadMesh);

    // Curbs / Guardrails
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const curbGeo = new THREE.BoxGeometry(0.6, 0.45, this.roadSegmentLength);
    const curbLeft = new THREE.Mesh(curbGeo, curbMat);
    curbLeft.position.set(-(roadWidth / 2 + 0.3), 0.22, 0);
    const curbRight = curbLeft.clone();
    curbRight.position.x = roadWidth / 2 + 0.3;
    seg.add(curbLeft, curbRight);

    // Guardrail Reflectors
    const studMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const studGeo = new THREE.BoxGeometry(0.1, 0.15, 0.3);
    for (let z = -this.roadSegmentLength / 2 + 5; z < this.roadSegmentLength / 2; z += 10) {
      const sL = new THREE.Mesh(studGeo, studMat);
      sL.position.set(-(roadWidth / 2), 0.45, z);
      const sR = sL.clone();
      sR.position.x = roadWidth / 2;
      seg.add(sL, sR);
    }

    // Dashed Lane Dividers (Between Lane 1 & 2, and Lane 2 & 3)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dashGeo = new THREE.PlaneGeometry(0.18, 3.5);
    dashGeo.rotateX(-Math.PI / 2);

    const laneSeparators = [-this.laneWidth / 2, this.laneWidth / 2];
    laneSeparators.forEach((x) => {
      for (let z = -this.roadSegmentLength / 2 + 2; z < this.roadSegmentLength / 2; z += 6) {
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.position.set(x, 0.015, z);
        seg.add(dash);
      }
    });

    // Street Lamps on alternating sides
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const lampPostGeo = new THREE.CylinderGeometry(0.12, 0.15, 7.5);
    const lampArmGeo = new THREE.CylinderGeometry(0.08, 0.08, 3);
    lampArmGeo.rotateZ(Math.PI / 3);

    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe29a });
    const lampBulbGeo = new THREE.SphereGeometry(0.35, 8, 8);

    const isLeft = Math.random() > 0.5;
    const lampX = isLeft ? -(roadWidth / 2 + 1.6) : (roadWidth / 2 + 1.6);

    const lamp = new THREE.Group();
    lamp.position.set(lampX, 0, 0);

    const post = new THREE.Mesh(lampPostGeo, lampMat);
    post.position.y = 3.75;
    lamp.add(post);

    const arm = new THREE.Mesh(lampArmGeo, lampMat);
    arm.position.set(isLeft ? 1.0 : -1.0, 7.2, 0);
    lamp.add(arm);

    const bulb = new THREE.Mesh(lampBulbGeo, lampBulbMat);
    bulb.position.set(isLeft ? 2.2 : -2.2, 7.4, 0);
    lamp.add(bulb);

    seg.add(lamp);

    return seg;
  }

  buildCitySkyline() {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
    });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    for (let i = 0; i < 48; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const width = 12 + Math.random() * 18;
      const depth = 12 + Math.random() * 18;
      const height = 35 + Math.random() * 65;

      const building = new THREE.Group();
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMat);
      bMesh.position.y = height / 2;
      building.add(bMesh);

      // Rooftop aircraft beacon
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), beaconMat);
      beacon.position.set(0, height + 0.5, 0);
      building.add(beacon);

      const posX = side * (32 + Math.random() * 45);
      const posZ = -i * 8;
      building.position.set(posX, 0, posZ);
      this.cityBuildings.push(building);
      this.scene.add(building);
    }
  }

  buildSpeedLines() {
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6,
    });
    for (let i = 0; i < 40; i++) {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 4)];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, lineMat);
      this.resetSpeedLine(line);
      this.speedLines.push(line);
      this.scene.add(line);
    }
  }

  resetSpeedLine(line) {
    line.position.set(
      (Math.random() * 2 - 1) * 12,
      0.5 + Math.random() * 4,
      -30 - Math.random() * 50
    );
    line.visible = false;
  }

  // ==========================================
  // INPUT & EVENT BINDINGS
  // ==========================================
  bindEvents() {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'PLAYING') return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.shiftLane(-1);
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.shiftLane(1);
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.setBoosting(true);
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
        this.setBraking(true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.setBoosting(false);
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.setBraking(false);
      }
    });

    // Touch Controls
    this.btnLeft.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.state === 'PLAYING') this.shiftLane(-1);
    });
    this.btnRight.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.state === 'PLAYING') this.shiftLane(1);
    });

    this.btnBoost.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.state === 'PLAYING') this.setBoosting(true);
    });
    window.addEventListener('pointerup', () => {
      this.setBoosting(false);
      this.setBraking(false);
    });

    this.btnBrake.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.state === 'PLAYING') this.setBraking(true);
    });

    // Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.state !== 'PLAYING') return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.shiftLane(1);
        else this.shiftLane(-1);
      }
    }, { passive: true });

    // Buttons
    this.btnStart.addEventListener('click', () => {
      this.sound.init();
      this.sound.resume();
      this.startGame();
    });

    this.btnRetry.addEventListener('click', () => {
      this.sound.resume();
      this.startGame();
    });

    this.btnMenu.addEventListener('click', () => {
      this.showStartMenu();
    });

    this.btnAudio.addEventListener('click', () => {
      this.sound.init();
      const muted = this.sound.toggleMute();
      this.audioIcon.textContent = muted ? '🔇' : '🔊';
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  shiftLane(dir) {
    const newLane = Math.max(-1, Math.min(1, this.currentLane + dir));
    if (newLane !== this.currentLane) {
      this.currentLane = newLane;
      this.targetX = this.currentLane * this.laneWidth;
      this.playerRoll = -dir * 0.18; // Agile body tilt
      this.sound.playScreech();
      this.spawnTireSmoke(this.playerCar.position.x, 0.2, this.playerCar.position.z + 1.2);
    }
  }

  setBoosting(active) {
    if (active && this.nitro > 8) {
      if (!this.isBoosting) this.sound.playBoost();
      this.isBoosting = true;
      this.speedVignette.classList.add('boosting');
    } else {
      this.isBoosting = false;
      this.speedVignette.classList.remove('boosting');
    }
  }

  setBraking(active) {
    this.isBraking = active;
    if (active) {
      this.sound.playScreech();
      this.spawnTireSmoke(this.playerCar.position.x, 0.2, this.playerCar.position.z + 1.2);
    }
  }

  // ==========================================
  // GAMEPLAY LIFECYCLE
  // ==========================================
  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.distanceMeters = 0;
    this.speedKmh = 130;
    this.baseSpeedKmh = 130;
    this.targetSpeedKmh = 130;
    this.scoreMultiplier = 1.0;
    this.roadblocksCleared = 0;
    this.nearMissesCount = 0;
    this.chaseDistance = 0.85;
    this.nitro = 100;
    this.isBoosting = false;
    this.isBraking = false;
    this.shakeIntensity = 0;

    this.currentLane = 0;
    this.targetX = 0;
    this.playerX = 0;
    this.playerRoll = 0;

    this.obstacleSpawnTimer = 0;
    this.roadblockTimer = 0;

    // Reset Player
    this.playerCar.position.set(0, 0, 0);
    this.playerCar.rotation.set(0, 0, 0);

    // Reset Police Cruiser
    this.policeCar.position.set(0, 0, 18);

    // Clear existing obstacles
    this.obstacles.forEach((obs) => this.scene.remove(obs.mesh));
    this.obstacles = [];

    // Clear particles
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];

    // UI Updates
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.roadblockAlert.classList.add('hidden');
  }

  showStartMenu() {
    this.state = 'START';
    this.startHighScore.textContent = `${this.highScore.toLocaleString()} PTS`;
    this.startScreen.classList.remove('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.roadblockAlert.classList.add('hidden');
    this.sound.updateSiren(1.0, false);
  }

  triggerGameOver(reason) {
    this.state = 'GAMEOVER';
    this.sound.playGameOver();
    this.sound.playCrash();
    this.shakeIntensity = 0.8;
    this.damageFlash.classList.add('flash');
    setTimeout(() => this.damageFlash.classList.remove('flash'), 300);

    // Save High Score
    const finalScore = Math.floor(this.score);
    const isNewRecord = finalScore > this.highScore;
    if (isNewRecord) {
      this.highScore = finalScore;
      localStorage.setItem('escapestat_high', this.highScore.toString());
      this.newRecordBanner.classList.remove('hidden');
    } else {
      this.newRecordBanner.classList.add('hidden');
    }

    // Populate Results Screen
    this.gameoverReason.textContent = reason;
    this.goScore.textContent = finalScore.toLocaleString();
    this.goDistance.textContent = `${(this.distanceMeters / 1000).toFixed(1)} KM`;
    this.goSpeed.textContent = `${Math.floor(this.speedKmh)} KM/H`;
    this.goRoadblocks.textContent = this.roadblocksCleared.toString();

    this.hud.classList.add('hidden');
    this.roadblockAlert.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');
  }

  // ==========================================
  // SPANWING SYSTEMS
  // ==========================================
  spawnObstacle() {
    // Determine whether to spawn a regular civilian car or a single barricade
    const lane = [-1, 0, 1][Math.floor(Math.random() * 3)];
    const colors = [0xd90429, 0xf77f00, 0x4361ee, 0x2ec4b6, 0xf1faee, 0x6c757d];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const carMesh = this.createCarModel(color, false);
    carMesh.position.set(lane * this.laneWidth, 0, -180);
    this.scene.add(carMesh);

    this.obstacles.push({
      type: 'CAR',
      lane: lane,
      mesh: carMesh,
      box: new THREE.Box3(),
      speedRelative: -0.35, // Moving forward slower than player
      cleared: false,
    });
  }

  spawnRoadblock() {
    this.sound.playAlert();

    // Barrier configuration:
    // Option 0: 1 lane blocked (Left)
    // Option 1: 1 lane blocked (Center)
    // Option 2: 1 lane blocked (Right)
    // Option 3: 2 lanes blocked (e.g. Left & Center, only Right open)
    // Option 4: 2 lanes blocked (e.g. Center & Right, only Left open)
    // Option 5: 2 lanes blocked (e.g. Left & Right, only Center open)
    const configs = [
      { blocked: [-1], safeText: 'SAFE LANE: CENTER / RIGHT' },
      { blocked: [0], safeText: 'SAFE LANE: LEFT / RIGHT' },
      { blocked: [1], safeText: 'SAFE LANE: LEFT / CENTER' },
      { blocked: [-1, 0], safeText: 'SAFE LANE: >> RIGHT ONLY <<' },
      { blocked: [0, 1], safeText: 'SAFE LANE: << LEFT ONLY <<' },
      { blocked: [-1, 1], safeText: 'SAFE LANE: -- CENTER ONLY --' },
    ];

    // Pick 2-lane traps more frequently as speed increases
    const maxIndex = this.speedKmh > 180 ? configs.length : 3;
    const chosen = configs[Math.floor(Math.random() * maxIndex)];

    // Show Roadblock Alert in HUD
    this.alertSafeLane.textContent = chosen.safeText;
    this.roadblockAlert.classList.remove('hidden');
    setTimeout(() => {
      this.roadblockAlert.classList.add('hidden');
    }, 3200);

    // Spawn barricades for each blocked lane
    chosen.blocked.forEach((lane) => {
      const barrierMesh = this.createRoadblockMesh();
      barrierMesh.position.set(lane * this.laneWidth, 0, -195);
      this.scene.add(barrierMesh);

      this.obstacles.push({
        type: 'ROADBLOCK',
        lane: lane,
        mesh: barrierMesh,
        box: new THREE.Box3(),
        speedRelative: 0, // Fixed position on the road
        cleared: false,
      });
    });
  }

  // ==========================================
  // PARTICLES & JUICE
  // ==========================================
  spawnTireSmoke(x, y, z) {
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
    });
    const pGeo = new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 6, 6);
    const mesh = new THREE.Mesh(pGeo, pMat);
    mesh.position.set(x + (Math.random() * 0.4 - 0.2), y, z);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      life: 0.5,
      maxLife: 0.5,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        0.8 + Math.random() * 0.8,
        3 + Math.random() * 3
      ),
    });
  }

  spawnSparks(x, y, z, count = 12) {
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.6,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          2 + Math.random() * 6,
          (Math.random() - 0.5) * 8
        ),
      });
    }
  }

  showComboText(text, color = '#00f0ff') {
    this.comboNotification.textContent = text;
    this.comboNotification.style.color = color;
    this.comboNotification.classList.add('show');
    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboNotification.classList.remove('show');
    }, 1100);
  }

  // ==========================================
  // MAIN UPDATE LOOP
  // ==========================================
  update(delta) {
    if (this.state !== 'PLAYING') {
      // Idle rotation / camera pan on start screen
      const time = this.clock.getElapsedTime();
      if (this.playerCar) {
        this.playerCar.position.x = Math.sin(time * 0.8) * 0.6;
        this.playerCar.rotation.y = Math.sin(time * 0.8) * 0.04;
      }
      return;
    }

    // 1. Difficulty Ramp
    this.baseSpeedKmh = Math.min(this.maxBaseSpeedKmh, this.baseSpeedKmh + delta * 2.8);

    // 2. Throttle / Speed Dynamics
    if (this.isBoosting && this.nitro > 0) {
      this.targetSpeedKmh = this.baseSpeedKmh + 65;
      this.nitro = Math.max(0, this.nitro - delta * 28);
      if (this.nitro === 0) this.setBoosting(false);
    } else if (this.isBraking) {
      this.targetSpeedKmh = Math.max(70, this.baseSpeedKmh - 60);
      // Braking lets police surge forward!
      this.chaseDistance = Math.max(0, this.chaseDistance - delta * 0.22);
    } else {
      this.targetSpeedKmh = this.baseSpeedKmh;
      // Recover nitro slowly
      this.nitro = Math.min(100, this.nitro + delta * 6);
    }

    // Smooth speed lerp
    this.speedKmh += (this.targetSpeedKmh - this.speedKmh) * (delta * 4);
    const speedWorldUnits = (this.speedKmh / 3.6) * delta * 1.5;

    // 3. Stats Progression
    this.distanceMeters += (this.speedKmh / 3.6) * delta;
    this.score += delta * (this.speedKmh * 0.4) * this.scoreMultiplier;

    // 4. Police Chase Proximity Dynamics
    // High speed driving gradually increases distance (gap widens)
    if (this.speedKmh > this.baseSpeedKmh + 20) {
      this.chaseDistance = Math.min(1.0, this.chaseDistance + delta * 0.08);
    } else {
      // Steady relentless police pursuit
      this.chaseDistance = Math.max(0, this.chaseDistance - delta * 0.015);
    }

    // Check if caught by police
    if (this.chaseDistance <= 0.02) {
      this.triggerGameOver('The interceptor police cruiser rammed and boxed you in!');
      return;
    }

    // 5. Player Smooth Lane Movement & Banking
    this.playerX += (this.targetX - this.playerX) * (delta * 12);
    this.playerCar.position.x = this.playerX;

    // Roll body tilt returns to 0
    this.playerRoll *= Math.pow(0.05, delta);
    this.playerCar.rotation.z = this.playerRoll;
    this.playerCar.rotation.y = -this.playerRoll * 0.5;

    // Nitro exhaust flames scale
    const flameScale = this.isBoosting ? 1.0 + Math.sin(this.clock.getElapsedTime() * 30) * 0.2 : 0;
    this.flameLeft.scale.set(flameScale, flameScale, flameScale);
    this.flameRight.scale.set(flameScale, flameScale, flameScale);

    // 6. Police Cruiser AI Follow
    // Target position in Z tracks chase proximity (distance: 5 units when busted, 24 units when safe)
    const targetPoliceZ = 4.5 + this.chaseDistance * 18.0;
    this.policeCar.position.z += (targetPoliceZ - this.policeCar.position.z) * (delta * 3.5);

    // Police swerves aggressively to match player's lane with a slight lag
    this.policeCar.position.x += (this.playerX - this.policeCar.position.x) * (delta * 7);

    // Strobe lights alternating flash
    const strobeTime = this.clock.getElapsedTime() * 12;
    const isRedPhase = Math.floor(strobeTime) % 2 === 0;
    if (this.policeLightRed && this.policeLightBlue) {
      this.policeLightRed.intensity = isRedPhase ? 6.0 : 0.2;
      this.policeLightBlue.intensity = !isRedPhase ? 6.0 : 0.2;
    }

    // 7. Endless Highway Recycling
    this.roadSegments.forEach((seg) => {
      seg.position.z += speedWorldUnits;
      if (seg.position.z > this.roadSegmentLength) {
        // Move back to head of queue
        let minZ = 0;
        this.roadSegments.forEach((s) => {
          if (s.position.z < minZ) minZ = s.position.z;
        });
        seg.position.z = minZ - this.roadSegmentLength;
      }
    });

    // 8. Distant City Skyline Parallax
    this.cityBuildings.forEach((b) => {
      b.position.z += speedWorldUnits * 0.35;
      if (b.position.z > 50) {
        b.position.z -= 48 * 8;
      }
    });

    // 9. Obstacles Spawner & Movement
    this.obstacleSpawnTimer += delta;
    const currentSpawnRate = Math.max(0.75, 1.8 - (this.baseSpeedKmh / 270) * 0.9);
    if (this.obstacleSpawnTimer > currentSpawnRate) {
      this.obstacleSpawnTimer = 0;
      this.spawnObstacle();
    }

    // Roadblock Spawner
    this.roadblockTimer += delta;
    if (this.roadblockTimer > this.nextRoadblockInterval) {
      this.roadblockTimer = 0;
      this.spawnRoadblock();
      this.nextRoadblockInterval = Math.max(8, 16 - (this.baseSpeedKmh / 270) * 6);
    }

    // Update Obstacles & Collisions
    const playerBox = new THREE.Box3().setFromObject(this.playerCar);
    playerBox.expandByScalar(-0.25); // Forgiving hitbox for fast arcade reflexes

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const relativeSpeed = speedWorldUnits + obs.speedRelative * speedWorldUnits;
      obs.mesh.position.z += relativeSpeed;

      // Roadblock beacon lights flash
      if (obs.type === 'ROADBLOCK' && obs.mesh.userData.beaconLight) {
        obs.mesh.userData.beaconLight.intensity = Math.sin(this.clock.getElapsedTime() * 15) > 0 ? 3.5 : 0.2;
      }

      obs.box.setFromObject(obs.mesh);

      // Check Collision with Player
      if (playerBox.intersectsBox(obs.box)) {
        this.handleCollision(obs);
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
        continue;
      }

      // Check Near Miss (Passing very close without hitting)
      if (!obs.cleared && obs.mesh.position.z > this.playerCar.position.z) {
        obs.cleared = true;
        const lateralDist = Math.abs(obs.mesh.position.x - this.playerCar.position.x);
        if (lateralDist < this.laneWidth * 1.35) {
          this.handleNearMiss(obs);
        }
      }

      // Despawn behind camera
      if (obs.mesh.position.z > 35) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // 10. Particles Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.multiplyScalar(0.96);
    }

    // 11. Speed Lines VFX
    const isHighSpeed = this.speedKmh > 180 || this.isBoosting;
    this.speedLines.forEach((line) => {
      line.visible = isHighSpeed;
      if (isHighSpeed) {
        line.position.z += speedWorldUnits * 1.8;
        if (line.position.z > 10) {
          this.resetSpeedLine(line);
        }
      }
    });

    // 12. Camera Shake & FOV
    if (this.shakeIntensity > 0) {
      this.camera.position.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y = 3.8 + (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.2);
    } else {
      // Subtle camera follow
      this.camera.position.x = this.playerX * 0.35;
      this.camera.position.y = 3.8;
    }

    // FOV expands during boost
    const targetFov = this.isBoosting ? 74 : 62;
    this.camera.fov += (targetFov - this.camera.fov) * (delta * 6);
    this.camera.updateProjectionMatrix();

    // 13. Audio & HUD
    this.sound.updateEngine(this.speedKmh, this.isBoosting);
    this.sound.updateSiren(this.chaseDistance, true);
    this.updateHUD();
  }

  handleCollision(obs) {
    this.sound.playCrash();
    this.shakeIntensity = 0.55;
    this.spawnSparks(this.playerCar.position.x, 0.8, this.playerCar.position.z - 1.2, 24);

    this.damageFlash.classList.add('flash');
    setTimeout(() => this.damageFlash.classList.remove('flash'), 220);

    // Severe impact penalty: speed drops, police surge close
    this.speedKmh = Math.max(75, this.speedKmh - 50);
    this.baseSpeedKmh = Math.max(120, this.baseSpeedKmh - 25);
    this.scoreMultiplier = 1.0;

    // Roadblock collision is much more dangerous
    const penalty = obs.type === 'ROADBLOCK' ? 0.4 : 0.26;
    this.chaseDistance -= penalty;

    if (this.chaseDistance <= 0.05) {
      this.triggerGameOver(
        obs.type === 'ROADBLOCK'
          ? 'You crashed into the police barricade and were immediately arrested!'
          : 'After the crash, the pursuit cruiser intercepted you!'
      );
    } else {
      this.showComboText('COLLISION! POLICE CLOSING IN!', '#ff0055');
    }
  }

  handleNearMiss(obs) {
    this.nearMissesCount++;
    this.sound.playNearMiss();
    this.nitro = Math.min(100, this.nitro + 18); // Reward with Nitro!

    if (obs.type === 'ROADBLOCK') {
      this.roadblocksCleared++;
      this.score += 650;
      this.scoreMultiplier = Math.min(4.0, this.scoreMultiplier + 0.5);
      this.showComboText('ROADBLOCK DODGED! +650', '#ffb703');
    } else {
      this.score += 250;
      this.scoreMultiplier = Math.min(4.0, this.scoreMultiplier + 0.2);
      this.showComboText('CLOSE PASS! +250', '#00f0ff');
    }
  }

  updateHUD() {
    this.hudScore.textContent = Math.floor(this.score).toLocaleString();
    this.hudMultiplier.textContent = `${this.scoreMultiplier.toFixed(1)}x`;
    this.hudDistance.innerHTML = `${(this.distanceMeters / 1000).toFixed(1)} <small>KM</small>`;
    this.hudSpeed.innerHTML = `${Math.floor(this.speedKmh)} <small>KM/H</small>`;

    // Proximity Bar & Status
    const percent = Math.floor(this.chaseDistance * 100);
    this.chaseProgress.style.width = `${percent}%`;

    if (this.chaseDistance > 0.6) {
      this.chaseStatus.className = 'chase-status safe';
      this.chaseStatus.textContent = 'EVADING';
    } else if (this.chaseDistance > 0.3) {
      this.chaseStatus.className = 'chase-status caution';
      this.chaseStatus.textContent = 'PURSUIT CLOSE';
    } else {
      this.chaseStatus.className = 'chase-status danger';
      this.chaseStatus.textContent = 'DANGER!';
    }

    // Nitro Bar
    this.nitroFill.style.width = `${Math.floor(this.nitro)}%`;
    this.nitroPercent.textContent = `${Math.floor(this.nitro)}%`;
  }

  // ==========================================
  // RENDER LOOP
  // ==========================================
  renderLoop() {
    requestAnimationFrame(this.renderLoop.bind(this));
    const delta = Math.min(0.08, this.clock.getDelta());
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
  new EscapeRunGame();
});
