// ---------- HOMEPAGE PORTRAITS ----------
// Each portrait: the file, and the point between its eyes.
// x = % from the left edge of the image, y = % from the top.
// The image moves so that point sits under "Click Here".
// To fine-tune one, nudge its numbers and refresh.

var portraits = [
  { src: "portraits/01.jpg", x: 50,   y: 40.8 },
  { src: "portraits/07.jpg", x: 46.8, y: 37.8 },
  { src: "portraits/02.jpg", x: 41.5, y: 37.5 },
  { src: "portraits/03.jpg", x: 53.2, y: 46.4  },
  { src: "portraits/04.jpg", x: 51.2, y: 46.2 },
  { src: "portraits/13.jpg", x: 43.7,   y: 51   },
  { src: "portraits/06.jpg", x: 38.8, y: 42.5 },
  { src: "portraits/08.jpg", x: 52,   y: 35.6 },
  { src: "portraits/09.jpg", x: 38.7, y: 38.9 },
  { src: "portraits/10.jpg", x: 36.9, y: 31.3 },
  { src: "portraits/12.jpg", x: 52.5, y: 51.9 },
  { src: "portraits/11.jpg", x: 58,   y: 43.6 },
  { src: "portraits/26.jpg", x: 58.9, y: 35.5 },
  { src: "portraits/15.jpg", x: 53.5,   y: 42   },
  { src: "portraits/23.jpg", x: 56.7, y: 49.4 },
  { src: "portraits/25e.jpg", x: 38.8, y: 39.6, notFirst: true },   // notFirst: never the first one people see — only by clicking through
  { src: "portraits/16.jpg", x: 48.5,   y: 61.5 },
  { src: "portraits/17.jpg", x: 57,   y: 48.5 },
  { src: "portraits/18.jpg", x: 49,   y: 50   },
  { src: "portraits/19.jpg", x: 52.2, y: 39   },
  { src: "portraits/14.jpg", x: 39.5, y: 39.5 },
  { src: "portraits/20.jpg", x: 62.8, y: 37.3 },
  { src: "portraits/21.jpg", x: 55.2, y: 42.7 },
  { src: "portraits/22.jpg", x: 46,   y: 46   },
  { src: "portraits/24.jpg", x: 48.1, y: 43.1 }
];

var img  = document.getElementById("portrait");
var link = document.getElementById("click-here");
// start on a random portrait each visit (but never one marked notFirst)
var firstChoices = portraits.map(function (p, i) { return i; }).filter(function (i) { return !portraits[i].notFirst; });
var current = firstChoices[Math.floor(Math.random() * firstChoices.length)];

var seen = {};             // which portraits this visitor has seen
var bearDone = false;      // the bear only shows once per visit
var BEAR_STAYS = 20;       // seconds the bear stays up (change here)

function show(i) {
  var p = portraits[i];

  // wait until the image has loaded, then swap it and move it into place
  var loader = new Image();
  loader.onload = function () {
    img.style.setProperty("--ratio", loader.naturalWidth / loader.naturalHeight);
    img.style.setProperty("--x", p.x / 100);
    img.style.setProperty("--y", p.y / 100);
    img.src = p.src;
    // THE BEAR: pops up once someone has clicked through every portrait
    seen[i] = true;
    var bear = document.getElementById("bear-note");
    if (bear && !bearDone && Object.keys(seen).length === portraits.length) {
      bearDone = true;
      bear.hidden = false;
      setTimeout(function () { bear.hidden = true; }, BEAR_STAYS * 1000);   // stays up even if they keep clicking
    }

    // load the next one in the background so clicks feel instant
    var next = new Image();
    next.src = portraits[(i + 1) % portraits.length].src;
  };
  loader.src = p.src;
}

link.addEventListener("click", function (e) {
  e.preventDefault();
  current = (current + 1) % portraits.length;   // after the last one, start over
  show(current);
});

show(current);


// clicking the name (to go home) shouldn't leave "Danini Star" stuck on — it's only for hovering
var nameLink = document.querySelector(".name-swap");
if (nameLink) nameLink.addEventListener("click", function () { nameLink.blur(); });


// on computers the page never scrolls: if anything ever nudges it, snap it back to the top
window.addEventListener("scroll", function () {
  if (window.matchMedia("(min-width: 701px)").matches && (window.scrollY || window.scrollX)) window.scrollTo(0, 0);
});
if (window.matchMedia("(min-width: 701px)").matches) window.scrollTo(0, 0);


// click the bear: his heart turns red (hovering turns it red too, in home.css)
var bearSvg = document.querySelector(".bear-svg");
if (bearSvg) bearSvg.addEventListener("click", function () {
  document.getElementById("bear-note").classList.add("is-loved");
});
