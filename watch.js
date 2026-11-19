// ---------- WATCH (top left, next to Work) ----------
// A little TV: click "Watch" and a box drops down with a vertical video feed —
// one video at a time, scroll (or swipe) inside the box for the next one.
// It plays the iPhone Notes and TikTok Drafts from work-data.js, shuffled each visit.

(function () {

var SHOW = ["iPhone Notes", "TikTok Drafts"];   // which works' videos go in the feed (change here)

var nav    = document.getElementById("watch");
var btn    = document.getElementById("watch-btn");
var box    = document.getElementById("watch-box");
var feed   = document.getElementById("watch-feed");
var label  = document.getElementById("watch-label");
var sound  = document.getElementById("watch-sound");
var workBtn  = document.getElementById("work-menu-btn");
var workList = document.getElementById("work-menu-list");

// ---- gather the videos ----
var items = [];
projects.forEach(function (p) {
  if (SHOW.indexOf(p.title) === -1 || !p.videos) return;
  p.videos.forEach(function (v, k) {
    if (typeof v === "string") v = { src: v };
    items.push({ src: v.src, poster: v.poster || (p.images && p.images[0]) || "", title: p.title, year: p.year, n: k + 1 });
  });
});
for (var i = items.length - 1; i > 0; i--) {     // shuffle
  var j = Math.floor(Math.random() * (i + 1)), t = items[i]; items[i] = items[j]; items[j] = t;
}

var built = false, muted = false, current = -1, videos = [];

function build() {
  built = true;
  items.forEach(function (it, k) {
    var slide = document.createElement("div");
    slide.className = "watch-slide";
    var v = document.createElement("video");
    v.src = it.src;
    if (it.poster && /\.jpe?g$/i.test(it.poster) && it.title === "iPhone Notes") v.poster = it.poster;
    v.loop = true;
    v.playsInline = true;
    v.preload = k < 2 ? "auto" : "none";
    v.addEventListener("click", function () { if (v.paused) v.play(); else v.pause(); });   // tap to pause
    slide.appendChild(v);
    feed.appendChild(slide);
    videos.push(v);
  });
  // play whichever video is showing in the box, pause the rest
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var k = Array.prototype.indexOf.call(feed.children, en.target);
      if (en.isIntersecting) setCurrent(k);
    });
  }, { root: feed, threshold: 0.6 });
  Array.prototype.forEach.call(feed.children, function (s) { io.observe(s); });
}

function setCurrent(k) {
  if (k === current) return;
  current = k;
  videos.forEach(function (v, j) { if (j !== k) v.pause(); });
  var it = items[k];
  label.textContent = it.title + " #" + it.n;                  // e.g. "iPhone Notes #3" (no year)
  if (videos[k + 1]) videos[k + 1].preload = "auto";          // get the next one ready
  play(videos[k]);
}

function play(v) {
  v.muted = muted;
  var p = v.play();
  if (p && p.catch) p.catch(function () {                      // the browser blocked sound: play silently instead
    muted = true; showSound(); v.muted = true; v.play();
  });
}

// hearts: back / next video (it loops around at the ends)
function go(d) {
  if (!videos.length) return;
  var k = (current + d + videos.length) % videos.length;
  feed.scrollTo({ top: k * feed.clientHeight, behavior: Math.abs(k - current) > 1 ? "auto" : "smooth" });
  setCurrent(k);
}
document.getElementById("watch-prev").addEventListener("click", function () { go(-1); });
document.getElementById("watch-next").addEventListener("click", function () { go(1); });

function showSound() { sound.textContent = muted ? "Sound: Off" : "Sound: On"; }
sound.addEventListener("click", function () {
  muted = !muted;
  showSound();
  if (videos[current]) { videos[current].muted = muted; if (videos[current].paused) videos[current].play(); }
});

function open() {
  if (!built) build();
  box.hidden = false;
  btn.classList.add("is-open");
  if (!workList.hidden) {                                     // only one dropdown at a time (any open work stays open)
    workList.hidden = true;
    workBtn.classList.remove("is-open");
    workBtn.setAttribute("aria-expanded", "false");
  }
  // a different, random video every time Watch is opened
  var k = Math.floor(Math.random() * videos.length);
  if (videos.length > 1 && k === current) k = (k + 1) % videos.length;
  feed.scrollTop = k * feed.clientHeight;
  setCurrent(k);
}
function close() {
  box.hidden = true;
  btn.classList.remove("is-open");
  videos.forEach(function (v) { v.pause(); });
}
btn.addEventListener("click", function () { if (box.hidden) open(); else close(); });
workBtn.addEventListener("click", function () { if (!box.hidden) close(); });   // opening Work closes Watch
// click any empty spot on the page to close Watch
document.addEventListener("click", function (e) {
  if (box.hidden) return;
  if (e.target.closest("#watch, #viewer, #zoom, #wish, #drops, #peek, #letter-bear, #bear-note, #elevens, #now-playing, #np-recent, #thoughts")) return;
  close();
});

// sit right next to the Work box, sharing its border
function placeNav() { nav.style.left = (workBtn.offsetWidth - 1) + "px"; }
placeNav();
window.addEventListener("resize", placeNav);
showSound();

})();
