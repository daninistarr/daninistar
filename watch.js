// ---------- WATCH (top left, next to Work) ----------
// A little TV: click "Watch" and a box drops down with a vertical video feed —
// one video at a time, scroll (or swipe) inside the box for the next one — it loops forever.
// It plays the iPhone Notes and TikTok Drafts from work-data.js, shuffled each visit.

(function () {

var SHOW = ["iPhone Notes", "TikTok Drafts"];   // which works' videos go in the feed (change here)

var nav    = document.getElementById("watch");
var btn    = document.getElementById("watch-btn");
var box    = document.getElementById("watch-box");
var feed   = document.getElementById("watch-feed");
var label  = document.getElementById("watch-label");
var mute   = document.getElementById("watch-mute");
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
    v.addEventListener("click", function () {                 // tap / click the video: pause (and show the sound button), or play again
      if (v.paused) { v.play(); mute.hidden = true; }
      else { v.pause(); showSound(); mute.hidden = false; }
    });
    slide.appendChild(v);
    feed.appendChild(slide);
    videos.push(v);
  });
  // ENDLESS: a copy of the last video sits before the first, and a copy of the first after the last.
  // Landing on a copy jumps (invisibly) to the real one, so the feed loops forever both ways.
  function copyOf(it) {
    var s = document.createElement("div");
    s.className = "watch-slide watch-copy";
    var c = document.createElement("video");
    c.src = it.src; c.muted = true; c.playsInline = true; c.preload = "metadata";
    if (it.poster && /\.jpe?g$/i.test(it.poster) && it.title === "iPhone Notes") c.poster = it.poster;
    s.appendChild(c);
    return s;
  }
  if (items.length > 1) {
    feed.insertBefore(copyOf(items[items.length - 1]), feed.firstChild);
    feed.appendChild(copyOf(items[0]));
  }
  // play whichever video is showing in the box, pause the rest
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting || en.target.classList.contains("watch-copy")) return;
      setCurrent(videos.indexOf(en.target.querySelector("video")));
    });
  }, { root: feed, threshold: 0.6 });
  Array.prototype.forEach.call(feed.children, function (s) { io.observe(s); });
  var settle;
  feed.addEventListener("scroll", function () {
    clearTimeout(settle);
    settle = setTimeout(function () {                          // once the swipe has stopped…
      var h = feed.clientHeight, s = Math.round(feed.scrollTop / h);
      if (items.length < 2) return;
      if (s === 0) { feed.scrollTop = items.length * h; setCurrent(items.length - 1); }   // …on the copy of the last: go to the real last
      else if (s === items.length + 1) { feed.scrollTop = h; setCurrent(0); }            // …on the copy of the first: back to the start
    }, 120);
  });
}
function slideTop(k) { return (k + (items.length > 1 ? 1 : 0)) * feed.clientHeight; }   // where video k sits in the feed

function setCurrent(k) {
  if (k === current) return;
  current = k;
  mute.hidden = true;                                          // a new video: the sound button tucks away
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
  var n = videos.length, h = feed.clientHeight;
  var top = slideTop(k);
  if (n > 1 && d === 1 && current === n - 1) top = (n + 1) * h;   // past the end: glide onto the copy, then it loops to the start
  if (n > 1 && d === -1 && current === 0) top = 0;                 // before the start: glide onto the copy of the last
  feed.scrollTo({ top: top, behavior: "smooth" });
  setCurrent(k);
}
document.getElementById("watch-prev").addEventListener("click", function () { go(-1); });
document.getElementById("watch-next").addEventListener("click", function () { go(1); });

// the speaker icon shows how it is right now: crossed out = muted, sound waves = sound on
function showSound() {
  mute.classList.toggle("is-muted", muted);
  mute.setAttribute("aria-label", muted ? "Turn sound on" : "Mute");
}
mute.addEventListener("click", function (e) {
  e.stopPropagation();
  muted = !muted;
  var v = videos[current];
  if (v) { v.muted = muted; v.play(); }                        // and the video carries on playing
  mute.hidden = true;
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
  feed.scrollTop = slideTop(k);
  setCurrent(k);
}
function close() {
  box.hidden = true;
  mute.hidden = true;
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
