// ---------- PEEKABOO ----------
// When someone presses play on a song in the Are.na box, or scrolls all the way down it,
// a little yellow guy slides up from behind the top of the box, hands + nose over its edge,
// and looks around.

(function () {

var STAYS = 20;            // seconds he stays (change here)
var WIDTH = 150;           // how wide he is in px (change here)
var EDGE  = 905;           // where the box edge crosses him, in the drawing's own units (don't change)
var VB_TOP = 20, VB_W = 910, VB_H = 1130;

var peek  = document.getElementById("peek");
var back  = peek.querySelector(".peek-back");
var box   = document.getElementById("thoughts");
var stage = document.querySelector(".stage");
var timer = null;

function place() {
  var s  = WIDTH / VB_W;
  var H  = VB_H * s;
  var above = (EDGE - VB_TOP) * s;                   // the part of him that shows above the box
  var br = box.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  var left = br.left - sr.left + Math.min(40, br.width * 0.12);
  var top  = br.top - sr.top - above;
  peek.style.left = left + "px";
  peek.style.top = top + "px";
  peek.style.width = WIDTH + "px";
  peek.style.height = H + "px";
  back.style.height = above + "px";                  // his head is cut off at the box's top edge
  hit.style.height = (1010 - VB_TOP) * s + "px";     // the hover area covers his head, down to his nose
  peek.querySelector(".peek-nose").style.height = (1010 - VB_TOP) * s + "px";   // the nose layer ends just under the nose
}

// hover or click him: "I dream of you always." appears above him (a click keeps it there)
var dream = document.getElementById("peek-dream");
var hit = document.createElement("div");
hit.className = "peek-hit";
peek.appendChild(hit);
var dreamKept = false;
hit.addEventListener("mouseenter", function () { if (peek.classList.contains("is-up")) dream.hidden = false; });
hit.addEventListener("mouseleave", function () { if (!dreamKept) dream.hidden = true; });
hit.addEventListener("click", function () { if (peek.classList.contains("is-up")) { dreamKept = true; dream.hidden = false; } });

var up = false;
window.peekaboo = function () {
  if (box.hidden || up) return;                      // already up: leave him be
  var rec = document.getElementById("np-recent");
  if (rec && !rec.hidden) return;                    // Recently Played is open on top of the Are.na box: don't pop up through it
  up = true;
  place();
  peek.hidden = false;
  peek.classList.remove("is-up");
  peek.offsetWidth;
  peek.classList.add("is-up");
  clearTimeout(timer);
  timer = setTimeout(function () {
    peek.classList.remove("is-up");                 // slides back down
    dream.hidden = true; dreamKept = false;
    setTimeout(function () { peek.hidden = true; up = false; }, 700);
  }, STAYS * 1000);
};

// hide him right away (used when Recently Played opens over the Are.na box)
window.hidePeek = function () {
  if (!up) return;
  clearTimeout(timer);
  peek.classList.remove("is-up");
  peek.hidden = true;
  dream.hidden = true; dreamKept = false;
  up = false;
};

// scrolling all the way to the bottom of the Are.na box (or of the page, on phones) also brings him up
var wasAtBottom = false;
var scrolledOnce = false;                            // scrolling only brings him up once per visit
function atBottom() {
  var boxBottom = box.scrollHeight > box.clientHeight + 2 && box.scrollTop + box.clientHeight >= box.scrollHeight - 4;
  var pageBottom = window.matchMedia("(max-width: 700px)").matches &&
                   window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  return boxBottom || pageBottom;
}
function checkBottom() {
  var now = atBottom();
  if (now && !wasAtBottom && !scrolledOnce) {       // only the first time they reach the bottom
    scrolledOnce = true;
    window.peekaboo();
  }
  wasAtBottom = now;
}
box.addEventListener("scroll", checkBottom);
window.addEventListener("scroll", checkBottom);

window.addEventListener("resize", function () { if (!peek.hidden) place(); });
window.addEventListener("scroll", function () { if (!peek.hidden) place(); }, true);

})();
