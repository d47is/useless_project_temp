const GROQ_API_KEY = "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";

let activeWeapon = null; // 'gun', 'flamethrower', or 'missile'
let canvas, ctx;
let flameParticles = [];
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  if (type === 'gun') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.12);
  } else if (type === 'flame') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
  } else if (type === 'missile') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.6);
  }
}

function setupRageCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.id = 'rageCanvas';
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none; z-index: 999998;
  `;
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animLoop);
}

function animLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Intense Flame Particle Physics
  for (let i = flameParticles.length - 1; i >= 0; i--) {
    const p = flameParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.size *= 0.96;
    p.life -= p.decay;

    if (p.life <= 0 || p.size <= 0.5) {
      flameParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.r}, ${p.g}, 0, ${p.life})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = p.g > 100 ? '#fffa65' : '#ff4757';
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(animLoop);
}

function createCrack(x, y, scaleMultiplier = 1, isTemporary = false) {
  const size = 60 * scaleMultiplier;
  const crack = document.createElement('div');
  crack.className = 'rage-crack';
  crack.style.cssText = `
    position: fixed; left: ${x - size / 2}px; top: ${y - size / 2}px;
    width: ${size}px; height: ${size}px;
    pointer-events: none; z-index: 999997;
    background: radial-gradient(circle, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.8) 50%, transparent 100%);
    border-radius: 50%;
    transform: scale(0); transition: transform 0.04s ease-out, opacity 0.4s ease-in;
  `;

  // Draw high-visibility jagged SVG glass cracks
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);

  const numLines = isTemporary ? 16 : 8;
  const center = size / 2;

  for (let i = 0; i < numLines; i++) {
    const angle = (Math.PI * 2 / numLines) * i + (Math.random() * 0.4 - 0.2);
    const length = (center * 0.4) + Math.random() * (center * 0.5);
    const x2 = center + Math.cos(angle) * length;
    const y2 = center + Math.sin(angle) * length;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', center); line.setAttribute('y1', center);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', isTemporary ? '#ff4757' : '#ffffff');
    line.setAttribute('stroke-width', scaleMultiplier > 2 ? '3.5' : '2');
    svg.appendChild(line);
  }

  crack.appendChild(svg);
  document.body.appendChild(crack);

  setTimeout(() => { crack.style.transform = 'scale(1)'; }, 10);

  // Screen shake scaled to weapon power
  const intensity = 6 * scaleMultiplier;
  document.body.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
  setTimeout(() => { document.body.style.transform = ''; }, 60);

  // If missile crack, disappear after 3 seconds
  if (isTemporary) {
    setTimeout(() => {
      crack.style.opacity = '0';
      setTimeout(() => crack.remove(), 400);
    }, 3000);
  }
}

function spawnFlameStream(x, y) {
  // Heavy multi-layer particle stream
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    flameParticles.push({
      x: x + (Math.random() - 0.5) * 15,
      y: y + (Math.random() - 0.5) * 15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 18 + Math.random() * 22,
      r: 255,
      g: Math.floor(Math.random() * 180),
      life: 1.0,
      decay: 0.02 + Math.random() * 0.03
    });
  }
}

function equipWeapon(weaponType) {
  activeWeapon = weaponType;
  setupRageCanvas();

  const arsenal = document.getElementById('rageArsenal');
  if (arsenal) arsenal.style.display = 'flex';

  if (weaponType === 'gun') {
    document.body.style.cursor = 'crosshair';
  } else if (weaponType === 'flamethrower') {
    document.body.style.cursor = 'crosshair';
  } else if (weaponType === 'missile') {
    document.body.style.cursor = 'cell';
  }
}

window.addEventListener('mousedown', (e) => {
  if (!activeWeapon) return;
  if (e.target.closest('#rage-sidekick-container')) return;

  initAudio();

  if (activeWeapon === 'gun') {
    playSound('gun');
    createCrack(e.clientX, e.clientY, 1, false);
  } else if (activeWeapon === 'missile') {
    playSound('missile');
    createCrack(e.clientX, e.clientY, 5, true); // 5x bigger, disappears in 3s
  }
});

window.addEventListener('mousemove', (e) => {
  if (!activeWeapon) return;
  if (e.target.closest('#rage-sidekick-container')) return;

  if (activeWeapon === 'flamethrower' && e.buttons === 1) {
    initAudio();
    playSound('flame');
    spawnFlameStream(e.clientX, e.clientY);
  }
});

function injectChatSidebar() {
  if (document.getElementById('rage-sidekick-container')) return;

  const container = document.createElement('div');
  container.id = 'rage-sidekick-container';
  container.innerHTML = `
    <style>
      #rage-sidekick-container {
        position: fixed; bottom: 20px; right: 20px; width: 330px;
        background: #111; border: 2px solid #ff4757; border-radius: 12px;
        padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 999999;
        font-family: Arial, sans-serif; color: #fff;
      }
      .rage-header { font-weight: bold; color: #ff4757; margin-bottom: 8px; font-size: 14px; text-align: center; }
      .rage-chat { height: 120px; overflow-y: auto; background: #222; padding: 8px; border-radius: 6px; font-size: 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; }
      .rage-arsenal { display: none; gap: 6px; margin-bottom: 8px; justify-content: center; flex-wrap: wrap; }
      .rage-weapon-btn { background: #222; border: 1px solid #ff4757; color: #fff; padding: 5px 8px; font-size: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }
      .rage-weapon-btn:hover { background: #ff4757; }
      .rage-input-box { display: flex; gap: 4px; }
      .rage-input-box input { flex: 1; background: #333; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; font-size: 12px; outline: none; }
      .rage-input-box button { background: #ff4757; border: none; color: #fff; padding: 6px 12px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    </style>
    <div class="rage-header">🤖 AI Rage Homie</div>
    <div class="rage-chat" id="rageChat"><div><b style="color:#ff4757;">Homie:</b> What's wrong with this site, bro?</div></div>
    
    <div class="rage-arsenal" id="rageArsenal">
      <button class="rage-weapon-btn" id="btnGun">🔫 Pistol</button>
      <button class="rage-weapon-btn" id="btnFlame">🔥 Flamethrower</button>
      <button class="rage-weapon-btn" id="btnMissile">🚀 Missile (5x Big Crack)</button>
    </div>

    <div class="rage-input-box">
      <input type="text" id="rageInput" placeholder="This page is so annoying..." />
      <button id="rageSend">Send</button>
    </div>
  `;
  document.body.appendChild(container);

  document.getElementById('rageSend').addEventListener('click', handleUserComplaint);
  document.getElementById('rageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserComplaint();
  });

  document.getElementById('btnGun').addEventListener('click', () => equipWeapon('gun'));
  document.getElementById('btnFlame').addEventListener('click', () => equipWeapon('flamethrower'));
  document.getElementById('btnMissile').addEventListener('click', () => equipWeapon('missile'));
}

async function handleUserComplaint() {
  const input = document.getElementById('rageInput');
  const chat = document.getElementById('rageChat');
  const userText = input.value.trim();
  if (!userText) return;

  chat.innerHTML += `<div><b>You:</b> ${userText}</div>`;
  input.value = '';
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "You are a chaotic hype-man. Tell the user their weapons (gun, flamethrower, missile) are loaded below. Under 15 words." },
          { role: "user", content: userText }
        ]
      })
    });

    const data = await res.json();
    const reply = data.choices ? data.choices[0].message.content : "Arsenal unlocked! Grab a gun or launch a missile!";
    
    chat.innerHTML += `<div><b style="color: #ff4757;">Homie:</b> ${reply}</div>`;
    chat.scrollTop = chat.scrollHeight;

    equipWeapon('gun');

  } catch (err) {
    chat.innerHTML += `<div><b style="color: #ff4757;">Homie:</b> Heavy weapons ready! Select a tool below.</div>`;
    equipWeapon('gun');
  }
}

injectChatSidebar();