"use strict";

function initAmbient(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const workspace = canvas.dataset.ambient === "workspace";
  const hero = canvas.dataset.ambient === "hero";
  const area = hero ? canvas.parentElement : window;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const particles = Array.from({ length: hero || workspace ? 62 : 44 }, () => ({
    x: Math.random(),
    y: Math.random(),
    phase: Math.random() * Math.PI * 2,
    speed: 0.12 + Math.random() * 0.42,
    size: 0.55 + Math.random() * 1.5
  }));
  const pointer = { x: 0, y: 0 };
  const offset = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = true;

  function drawRibbon(time, color, origin, direction, amplitude) {
    const compact = width < 650;
    const left = width * (hero && !compact ? 0.33 : -0.12);
    const span = width * 1.14 - left;
    const gradient = context.createLinearGradient(left, 0, width, height);
    gradient.addColorStop(0, `rgba(${color},0)`);
    const intensity = hero ? 0.64 : workspace ? 0.4 : 0.22;
    gradient.addColorStop(hero ? 0.64 : 0.72, `rgba(${color},${intensity})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    context.strokeStyle = gradient;

    // Parallel curves form a sheet that folds and drifts as their phases change.
    for (let row = 0; row < 14; row++) {
      const layer = row / 13;
      context.lineWidth = row === 6 ? 1.6 : 0.72;
      context.beginPath();
      for (let point = 0; point <= 44; point++) {
        const position = point / 44;
        const envelope = Math.sin(Math.PI * position);
        const x = left + position * span + offset.x * 19;
        const y = height * (origin + direction * position)
          + Math.sin(position * 7.2 - time * 0.78 + layer * 1.05) * height * amplitude * envelope
          + (layer - 0.5) * height * 0.14 * envelope
          + offset.y * 15;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
  }

  function drawOrbit(time) {
    const compact = width < 650;
    const centerX = width * (compact ? 0.89 : 0.76) + offset.x * 23;
    const centerY = height * (compact ? 0.51 : 0.45) + offset.y * 18;
    const radius = Math.min(width * (compact ? 0.31 : 0.156), height * 0.48);
    const tilt = -0.36;
    context.lineWidth = 0.8;

    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = radius * (0.74 + ring * 0.144);
      context.strokeStyle = `rgba(151,224,255,${0.21 - ring * 0.04})`;
      context.beginPath();
      context.ellipse(centerX, centerY, ringRadius, ringRadius * 0.56, tilt, 0, Math.PI * 2);
      context.stroke();

      const angle = time * (0.35 + ring * 0.09) + ring * 2.25;
      const localX = Math.cos(angle) * ringRadius;
      const localY = Math.sin(angle) * ringRadius * 0.56;
      const x = centerX + localX * Math.cos(tilt) - localY * Math.sin(tilt);
      const y = centerY + localX * Math.sin(tilt) + localY * Math.cos(tilt);
      const glow = context.createRadialGradient(x, y, 0, x, y, 13);
      glow.addColorStop(0, "rgba(202,245,255,0.86)");
      glow.addColorStop(0.22, "rgba(122,218,255,0.45)");
      glow.addColorStop(1, "rgba(122,218,255,0)");
      context.fillStyle = glow;
      context.fillRect(x - 13, y - 13, 26, 26);
      context.fillStyle = "#eafaff";
      context.beginPath();
      context.arc(x, y, 1.75, 0, Math.PI * 2);
      context.fill();
    }
  }

  function paint(time) {
    context.clearRect(0, 0, width, height);
    drawRibbon(time, "91,222,255", hero ? 0.88 : 1.03, workspace ? -0.64 : -0.34, 0.19);
    drawRibbon(time + 2.6, "174,143,255", hero ? 0.98 : 0.28, workspace ? 0.38 : -0.24, 0.13);
    if (hero) drawOrbit(time);

    for (const particle of particles) {
      const x = (particle.x + time * particle.speed * 0.007) % 1 * width;
      const y = ((particle.y - time * particle.speed * 0.013) % 1 + 1) % 1 * height;
      const pulse = 0.55 + 0.45 * Math.sin(time * 0.8 + particle.phase);
      const alpha = pulse * (hero && x > width * 0.45 ? 0.8 : workspace ? 0.6 : 0.32);
      context.fillStyle = `rgba(194,235,255,${alpha})`;
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
  }

  function tick(timestamp) {
    offset.x += (pointer.x - offset.x) * 0.045;
    offset.y += (pointer.y - offset.y) * 0.045;
    paint(timestamp / 1000);
    frame = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !reducedMotion.matches && !document.hidden) {
      frame = requestAnimationFrame(tick);
    } else if (visible && reducedMotion.matches) {
      pointer.x = pointer.y = offset.x = offset.y = 0;
      paint(0);
    }
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    updatePlayback();
  }

  area.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    pointer.x = 2 * (event.clientX - box.left) / box.width - 1;
    pointer.y = 2 * (event.clientY - box.top) / box.height - 1;
  }, { passive: true });
  area.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = 0;
  });

  new ResizeObserver(resize).observe(canvas);
  const region = hero ? canvas.parentElement : workspace ? document.querySelector(".workspace") : null;
  if (region) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }).observe(region);
  }
  document.addEventListener("visibilitychange", updatePlayback);
  reducedMotion.addEventListener("change", updatePlayback);
  resize();
}

document.querySelectorAll("[data-ambient]").forEach(initAmbient);
