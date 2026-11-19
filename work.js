// ---------- WORK PAGE ----------
// Builds the grid from work-data.js, switches between the portraits and the work,
// and runs the viewer. The name card and music box stay put the whole time.

(function () {

var grid    = document.getElementById("grid");
var viewer  = document.getElementById("viewer");
var vImg    = document.getElementById("v-img");
var vTitle  = document.getElementById("v-title");
var vDetail = document.getElementById("v-details");
var vLink   = document.getElementById("v-link");
var vCount  = document.getElementById("v-count");
var current = null;   // the open project
var index   = 0;      // which image in it

// ---- build the grid ----
projects.forEach(function (p, i) {
  var tile = document.createElement("button");
  tile.type = "button";
  tile.className = "tile";
  tile.innerHTML =
    '<img class="tile-img" loading="lazy" alt="">' +
    '<div class="tile-title"></div>' +
    '<div class="tile-meta"></div>';
  tile.querySelector(".tile-img").src = p.thumb || p.images[0];   // a separate thumbnail if the project has one
  tile.querySelector(".tile-title").textContent = p.title;
  tile.querySelector(".tile-meta").textContent = p.year + ", " + p.details[0];
  tile.addEventListener("click", function () { openProject(i); });
  grid.appendChild(tile);
});

// ---- viewer ----
function openProject(i) {
  if (typeof closeRecent === "function") closeRecent();   // Recently Played gets out of the way
  current = typeof i === "object" ? i : projects[i];   // a project, or its number in the list
  if (typeof i === "number" && window.countWork) window.countWork(current.title);   // for the shooting star
  index = 0;
  vTitle.textContent  = current.title;                  // just the title (no year)
  // details joined with commas; a "Made in collaboration with …" credit goes on its own line at the bottom
  var credit = current.details.filter(function (d) { return /^Made in /i.test(d); });
  vDetail.textContent = current.details.filter(function (d) { return credit.indexOf(d) < 0; }).join(", ");
  credit.forEach(function (c) {
    var line = document.createElement("span");
    line.className = "v-credit";
    line.textContent = c;
    vDetail.appendChild(document.createElement("br"));
    vDetail.appendChild(line);
  });
  if (current.link) {
    vLink.href = current.link;
    vLink.textContent = current.linkText;
    vLink.hidden = false;
  } else {
    vLink.hidden = true;
  }
  var vids = document.getElementById("v-videos");
  vids.innerHTML = "";
  vids.classList.remove("is-film");
  if (current.gifs) {
    // videos shown as moving previews (gifs), each with its title + a link to the full video
    current.gifs.forEach(function (g) {
      var fig = document.createElement("figure");
      // a short silent loop that plays like a gif (but is ~5x lighter)
      var im = document.createElement("video");
      im.className = "gif-loop";
      im.src = g.src;
      im.muted = true;
      im.loop = true;
      im.autoplay = true;
      im.playsInline = true;
      im.preload = "metadata";
      im.setAttribute("aria-label", g.title);
      var cap = document.createElement("figcaption");
      var t = document.createElement("span");
      t.className = "gif-title";
      t.textContent = g.title + ", " + g.year;
      cap.appendChild(t);
      if (g.link) {
        cap.appendChild(document.createElement("br"));
        var a = document.createElement("a");
        a.href = g.link;
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "gif-link";
        a.textContent = "View Here";
        cap.appendChild(a);
      }
      fig.appendChild(im);
      fig.appendChild(cap);
      vids.appendChild(fig);
    });
    vids.hidden = false;
    vImg.hidden = true;
    vCount.textContent = current.gifs.length + " videos";
    document.getElementById("v-prev").hidden = true;
    document.getElementById("v-next").hidden = true;
    viewer.classList.add("has-videos");
    vids.scrollTop = 0;
  } else   if (current.stack || current.images.length > 1) {
    // pages / photos one under the other in the column, scroll to see them all
    // (Gentleman gets a label under each photo; books and magazines don't)
    current.images.forEach(function (src, k) {
      var fig = document.createElement("figure");
      var im = document.createElement("img");
      im.src = src;
      im.alt = "";
      im.loading = "lazy";
      var cap = document.createElement("figcaption");
      var num = parseInt(src.split("/").pop(), 10);
      var yr = (current.imageYears && current.imageYears[k]) || "";
      cap.textContent = (current.pieceName || current.title) + " #" + num + (yr ? ", " + yr : "");   // e.g. "Gentleman #8, 2025"
      if (current.captions) cap.textContent = current.captions[k] || "";      // a name of its own under each piece
      fig.appendChild(im);
      if (current.stack || current.captions) fig.appendChild(cap);
      vids.appendChild(fig);
    });
    vids.hidden = false;
    vImg.hidden = true;
    vCount.textContent = current.images.length + (current.stack ? " photos" : " pages");
    document.getElementById("v-prev").hidden = true;
    document.getElementById("v-next").hidden = true;
    viewer.classList.add("has-videos");
    vids.scrollTop = 0;
  } else if (current.youtube) {
    // a film on YouTube: the YouTube player sits in the column
    var wrap = document.createElement("div");
    wrap.className = "v-youtube";
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + current.youtube + "?rel=0&playsinline=1";
    f.title = current.title;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    wrap.appendChild(f);
    vids.appendChild(wrap);
    vids.hidden = false;
    vImg.hidden = true;
    vCount.textContent = "";
    vids.classList.add("is-film");
    document.getElementById("v-prev").hidden = true;
    document.getElementById("v-next").hidden = true;
    viewer.classList.add("has-videos");
  } else if (current.videos) {
    // videos: stacked in the column, scroll to watch them all
    current.videos.forEach(function (item) {
      // each video can be just a file name, or { src, poster, label }
      if (typeof item === "string") item = { src: item };
      var v = document.createElement("video");
      v.src = item.src;
      if (item.poster) v.poster = item.poster;
      v.controls = true;
      v.playsInline = true;
      v.preload = item.poster ? "none" : "metadata";   // with a still image, only load the video when played
      if (item.label) {
        var fig = document.createElement("figure");
        var cap = document.createElement("figcaption");
        cap.textContent = item.label;
        fig.appendChild(v);
        fig.appendChild(cap);
        vids.appendChild(fig);
      } else {
        vids.appendChild(v);
      }
    });
    vids.hidden = false;
    vImg.hidden = true;
    vCount.textContent = current.videos.length + " videos";
    document.getElementById("v-prev").hidden = true;
    document.getElementById("v-next").hidden = true;
    viewer.classList.add("has-videos");
  } else {
    vids.hidden = true;
    vImg.hidden = false;
    viewer.classList.remove("has-videos");
    var many = current.images.length > 1;
    document.getElementById("v-prev").hidden = !many;
    document.getElementById("v-next").hidden = !many;
    showImage();
  }
  viewer.hidden = false;
  document.body.classList.add("panel-open");      // computers: white column under the music box
  fitWorkArea();
  if (isPhone()) document.body.style.overflow = "hidden";   // phones: full screen
}

function isPhone() {
  return window.matchMedia("(max-width: 700px)").matches;
}

function showImage() {
  vImg.src = current.images[index];
  vCount.textContent = current.images.length > 1 ? (index + 1) + " / " + current.images.length : "";
  // load the next image in the background
  var next = new Image();
  next.src = current.images[(index + 1) % current.images.length];
}

function step(d) {
  if (!current || current.videos || current.stack || current.images.length > 1) return;   // only single images now, so nothing to step through
  index = (index + d + current.images.length) % current.images.length;
  showImage();
}

function closeViewer() {
  closeZoom();
  viewer.querySelectorAll("video").forEach(function (v) { v.pause(); });
  viewer.querySelectorAll(".v-youtube").forEach(function (y) { y.remove(); });   // stops the YouTube film
  viewer.hidden = true;
  current = null;
  document.body.classList.remove("panel-open");
  document.body.style.overflow = "";
}

document.getElementById("v-prev").addEventListener("click", function () { step(-1); });
document.getElementById("v-next").addEventListener("click", function () { step(1); });
document.getElementById("v-close").addEventListener("click", closeViewer);

// click the image itself to go to the next one
// ---- ZOOM: click any image in the column to see it big, to the left of the column ----
var zoom    = document.getElementById("zoom");
var zoomImg = document.getElementById("zoom-img");

var zoomNav  = document.getElementById("zoom-nav");
var zoomList = [];     // the images in the column
var zoomAt   = 0;      // which one is big

function columnImages() {
  var vids = document.getElementById("v-videos");
  if (!vids.hidden) return Array.prototype.slice.call(vids.querySelectorAll("img, video.gif-loop"));
  return vImg.hidden ? [] : [vImg];
}

var zoomVid = document.getElementById("zoom-vid");
function showInZoom(el, src) {               // a photo, or a looping video (Videos)
  var isVid = el && el.tagName === "VIDEO";
  zoomVid.hidden = !isVid;
  zoomImg.hidden = isVid;
  if (isVid) { zoomVid.src = el.currentSrc || el.src; zoomVid.play(); }
  else { zoomVid.removeAttribute("src"); zoomImg.src = src; }
}

function openZoom(src, el) {
  zoomList = columnImages();
  zoomAt = Math.max(0, zoomList.indexOf(el));
  showInZoom(el, src);
  zoomNav.hidden = zoomList.length < 2;     // no hearts when there's only one image
  zoom.hidden = false;
}

// hearts: flip to the previous / next image in the column (wraps around at the ends)
function zoomStep(d) {
  if (zoomList.length < 2) return;
  zoomAt = (zoomAt + d + zoomList.length) % zoomList.length;
  var im = zoomList[zoomAt];
  showInZoom(im, im.currentSrc || im.src);
  // the column follows along (scrolls only the column — never the whole page)
  var sc = im.closest(".v-stage") || im.parentNode;
  var ir = im.getBoundingClientRect(), sr = sc.getBoundingClientRect();
  sc.scrollTo({ top: sc.scrollTop + (ir.top - sr.top) - (sc.clientHeight - ir.height) / 2, behavior: "smooth" });
}
// FOCUS: on = plain white behind the big image (stays on for the rest of the visit until switched off)
var focusBtn = document.getElementById("zoom-focus");
focusBtn.addEventListener("click", function () {
  var on = !zoom.classList.contains("is-focus");
  zoom.classList.toggle("is-focus", on);
  focusBtn.textContent = on ? "Focus: Off" : "Focus: On";   // the button says what clicking it will do
  focusBtn.setAttribute("aria-pressed", on ? "true" : "false");
});
document.getElementById("zoom-prev").addEventListener("click", function () { zoomStep(-1); });
document.getElementById("zoom-next").addEventListener("click", function () { zoomStep(1); });
function closeZoom() {
  zoom.hidden = true;
  zoomImg.removeAttribute("src");
  zoomVid.pause();
  zoomVid.removeAttribute("src");
}

viewer.addEventListener("click", function (e) {
  var t = e.target;
  if ((t.tagName === "IMG" || t.classList.contains("gif-loop")) && (t === vImg || t.closest(".v-videos"))) openZoom(t.currentSrc || t.src, t);
});
// click anywhere outside the big image to close it
// (clicking another image in the column still swaps it instead)
document.addEventListener("click", function (e) {
  if (zoom.hidden) return;
  var t = e.target;
  if (t === zoomImg || t === zoomVid || t.closest(".zoom-nav") || t.closest(".zoom-focus")) return;   // the image and the hearts don't close it
  if ((t.tagName === "IMG" || t.classList.contains("gif-loop")) && (t === vImg || t.closest(".v-videos"))) return;
  closeZoom();
  e.preventDefault();
  e.stopPropagation();          // so that click doesn't also open something behind
}, true);

// keyboard: arrows + Esc
document.addEventListener("keydown", function (e) {
  if (viewer.hidden) return;
  if (e.key === "ArrowRight") { if (!zoom.hidden) zoomStep(1);  else step(1); }
  if (e.key === "ArrowLeft")  { if (!zoom.hidden) zoomStep(-1); else step(-1); }
  if (e.key === "Escape")     { if (!zoom.hidden) closeZoom(); else closeViewer(); }   // Esc closes the big image first
});

// phones: swipe left/right
var touchX = null;
viewer.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
viewer.addEventListener("touchend", function (e) {
  if (touchX === null) return;
  var dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  touchX = null;
});


// ---- switch between portraits and Work (no page reload, so music keeps playing) ----
var workSection = document.getElementById("work");
var workToggle  = document.getElementById("work-toggle");
window.openInColumn = openProject;            // lets other scripts open things in the white column

function updateView() {
  // the old Work grid page is retired (works open from the Work menu now):
  // if someone lands on an old "#work" link or goes Back to it, they just see the homepage
  if (location.hash === "#work") history.replaceState(null, "", location.pathname + location.search);
  var onWork = false;
  document.body.classList.toggle("show-work", onWork);   // pink background, no portrait
  workSection.hidden = !onWork;
  if (workToggle) {
    workToggle.textContent = onWork ? "Home" : "Work";
    workToggle.setAttribute("href", onWork ? "#" : "#work");
  }
  if (!viewer.hidden) closeViewer();          // switching views closes the white column
  if (onWork) fitWorkArea();
}
window.addEventListener("hashchange", updateView);

// keep the grid clear of the name card (bottom) and the music box (top right)
var infoCard = document.querySelector(".info");
var musicBox = document.getElementById("now-playing");
function fitWorkArea() {
  var top = 0;
  if (!musicBox.hidden && getComputedStyle(musicBox).position === "absolute") {
    top = musicBox.offsetHeight;
  }
  workSection.style.setProperty("--space-top", top + "px");
  workSection.style.setProperty("--space-bottom", infoCard.offsetHeight + "px");

  // the project column sits right under the music box, at the same width
  var root = document.documentElement.style;
  if (!musicBox.hidden && getComputedStyle(musicBox).position === "absolute") {
    // exact (not rounded) size, so the column lines up perfectly under the box
    var mb = musicBox.getBoundingClientRect();
    root.setProperty("--panel-top", mb.bottom + "px");          // starts right at the box's bottom line
    root.setProperty("--panel-w", mb.width + "px");
  } else {
    root.setProperty("--panel-top", "0px");
    root.setProperty("--panel-w", "320px");
  }
}
if (window.ResizeObserver) {
  new ResizeObserver(fitWorkArea).observe(musicBox);
  new ResizeObserver(fitWorkArea).observe(infoCard);
}
window.addEventListener("resize", fitWorkArea);


// ---- WORK MENU (top left): "Work" drops down the list; a work opens in the column ----
var menuBtn  = document.getElementById("work-menu-btn");
var menuList = document.getElementById("work-menu-list");
var menuItems = [];

projects.forEach(function (p, i) {
  if (p.hidden) return;                       // in the data (e.g. for Watch) but not in the Work menu
  var li = document.createElement("li");
  var b = document.createElement("button");
  b.type = "button";
  b.innerHTML = '<span class="wm-title"></span> <span class="wm-year"></span>';
  b.querySelector(".wm-title").textContent = p.title;
  b.querySelector(".wm-year").textContent = p.year;
  b.addEventListener("click", function () {
    openProject(i);
    menuItems.forEach(function (x) { x.classList.toggle("is-current", x === b); });
  });
  li.appendChild(b);
  menuList.appendChild(li);
  menuItems.push(b);
});

// it stays open until you click "Work" again or click an empty spot
menuBtn.addEventListener("click", function () {
  var open = menuList.hidden;
  menuList.hidden = !open;
  menuBtn.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  if (!open && !viewer.hidden) {                  // closing the Work menu closes the open work too
    closeViewer();
    menuItems.forEach(function (x) { x.classList.remove("is-current"); });
  }
});

// click any empty spot on the page to close the Work menu and the open work
// (using the music box, the Are.na box, the emojis, the star or a character doesn't close them)
document.addEventListener("click", function (e) {
  if (menuList.hidden && viewer.hidden) return;
  if (e.target.closest("#work-menu, #viewer, #zoom, #work, #watch, #wish, #drops, #peek, #letter-bear, #bear-note, #elevens, #now-playing, #np-recent, #thoughts")) return;
  if (!menuList.hidden) menuBtn.click();         // closes the list (and the open work with it)
  else { closeViewer(); menuItems.forEach(function (x) { x.classList.remove("is-current"); }); }
});

// closing the column clears the highlight
document.getElementById("v-close").addEventListener("click", function () {
  menuItems.forEach(function (x) { x.classList.remove("is-current"); });
});


// start
updateView();

})();
