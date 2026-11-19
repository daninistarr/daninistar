// ---------- MAKE A WISH ----------
// After someone opens 3 different works, a shooting star flies in from the right
// edge, over everything, and across to the left, with a message under it.
// The star is solid; the tail behind it is drawn as a DITHER: a fixed grid of square dots,
// and the soft shapes slide across it, so the dots blink on and off as it moves.
// It happens once each time the page is loaded.

(function () {

var WORKS_NEEDED = 3;      // how many different works before the star appears (change here)
var DELAY        = 1200;   // wait this long (ms) after the 3rd one opens
var DURATION     = 16000;   // how long it takes to cross the screen (ms) — higher = slower (change here)
var DOT          = 3;      // size of each dither dot in px (change here)
var STAR         = 40;     // star radius in px (the star itself is the crisp one in the page)
var TRAIL        = 300;    // tail length in px
var COLOR        = [255, 105, 190];   // dot color (red, green, blue) — the Work pink #ff69be

var wish   = document.getElementById("wish");
var canvas = document.getElementById("wish-canvas");
var text   = document.getElementById("wish-text");
var star   = document.getElementById("wish-star");
var seen = {}, count = 0, done = false, running = false;

// 8x8 ordered-dither pattern (the same one old printers + the gif use)
var BAYER = [
   0,32, 8,40, 2,34,10,42,
  48,16,56,24,50,18,58,26,
  12,44, 4,36,14,46, 6,38,
  60,28,52,20,62,30,54,22,
   3,35,11,43, 1,33, 9,41,
  51,19,59,27,49,17,57,25,
  15,47, 7,39,13,45, 5,37,
  63,31,55,23,61,29,53,21
];

var buf = document.createElement("canvas");   // soft shapes are drawn here first, small
var bctx = buf.getContext("2d", { willReadFrequently: true });
var ctx  = canvas.getContext("2d");

function starPath(c, cx, cy, R, r) {
  c.beginPath();
  for (var p = 0; p < 10; p++) {
    var a = -Math.PI / 2 + p * Math.PI / 5;
    var rad = p % 2 === 0 ? R : r;
    c.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  c.closePath();
}

function blob(c, x, y, r, alpha) {
  var g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, "rgba(0,0,0," + alpha + ")");
  g.addColorStop(0.45, "rgba(0,0,0," + alpha * 0.6 + ")");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

// the wish-granted rainbow: pink, yellow, aqua, green, purple, back to pink (change here)
var RAINBOW = [[255, 28, 172], [247, 255, 28], [5, 242, 230], [55, 255, 0], [153, 0, 255], [255, 28, 172]];
var RAINBOW_WIDTH = 360;   // px for one full rainbow across the trail
function rainbow(u) {
  u = ((u % 1) + 1) % 1 * (RAINBOW.length - 1);
  var k = Math.floor(u), f = u - k, a = RAINBOW[k], b = RAINBOW[k + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

// draw one frame: star at (sx, sy) in screen px, time t in seconds
function draw(sx, sy, t) {
  var W = buf.width, H = buf.height;
  var x = sx / DOT, y = sy / DOT, s = STAR / DOT, L = TRAIL / DOT;
  bctx.clearRect(0, 0, W, H);

  // the tail: soft blobs getting smaller + fainter, wobbling a little
  for (var k = 0; k <= 22; k++) {
    var f = k / 22;
    var bx = x + s * 0.7 + f * L;
    var by = y + Math.sin(t * 3 + k * 0.7) * (1.5 + f * 3);
    var br = s * (1.1 - f * 0.75) * (1 + 0.12 * Math.sin(t * 5 + k));
    blob(bctx, bx, by, br, 0.6 * Math.pow(1 - f, 1.3));
  }

  // dither: each dot is on if the shape is darker there than the pattern says
  var img = bctx.getImageData(0, 0, W, H);
  var d = img.data;
  for (var py = 0; py < H; py++) {
    for (var px = 0; px < W; px++) {
      var i = (py * W + px) * 4;
      var on = d[i + 3] > (BAYER[(py & 7) * 8 + (px & 7)] + 0.5) * 4;   // 0-255 vs pattern
      if (granted && on) {                      // wish granted: the dots go rainbow
        var c = rainbow(px * DOT / RAINBOW_WIDTH - t / 7);
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
      } else {
        d[i] = COLOR[0]; d[i + 1] = COLOR[1]; d[i + 2] = COLOR[2];
      }
      d[i + 3] = on ? 255 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function fly() {
  if (done || running) return;
  done = true;
  running = true;
  caughtUntil = null;
  hovering = false;
  onScreen = false;
  text.textContent = flights === 0 ? MESSAGE : AGAIN;
  flights++;
  wish.classList.remove("is-granted");

  var stage = document.querySelector(".stage");
  var music = document.getElementById("now-playing");
  star.style.transform = text.style.transform = "translate(-9999px,0)";   // off screen until it starts moving
  wish.hidden = false;
  var W = stage.clientWidth, H = wish.clientHeight;
  canvas.width = buf.width = Math.ceil(W / DOT);
  canvas.height = buf.height = Math.ceil(H / DOT);

  // the height it flies at: the middle of the music box, so it starts hidden behind it
  var y = 60;
  if (!music.hidden && getComputedStyle(music).position === "absolute") {
    y = Math.max(STAR * 2, music.offsetHeight / 2);
  }
  var fromX = W + STAR * 2;                 // just past the right edge
  var toX   = -(TRAIL + text.offsetWidth);  // fully off the left edge, message too
  var start = null;
  var pausedFor = 0, pauseStart = null;

  function frame(now) {
    if (start === null) start = now;
    // hold still while the mouse is on it, and for a moment after it's clicked ("caught!")
    var holding = hovering || (caughtUntil !== null && now < caughtUntil);
    if (holding) {
      if (pauseStart === null) pauseStart = now;
      draw(lastX, y, now / 1000);                // the trail keeps fizzing while it waits
      if (granted) text.style.transform = "translate(" + Math.round(lastX - text.offsetWidth / 2) + "px," + Math.round(y + STAR * 1.6) + "px)";
      requestAnimationFrame(frame);
      return;
    }
    if (pauseStart !== null) { pausedFor += now - pauseStart; pauseStart = null; }
    var p = Math.min(1, (now - start - pausedFor) / DURATION);
    var sx = fromX + (toX - fromX) * p;
    lastX = sx;
    onScreen = sx < W - 20;                       // out from behind the right edge
    draw(sx, y, now / 1000);
    star.style.transform = "translate(" + Math.round(sx - 45) + "px," + Math.round(y - 45) + "px)";
    var tx = granted ? sx - text.offsetWidth / 2 : sx - STAR;   // "Wish granted!" sits centered under the star
    text.style.transform = "translate(" + Math.round(tx) + "px," + Math.round(y + STAR * 1.6) + "px)";
    if (p < 1) requestAnimationFrame(frame);
    else { wish.hidden = true; running = false; }
  }
  requestAnimationFrame(frame);
}

// hover over (or click / tap) the star or the message: the wish is granted
var MESSAGE = "Thanks for visiting! Now you can make a wish :)";
var AGAIN   = "You still haven\u2019t made your wish. Click on me!";   // when it comes back
var GRANTED = "Wish granted!";
var granted = false;
var flights = 0;          // how many times it has flown by
function grant() {
  if (granted || !running || !onScreen) return;
  granted = true;
  text.textContent = GRANTED;
  wish.classList.add("is-granted");
}

// not granted yet? it comes back after the visitor clicks on any 3 more things
var AGAIN_AFTER = 3;      // (change here)
var clicksSince = 0;
document.addEventListener("click", function (e) {
  if (granted || running || flights === 0) return;
  clicksSince++;                                           // any click anywhere counts
  if (clicksSince >= AGAIN_AFTER) { clicksSince = 0; done = false; setTimeout(fly, 300); }
}, true);
// the star moves under a still mouse too, so check where the mouse is every frame
var mouse = { x: -1, y: -1 };
document.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
function underMouse() {
  if (mouse.x < 0) return false;
  var el = document.elementFromPoint(mouse.x, mouse.y);   // what's really under the mouse
  return !!el && (star.contains(el) || text.contains(el));
}
var onScreen = false;
var PAUSE = 1400;          // how long it holds still when caught (ms) (change here)
var caughtUntil = null, lastX = 0, hovering = false;
[star, text].forEach(function (el) {
  el.addEventListener("mousemove", function () {   // the visitor moves their mouse onto it (a still mouse it flies under doesn't count)
    if (!running || !onScreen) return;
    hovering = true;
    grant();
  });
  el.addEventListener("mouseleave", function () { hovering = false; });
  el.addEventListener("click", function (e) {
    e.stopPropagation();
    grant();
    if (running) caughtUntil = performance.now() + PAUSE;   // caught! hold still a moment
  });
});

window.countWork = function (title) {
  if (done || seen[title]) return;
  seen[title] = true;
  count++;
  if (count >= WORKS_NEEDED) setTimeout(fly, DELAY);
};

window.makeAWish = function () { done = false; granted = false; fly(); };   // for testing: type makeAWish() in the browser console

})();
