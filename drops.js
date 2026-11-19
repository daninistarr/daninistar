// ---------- DROP PILE (bottom right) ----------
// Visitors pick an emoji: click it and it falls onto the pile in the corner,
// or drag it into the box and let go to put it exactly there.
// The pile is shared: everyone sees everyone's drops (kept in Daniela's Firebase database).
// To clear the pile: Firebase console > Realtime Database > Data > delete "drops".

(function () {

var DATABASE    = "https://website-dde02-default-rtdb.firebaseio.com";
var EMOJIS      = ["🌹","🍀","☔","💘","😊","😻","💅","🫦","💋","👋","🧢","❤️","💔","⭐","🩷","☘️","😈","👀","🌷","🤔","👍","😭","😩","😹","🫂","👩‍💻","🧑‍💻","👠","🩴","🦋","🐬","🐆","🐅","🦓","🦭","🪨","🪺","🪷","❄️","🍒","🥭","🍓","🎱","🤸‍♀️","🎼","🎨","🎬","🗿","🌋","🧼","🎈","💌","🤍"];  // don't reorder: drops are saved by their number in this list
var PILE_MAX    = 200;   // when the pile reaches this many, it clears and starts over (change here)
var CHECK_EVERY = 15;    // seconds between checks for other people's drops
var WAIT        = 1;     // seconds a visitor waits between drops
var SIZE        = 26;    // emoji size in px on computers

var box     = document.getElementById("drops");
var pile    = document.getElementById("drops-pile");
var btn     = document.getElementById("drops-btn");
var picker  = document.getElementById("drops-picker");
var choices = document.getElementById("drops-choices");

var shown   = {};        // drop id -> element on the pile
var order   = [];        // drop ids, oldest first
var slots   = [];        // where things can land, nearest the corner first
var lastDrop = 0;

// ---- the emoji choices ----
EMOJIS.forEach(function (e, k) {
  var b = document.createElement("button");
  b.type = "button";
  b.textContent = e;
  b.setAttribute("aria-label", "Drop " + e);
  b.addEventListener("pointerdown", function (ev) { startDrag(ev, k, b); });
  b.addEventListener("click", function (ev) {
    if (justDragged) { justDragged = false; return; }   // that was a drag, not a click
    drop(k);                                              // a plain click: it falls onto the pile
  });
  choices.appendChild(b);
});

// ---- the letter bear: pops up above the emoji corner once this visitor has left 3 emojis ----
var LETTER_AFTER = 3;      // how many emojis before he shows up (change here)
var LETTER_STAYS = 20;     // seconds he stays (change here)
var myDrops = 0;
var letter = document.getElementById("letter-bear");
function placeLetter() {
  letter.style.bottom = (box.offsetHeight + 4) + "px";    // sits just above the corner where the emojis land
}
letter.addEventListener("click", function () { letter.classList.toggle("is-open"); });   // phones: tap to open / close
function showLetterBear() { letter.classList.remove("is-open");
  placeLetter();
  letter.hidden = false;
  setTimeout(function () { letter.hidden = true; }, LETTER_STAYS * 1000);
}

function setPicker(open) {
  picker.hidden = !open;
  btn.classList.toggle("is-open", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (!letter.hidden) placeLetter();
}
btn.addEventListener("click", function () { setPicker(picker.hidden); });

// click anywhere else and the emoji box closes (no need to click Say Hi! again)
document.addEventListener("click", function (e) {
  if (picker.hidden || justDragged || dragging) return;
  if (e.target.closest(".drops-picker, .drops-btn")) return;
  setPicker(false);
});

// ---- DRAG an emoji from the choices into the box to put it exactly there ----
var dragging = null, justDragged = false;

function startDrag(ev, k, from) {
  if (ev.button !== undefined && ev.button !== 0) return;
  var ghost = document.createElement("span");
  ghost.className = "drop-ghost";
  ghost.textContent = EMOJIS[k];
  ghost.style.fontSize = sizeNow() + "px";
  dragging = { k: k, ghost: ghost, x0: ev.clientX, y0: ev.clientY, moved: false, from: from };
  try { from.setPointerCapture(ev.pointerId); } catch (e) {}
  ev.preventDefault();
}

document.addEventListener("pointermove", function (ev) {
  if (!dragging) return;
  if (!dragging.moved && Math.abs(ev.clientX - dragging.x0) + Math.abs(ev.clientY - dragging.y0) < 6) return;
  if (!dragging.moved) {
    dragging.moved = true;
    document.body.appendChild(dragging.ghost);
    pile.classList.add("is-target");
    box.classList.add("is-dragging");           // the emoji box fades away so the whole corner is free
  }
  var s = sizeNow();
  dragging.ghost.style.left = (ev.clientX - s / 2) + "px";
  dragging.ghost.style.top  = (ev.clientY - s / 2) + "px";
  // remember the last moments of movement, to know how hard it was thrown
  var now = performance.now();
  dragging.trail = (dragging.trail || []).filter(function (p) { return now - p.t < 90; });
  dragging.trail.push({ t: now, x: ev.clientX, y: ev.clientY });
});

document.addEventListener("pointerup", function (ev) {
  if (!dragging) return;
  var d = dragging;
  dragging = null;
  pile.classList.remove("is-target");
  box.classList.remove("is-dragging");
  if (!d.moved) return;                         // no drag: the click handler drops it instead
  justDragged = true;
  setTimeout(function () { justDragged = false; }, 50);
  if (clearing || Date.now() - lastDrop < WAIT * 1000) { d.ghost.remove(); return; }

  // how fast was it moving when let go? (px per second)
  var tr = d.trail || [], vx = 0, vy = 0;
  if (tr.length > 1) {
    var p0 = tr[0], p1 = tr[tr.length - 1], dt = Math.max(16, p1.t - p0.t);
    vx = (p1.x - p0.x) / dt * 1000;
    vy = (p1.y - p0.y) / dt * 1000;
  }
  var speed = Math.sqrt(vx * vx + vy * vy);

  if (speed > THROW_SPEED) { throwIt(d.k, d.ghost, ev.clientX, ev.clientY, vx, vy); return; }

  // a gentle let-go
  d.ghost.remove();
  var r = pile.getBoundingClientRect();
  var s = sizeNow();
  var inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  if (!inside) { drop(d.k); return; }           // let go outside the box: it falls onto the pile
  var fx = Math.min(1, Math.max(0, (ev.clientX - r.left - s / 2) / (r.width  - s)));
  var fy = Math.min(1, Math.max(0, (ev.clientY - r.top  - s / 2) / (r.height - s)));
  drop(d.k, fx, fy);                            // inside the box: it stays right where it was let go
});

// ---- THROW: a fast flick sends it flying; it falls, bounces off the walls + floor of the corner, and settles ----
var THROW_SPEED = 900;     // px/second: faster than this counts as a throw (change here)
var GRAVITY     = 2600;    // px/second² (change here)

function throwIt(k, ghost, x, y, vx, vy) {
  var r = pile.getBoundingClientRect();
  var s = sizeNow();
  var cap = 2600;                               // don't let it go flying off forever
  vx = Math.max(-cap, Math.min(cap, vx));
  vy = Math.max(-cap, Math.min(cap, vy));
  x -= s / 2; y -= s / 2;                       // top-left corner of the emoji
  var floor = r.bottom - s, left = r.left, right = r.right - s;
  var bounces = 0, last = performance.now(), started = last;
  dropping = true;

  function step(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    vy += GRAVITY * dt;
    x += vx * dt;
    y += vy * dt;
    // walls of the corner (only once it's come down into it)
    if (y > r.top - s) {
      if (x < left)  { x = left;  vx = Math.abs(vx) * 0.5; }
      if (x > right) { x = right; vx = -Math.abs(vx) * 0.5; }
    }
    // the floor: bounce, then settle
    if (y >= floor) {
      y = floor;
      if (Math.abs(vy) > 300 && bounces < 2) { vy = -vy * 0.35; vx *= 0.6; bounces++; }
      else { vy = 0; vx *= 0.8; }
    }
    ghost.style.left = x + "px";
    ghost.style.top  = y + "px";
    var settled = y >= floor && vy === 0 && Math.abs(vx) < 40;
    if (!settled && now - started < 3000) { requestAnimationFrame(step); return; }
    // landed: save where it ended up
    ghost.remove();
    dropping = false;
    x = Math.max(left, Math.min(right, x));
    var fx = (x - r.left) / (r.width  - s);
    var fy = (Math.min(floor, Math.max(r.top, y)) - r.top) / (r.height - s);
    drop(k, Math.min(1, Math.max(0, fx)), Math.min(1, Math.max(0, fy)));
  }
  requestAnimationFrame(step);
}
var dropping = false;

document.addEventListener("pointercancel", function () {
  if (!dragging) return;
  if (dragging.ghost.parentNode) dragging.ghost.remove();
  pile.classList.remove("is-target");
  box.classList.remove("is-dragging");
  dragging = null;
});

// ---- where things land: a mound that grows out from the corner ----
function rand(seed) {                          // the same "random" every time for a given number
  var x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function makeSlots() {
  var W = pile.clientWidth, H = pile.clientHeight;
  var s = sizeNow();
  var bw = btn.offsetWidth + 6, bh = btn.offsetHeight + 6;       // keep clear of the button
  var list = [];
  var stepX = s * 0.78, stepY = s * 0.68;
  for (var r = 0; r * stepY < H - s * 0.6; r++) {
    for (var c = 0; c * stepX < W - s * 0.6; c++) {
      var n = r * 1000 + c;
      var x = c * stepX + (r % 2 ? stepX / 2 : 0) + (rand(n) - 0.5) * s * 0.35;   // distance from the right edge
      var y = r * stepY + (rand(n + 7) - 0.5) * s * 0.3;                          // distance from the bottom
      if (x < 0 || y < 0 || x > W - s || y > H - s) continue;
      if (x < bw && y < bh) continue;                                              // under the button
      var d = Math.sqrt((x / W) * (x / W) + (y / H) * (y / H)) + rand(n + 3) * 0.06;
      list.push({ x: x, y: y, d: d, rot: (rand(n + 11) - 0.5) * 50 });
    }
  }
  list.sort(function (a, b) { return a.d - b.d; });
  return list;
}

function sizeNow() {
  return window.matchMedia("(max-width: 700px)").matches ? 22 : SIZE;
}

function place(el, slot) {
  if (el._fx !== undefined) {                   // put exactly where someone dragged it
    var s = sizeNow();
    el.style.right  = "auto";
    el.style.bottom = "auto";
    el.style.left   = (el._fx * (pile.clientWidth  - s)) + "px";
    el.style.top    = (el._fy * (pile.clientHeight - s)) + "px";
    el.style.setProperty("--rot", ((el._fx * 97 + el._fy * 31) % 1 - 0.5) * 40 + "deg");
    return;
  }
  el.style.right  = slot.x + "px";
  el.style.bottom = slot.y + "px";
  el.style.setProperty("--rot", slot.rot + "deg");
}

function layout() {
  slots = makeSlots();
  order.forEach(function (id, k) {
    var el = shown[id];
    if (!slots[k] && el._fx === undefined) { el.hidden = true; return; }
    el.hidden = false;
    place(el, slots[k]);
  });
}

// ---- show a drop on the pile (falling in if it's new) ----
function addToPile(id, e, falling, fx, fy, plop) {
  if (shown[id] || EMOJIS[e] === undefined) return;
  var el = document.createElement("span");
  el.className = "drop";
  el.textContent = EMOJIS[e];
  el.style.fontSize = sizeNow() + "px";
  if (typeof fx === "number" && typeof fy === "number") { el._fx = fx; el._fy = fy; }
  pile.appendChild(el);
  shown[id] = el;
  order.push(id);
  var slot = slots[order.length - 1];
  if (slot || el._fx !== undefined) place(el, slot); else el.hidden = true;
  var anim = plop ? "is-plop" : (falling ? "is-falling" : "");
  if (anim) {
    el.classList.add(anim);
    el.addEventListener("animationend", function () { el.classList.remove(anim); }, { once: true });
  }
}

// ---- the pile is full: it fades away and starts over ----
var clearing = false;
function clearPile(later) {
  clearing = true;
  setTimeout(function () {
    pile.classList.add("is-clearing");
    setTimeout(function () {
      pile.innerHTML = "";
      pile.classList.remove("is-clearing");
      shown = {};
      order = [];
      clearing = false;
    }, 600);
  }, later || 0);
}

// ---- load the pile, and check for new drops now and then ----
// The pile shows only the drops since it last cleared (every PILE_MAX drops).
function load(first) {
  Promise.all([
    fetch(DATABASE + "/drops.json?shallow=true").then(function (r) { return r.json(); }),
    fetch(DATABASE + '/drops.json?orderBy="$key"&limitToLast=' + PILE_MAX).then(function (r) { return r.json(); })
  ]).then(function (res) {
    if (clearing) return;
    var all = res[0] && typeof res[0] === "object" ? Object.keys(res[0]).sort() : [];
    var data = res[1] && typeof res[1] === "object" ? res[1] : {};
    var round = all.slice(all.length - (all.length % PILE_MAX));   // drops since the last clear
    // a new round started since we last looked: clear what's showing first
    var stillHere = order.filter(function (id) { return round.indexOf(id) !== -1 || id.indexOf("tmp") === 0; });
    if (order.length && stillHere.length < order.length) {
      if (!round.length) { clearPile(); return; }
      pile.innerHTML = ""; shown = {}; order = [];
    }
    round.forEach(function (id) {
      if (data[id]) addToPile(id, data[id].e, !first, data[id].x, data[id].y);
    });
  }).catch(function () { /* keep what's showing */ });
}

// ---- drop one ----
function drop(k, fx, fy) {
  var now = Date.now();
  if (clearing || now - lastDrop < WAIT * 1000) return;
  lastDrop = now;
  myDrops++;
  if (myDrops === LETTER_AFTER) showLetterBear();
  if (myDrops === 10 && window.showLeopard) window.showLeopard();   // 10 emojis: the leopard comes to say thanks
  var temp = "tmp" + now;
  var placed = typeof fx === "number";
  addToPile(temp, k, !placed, fx, fy);         // show it right away (dragged ones appear right where you let go)
  if (order.length >= PILE_MAX) clearPile(1600); // that was the last one: let it land, then start over
  fetch(DATABASE + "/drops.json", {
    method: "POST",
    body: JSON.stringify(placed
      ? { e: k, x: Math.round(fx * 1000) / 1000, y: Math.round(fy * 1000) / 1000, t: { ".sv": "timestamp" } }
      : { e: k, t: { ".sv": "timestamp" } })
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.name && shown[temp]) {     // swap the temporary id for the real one
        shown[res.name] = shown[temp];
        delete shown[temp];
        order[order.indexOf(temp)] = res.name;
      }
    })
    .catch(function () {});
}

slots = makeSlots();
load(true);
setInterval(function () {
  if (Date.now() - lastDrop > 4000) load(false);   // not right after your own drop (so it isn't counted twice)
}, CHECK_EVERY * 1000);
window.addEventListener("resize", layout);

})();
