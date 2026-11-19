// ---------- THOUGHTS (bottom left of the homepage) ----------
// Shows what's in Daniela's Are.na channel, stacked, newest on top.
// Post to the channel on Are.na and it shows up here (Are.na can take up to ~5 minutes to update).

(function () {

var ARENA_CHANNEL = "test-uzsjqfuqhc4";   // the channel's slug (the last part of its are.na link)
var SHOW_MAX      = 30;                 // how many thoughts to show
var CHECK_EVERY   = 120;                // seconds between checks for new posts

var box = document.getElementById("thoughts");
var lastIds = "";

function load() {
  fetch("https://api.are.na/v3/channels/" + ARENA_CHANNEL + "/contents?per=" + SHOW_MAX + "&sort=position_desc")
    .then(function (r) { return r.json(); })
    .then(function (res) {
      var items = (res.data || []);
      var ids = items.map(function (b) { return b.id; }).join(",");
      if (ids === lastIds) return;          // nothing new
      lastIds = ids;
      box.innerHTML = "";
      items.forEach(function (b) {
        var el = makeThought(b);
        if (el) box.appendChild(el);
      });
      box.hidden = !box.children.length;
    })
    .catch(function () { /* keep whatever is showing */ });
}

function imgUrl(b) {
  var i = b.image;
  if (!i) return null;
  return (i.medium && i.medium.src) || (i.large && i.large.src) || i.src ||
         (i.display && i.display.url) || (i.original && i.original.url) || null;
}

function dateText(b) {
  var d = new Date((b.connection && b.connection.connected_at) || b.created_at);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function makeThought(b) {
  var t = document.createElement("div");
  t.className = "thought";
  var body = document.createElement("div");
  body.className = "thought-body";
  var url = imgUrl(b);

  if (b.type === "Text") {
    body.innerHTML = (b.content && b.content.html) || "";
  } else if (b.type === "Attachment" && b.attachment && /^audio\//.test(b.attachment.content_type)) {
    if (b.title) body.appendChild(textDiv(b.title));
    body.appendChild(makePlayer(b.attachment.url));
  } else if (b.type === "Attachment" && b.attachment && /^video\//.test(b.attachment.content_type)) {
    var v = document.createElement("video");
    v.controls = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.src = b.attachment.url;
    body.appendChild(v);
  } else if (url) {
    var im = document.createElement("img");
    im.src = url;
    im.alt = b.title || "";
    im.loading = "lazy";
    body.appendChild(im);
    if (b.type === "Link" && b.source && b.source.url) {
      im.addEventListener("click", function () { window.open(b.source.url, "_blank", "noopener"); });
    }
    if (b.title && b.type === "Link") body.appendChild(textDiv(b.title));
  } else if (b.source && b.source.url) {
    var l = document.createElement("a");
    l.href = b.source.url;
    l.target = "_blank";
    l.rel = "noopener";
    l.textContent = b.title || b.source.url;
    body.appendChild(l);
  } else {
    return null;   // something we don't know how to show (e.g. a nested channel)
  }

  var when = document.createElement("div");
  when.className = "thought-when";
  when.textContent = dateText(b);
  t.appendChild(body);
  t.appendChild(when);
  return t;
}

// our own audio player, so it can look the way we want:
// a white rectangle with a black stroke — play/pause | progress bar | time
function makePlayer(src) {
  var a = new Audio();
  a.preload = "none";
  a.src = src;

  var box = document.createElement("div");
  box.className = "th-audio";
  box.innerHTML =
    '<button type="button" class="th-play">&#9654; Play</button>' +
    '<div class="th-bar"><div class="th-fill"></div></div>' +
    '<span class="th-time">0:00</span>';
  var btn  = box.querySelector(".th-play");
  var bar  = box.querySelector(".th-bar");
  var fill = box.querySelector(".th-fill");
  var time = box.querySelector(".th-time");

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function show() {
    fill.style.width = (a.duration ? (a.currentTime / a.duration) * 100 : 0) + "%";
    time.textContent = a.duration ? fmt(a.currentTime) + " / " + fmt(a.duration) : fmt(a.currentTime);
  }

  btn.addEventListener("click", function () {
    if (a.paused && window.peekaboo) window.peekaboo();      // pressing play on a song: the yellow guy pops up
    if (a.paused) {
      document.querySelectorAll(".th-audio").forEach(function (o) {   // only one plays at a time
        if (o !== box && o._audio && !o._audio.paused) o._audio.pause();
      });
      a.play();
    } else {
      a.pause();
    }
  });
  a.addEventListener("play",  function () {
    btn.innerHTML = "&#10074;&#10074; Pause";
    window.lastSound = function () { if (a.paused) a.play(); else a.pause(); };   // the space bar now controls this song
  });
  a.addEventListener("pause", function () { btn.innerHTML = "&#9654; Play"; });
  a.addEventListener("ended", function () {
    a.currentTime = 0; show();
    // the next song down in the Are.na box starts by itself
    var all = Array.prototype.slice.call(document.querySelectorAll("#thoughts .th-audio"));
    var next = all[all.indexOf(box) + 1];
    if (next) {
      next._audio.play();
      next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
  a.addEventListener("timeupdate", show);
  a.addEventListener("loadedmetadata", show);

  // click the bar to jump
  bar.addEventListener("click", function (e) {
    if (!a.duration) return;
    var r = bar.getBoundingClientRect();
    var f = (e.clientX - r.left) / r.width;
    a.currentTime = f * a.duration;
  });

  box._audio = a;
  return box;
}

// SPACE BAR: pauses / plays whatever song was played last (an Are.na song or the music box),
// wherever you've clicked on the page (except while typing in a box)
function typing(el) {
  return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}
window.addEventListener("keydown", function (e) {
  if (e.code !== "Space" && e.key !== " ") return;
  if (typing(e.target) || !window.lastSound) return;
  e.preventDefault();                     // no page scrolling, and a focused button isn't pressed too
  if (!e.repeat) window.lastSound();
}, true);
window.addEventListener("keyup", function (e) {
  if ((e.code === "Space" || e.key === " ") && !typing(e.target) && window.lastSound) e.preventDefault();
}, true);

function textDiv(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d;
}

load();
setInterval(load, CHECK_EVERY * 1000);

})();
