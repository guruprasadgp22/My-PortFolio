// The batting game on the 404 page (its own file, so the Content-Security-Policy can forbid inline scripts).
(function () {
  var cv = document.getElementById("cv"), ctx = cv.getContext("2d");
  var W = cv.width, H = cv.height, d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * d; cv.height = H * d; ctx.scale(d, d);
  var css = getComputedStyle(document.documentElement);
  var col = function (n) { return css.getPropertyValue(n).trim(); };
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var best = 0; try { best = +localStorage.getItem("cricket-best") || 0; } catch (e) {}
  $("best").textContent = best;

  var BAT_X = 90, GROUND = H - 40;
  var ball, swing = 0, runs = 0, balls = 0, state = "wait", callTimer, nextTimer;

  function bowl() {
    var speed = 3.6 + Math.random() * 2.2 + balls * 0.25;
    ball = { x: W - 30, y: GROUND - 70, vx: -speed, vy: 0.4 + Math.random() * 0.5, hit: false, done: false };
    state = "bowling";
  }
  function call(text, color) {
    var c = $("call"); c.textContent = text; c.style.color = color; c.classList.add("on");
    clearTimeout(callTimer); callTimer = setTimeout(function () { c.classList.remove("on"); }, 900);
  }
  function endBall(r, text, color) {
    ball.done = true; balls++; runs += r;
    $("runs").textContent = runs; $("balls").textContent = balls;
    call(text, color);
    if (balls >= 6) {
      if (runs > best) { best = runs; try { localStorage.setItem("cricket-best", best); } catch (e) {} $("best").textContent = best; }
      state = "over";
      nextTimer = setTimeout(function () { call(runs + " off the over! Tap to go again", col("--fg")); }, 1000);
    } else nextTimer = setTimeout(bowl, 1100);
  }
  function hitSwing() {
    if (state === "over") { runs = 0; balls = 0; $("runs").textContent = 0; $("balls").textContent = 0; bowl(); return; }
    if (state === "wait") { bowl(); return; }
    if (swing > 0 || !ball || ball.done || ball.hit) return;
    swing = 1;
    var dx = ball.x - BAT_X;
    if (dx > -8 && dx < 34) {
      // timing decides the shot: dead centre is a six
      var q = Math.abs(dx - 12);
      var r = q < 6 ? 6 : q < 13 ? 4 : q < 19 ? 2 : 1;
      ball.hit = true; ball.vx = 6 + r * 1.1; ball.vy = -(2 + r * 0.9);
      endBall(r, r === 6 ? "SIX!" : r === 4 ? "FOUR!" : r + (r === 1 ? " run" : " runs"), r >= 4 ? col("--ok") : col("--ember-2"));
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = col("--pitch"); ctx.fillRect(0, GROUND - 6, W, 46);
    ctx.fillStyle = col("--crease"); ctx.fillRect(BAT_X + 30, GROUND - 6, 3, 46); ctx.fillRect(W - 60, GROUND - 6, 3, 46);
    // stumps
    ctx.fillStyle = col("--crease");
    for (var i = 0; i < 3; i++) ctx.fillRect(BAT_X - 34 + i * 7, GROUND - 58, 4, 52);
    ctx.fillRect(BAT_X - 35, GROUND - 60, 22, 3);
    // batter's bat, rotating on a swing
    ctx.save(); ctx.translate(BAT_X, GROUND - 40);
    ctx.rotate(-0.9 + (swing > 0 ? Math.sin(swing * Math.PI) * 1.9 : 0));
    ctx.fillStyle = col("--ember-2"); ctx.fillRect(-4, 0, 9, 50);
    ctx.fillStyle = col("--mute"); ctx.fillRect(-2, -16, 5, 18);
    ctx.restore();
    if (ball && !(ball.done && !ball.hit && ball.x < -10)) {
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, 7); ctx.fillStyle = "#c8102e"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0.3, 2.8); ctx.stroke();
    }
    if (state === "wait") {
      ctx.fillStyle = col("--mute"); ctx.font = "600 14px system-ui,sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Tap or press Space to face the first ball", W / 2, 40);
    }
  }
  function step() {
    if (swing > 0) { swing += 0.12; if (swing >= 1) swing = 0; }
    if (ball && state === "bowling") {
      ball.x += ball.vx; ball.y += ball.vy;
      if (!ball.hit && ball.y > GROUND - 14) { ball.y = GROUND - 14; ball.vy = -ball.vy * 0.55; } // pitches, then bounces
      if (ball.hit) ball.vy += 0.12;
      if (!ball.hit && !ball.done && ball.x < BAT_X - 30) endBall(0, "OUT! Bowled", col("--ember"));
    }
    draw();
    requestAnimationFrame(step);
  }
  addEventListener("keydown", function (e) { if (e.code === "Space" || e.key === " ") { e.preventDefault(); hitSwing(); } });
  $("game").addEventListener("pointerdown", function (e) { e.preventDefault(); hitSwing(); });
  if (still) { draw(); $("game").style.display = "none"; document.querySelector(".hint").style.display = "none"; }
  else requestAnimationFrame(step);
})();
