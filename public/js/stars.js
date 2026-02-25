// ============================================
// RICO STAR BACKGROUND
// VERSION 1 = Twinkling Stars
// VERSION 4 = Stars + Shooting Stars
// Change the number below to switch versions
// ============================================

console.log('stars.js loaded, canvas:', document.getElementById('starCanvas'));
const STAR_VERSION = 4;

const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');

let stars = [];
let shootingStars = [];
let animationId;

// ===== CANVAS SIZING =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ===== CHECK CURRENT THEME =====
function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// ===== CREATE STARS =====
function createStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.3,
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleDirection: Math.random() > 0.5 ? 1 : -1,
      maxOpacity: Math.random() * 0.6 + 0.3,
      minOpacity: Math.random() * 0.1,
    });
  }
}

// ===== CREATE SHOOTING STAR =====
function createShootingStar() {
  const startX = Math.random() * canvas.width * 0.7;
  const startY = Math.random() * canvas.height * 0.4;
  shootingStars.push({
    x: startX,
    y: startY,
    length: Math.random() * 120 + 60,
    speed: Math.random() * 8 + 6,
    angle: Math.PI / 4 + (Math.random() * 0.3 - 0.15),
    opacity: 1,
    trail: [],
  });
}

// ===== VERSION 1: TWINKLING STARS =====
function drawTwinkling() {
  const dark = isDarkMode();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    // Twinkle logic
    star.opacity += star.twinkleSpeed * star.twinkleDirection;
    if (star.opacity >= star.maxOpacity) {
      star.opacity = star.maxOpacity;
      star.twinkleDirection = -1;
    }
    if (star.opacity <= star.minOpacity) {
      star.opacity = star.minOpacity;
      star.twinkleDirection = 1;
    }

    const alpha = dark ? star.opacity : star.opacity * 0.35;
    const color = dark ? `255,255,255` : `80,80,120`;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    // Glow effect
    const gradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.radius * 3
    );
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  animationId = requestAnimationFrame(drawTwinkling);
}

// ===== VERSION 4: TWINKLING + SHOOTING STARS =====
function drawShootingStars() {
  const dark = isDarkMode();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw twinkling stars first
  stars.forEach(star => {
    star.opacity += star.twinkleSpeed * star.twinkleDirection;
    if (star.opacity >= star.maxOpacity) {
      star.opacity = star.maxOpacity;
      star.twinkleDirection = -1;
    }
    if (star.opacity <= star.minOpacity) {
      star.opacity = star.minOpacity;
      star.twinkleDirection = 1;
    }

    const alpha = dark ? star.opacity : star.opacity * 0.35;
    const color = dark ? `255,255,255` : `80,80,120`;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.radius * 3
    );
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  // Draw shooting stars
  shootingStars.forEach((shot, index) => {
    shot.x += Math.cos(shot.angle) * shot.speed;
    shot.y += Math.sin(shot.angle) * shot.speed;
    shot.opacity -= 0.018;

    if (shot.opacity <= 0) {
      shootingStars.splice(index, 1);
      return;
    }

    const tailX = shot.x - Math.cos(shot.angle) * shot.length;
    const tailY = shot.y - Math.sin(shot.angle) * shot.length;

    const gradient = ctx.createLinearGradient(tailX, tailY, shot.x, shot.y);
    const alpha = dark ? shot.opacity : shot.opacity * 0.5;
    gradient.addColorStop(0, `rgba(255,255,255,0)`);
    gradient.addColorStop(0.7, `rgba(200,220,255,${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(255,255,255,${alpha})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(shot.x, shot.y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = dark ? 1.5 : 1;
    ctx.lineCap = 'round';
    ctx.stroke();
  });

  animationId = requestAnimationFrame(drawShootingStars);
}

// ===== SHOOTING STAR SPAWNER (Version 4 only) =====
let shootingStarInterval;
function startShootingStarSpawner() {
  // Random interval between 2.5 and 6 seconds
  const randomDelay = Math.random() * 3500 + 2500;
  shootingStarInterval = setTimeout(() => {
    createShootingStar();
    // Occasionally spawn 2 at once
    if (Math.random() > 0.7) {
      setTimeout(createShootingStar, 300);
    }
    startShootingStarSpawner();
  }, randomDelay);
}

// ===== START ANIMATION =====
function startStars() {
  cancelAnimationFrame(animationId);
  clearTimeout(shootingStarInterval);
  resizeCanvas();
  createStars(180);

  if (STAR_VERSION === 1) {
    drawTwinkling();
  } else if (STAR_VERSION === 4) {
    drawShootingStars();
    startShootingStarSpawner();
  }
}

// ===== RESTART ON RESIZE =====
window.addEventListener('resize', () => {
  cancelAnimationFrame(animationId);
  startStars();
});

// ===== RESTART ON THEME CHANGE =====
// This watches for theme changes so stars adapt to light/dark mode
const themeObserver = new MutationObserver(() => {
  // No need to restart, the isDarkMode() check inside draw handles it live
});
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});

// ===== INIT =====
startStars();