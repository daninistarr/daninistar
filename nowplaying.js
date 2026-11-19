// ---------- NOW PLAYING (top right) ----------
// Shows the song Daniela is listening to on Spotify (through Last.fm),
// with a 30-second preview from Apple Music's free search.
//
// TO TURN IT ON: fill in your Last.fm username and API key below.
// Until then it shows a demo song so you can design the look.

var LASTFM_USER    = "daninistar";
var LASTFM_API_KEY = "e541da6c3313d9b7f3ad5b53325015ac";
var DEMO_SONG      = { title: "Dreams", artist: "Fleetwood Mac" };
var CHECK_EVERY    = 30;   // seconds between checks

var np       = document.getElementById("now-playing");
var npLabels = document.querySelectorAll(".np-label-text");   // the top bar text
var npLeopard = document.getElementById("np-leopard");
var npLive   = document.getElementById("np-live");
var npTitle  = document.getElementById("np-title");
var npArtist = document.getElementById("np-artist");
var npArt    = document.getElementById("np-art");
var npButton = document.getElementById("np-button");
var npWhen   = document.getElementById("np-when");
var audio    = new Audio();
var lastKey  = "";

// ---- ask Last.fm what's playing ----
function checkLastfm() {
  if (!LASTFM_USER || !LASTFM_API_KEY) {          // demo mode
    showSong(DEMO_SONG.title, DEMO_SONG.artist, true);
    return;
  }
  var url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
            "&user=" + encodeURIComponent(LASTFM_USER) +
            "&api_key=" + LASTFM_API_KEY + "&format=json&limit=1";
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var t = data.recenttracks && data.recenttracks.track && data.recenttracks.track[0];
      if (!t) { np.hidden = true; return; }
      var playingNow = t["@attr"] && t["@attr"].nowplaying === "true";
      var playedAt = t.date && t.date.uts ? new Date(t.date.uts * 1000) : null;
      showSong(t.name, t.artist["#text"], playingNow, playedAt);
    })
    .catch(function () { /* keep showing whatever was there */ });
}

function formatWhen(date) {
  return date.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit"
  });
}

// ---- show a song and find its preview ----
function showSong(title, artist, playingNow, playedAt) {
  var labelText = playingNow ? "What I\u2019m Listening 2" : "Last Played";
  npLabels.forEach(function (el) { el.textContent = labelText; });
  npLeopard.hidden = !playingNow;            // leopard only while playing
  npLive.hidden = !playingNow;               // "Live" only while playing

  // date + time, in the visitor's own time zone:
  //   playing now  -> the current date/time (Last.fm doesn't say when a song started)
  //   last played  -> when it was played
  var when = playingNow ? new Date() : playedAt;
  if (when) {
    npWhen.textContent = formatWhen(when);      // e.g. "Sun, Nov 15, 8:42 PM"
    npWhen.hidden = false;
  } else {
    npWhen.hidden = true;
  }
  var key = title + "|" + artist;
  if (key === lastKey) return;                    // same song, nothing to do
  lastKey = key;

  npTitle.textContent  = title;
  npArtist.textContent = artist;
  stopPreview();
  npButton.hidden = true;
  npArt.hidden = true;
  np.hidden = false;

  findPreview(title + " " + artist, function (song) {
    if (!song) return;                            // no preview: just show the name
    if (song.artworkUrl100) {
      npArt.src = song.artworkUrl100.replace("100x100", "300x300");
      npArt.hidden = false;
    }
    if (song.previewUrl) {
      audio.src = song.previewUrl;
      npButton.hidden = false;
    }
  });
}

// ---- Apple Music search (free, no key needed) ----
function findPreview(term, done) {
  var cb = "npCallback" + Date.now();
  var s = document.createElement("script");
  window[cb] = function (data) {
    done(data.results && data.results[0]);
    delete window[cb]; s.remove();
  };
  s.onerror = function () { done(null); delete window[cb]; s.remove(); };
  s.src = "https://itunes.apple.com/search?entity=song&limit=1&callback=" + cb +
          "&term=" + encodeURIComponent(term);
  document.body.appendChild(s);
}

// ---- play / pause ----
function stopPreview() {
  audio.pause();
  audio.currentTime = 0;
  npButton.textContent = "▶ Play";
  np.classList.remove("is-playing");
}

npButton.addEventListener("click", function () {
  if (audio.paused) {
    audio.play();
    npButton.textContent = "❚❚ Pause";
    window.lastSound = function () { npButton.click(); };   // the space bar now controls the music box
    np.classList.add("is-playing");
  } else {
    stopPreview();
  }
});
audio.addEventListener("ended", stopPreview);

// ---- RECENTLY PLAYED: click the music note for the last 5 songs, in a dropdown under the box ----
var RECENT_COUNT = 5;      // how many songs to list (change here)
var npNote   = document.getElementById("np-note");
var recent   = document.getElementById("np-recent");
var recentOl = document.getElementById("np-recent-list");

function isPhone() { return window.matchMedia("(max-width: 700px)").matches; }
function placeRecent() {
  // sits right under the music box, same width
  var r = np.getBoundingClientRect();
  if (isPhone()) {
    // phones: pinned into the page under the box, so it scrolls with it smoothly instead of chasing it
    recent.style.position = "absolute";
    recent.style.top   = (r.bottom - 1 + window.scrollY) + "px";
    recent.style.left  = (r.left + window.scrollX) + "px";
  } else {
    recent.style.position = "";
    recent.style.top   = r.bottom - 1 + "px";     // shares the box's bottom line
    recent.style.left  = r.left + "px";
  }
  recent.style.width = r.width + "px";
}

function loadRecent() {
  if (!LASTFM_USER || !LASTFM_API_KEY) return;
  recentOl.innerHTML = '<li class="np-recent-msg">Loading…</li>';
  var url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
            "&user=" + encodeURIComponent(LASTFM_USER) +
            "&api_key=" + LASTFM_API_KEY + "&format=json&limit=" + (RECENT_COUNT + 2);
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var tracks = (data.recenttracks && data.recenttracks.track) || [];
      // leave out the song already showing in the box
      tracks = tracks.filter(function (t) { return !(t["@attr"] && t["@attr"].nowplaying === "true"); });
      if (npLive.hidden && tracks.length) tracks.shift();   // box shows "Last Played" = the first one
      tracks = tracks.slice(0, RECENT_COUNT);
      recentOl.innerHTML = "";
      if (!tracks.length) {
        recentOl.innerHTML = '<li class="np-recent-msg">Nothing yet</li>';
      }
      tracks.forEach(function (t) {
        var li = document.createElement("li");
        var title = document.createElement("div");
        title.className = "np-recent-title";
        title.textContent = t.name;
        var artist = document.createElement("div");
        artist.className = "np-recent-artist";
        artist.textContent = t.artist["#text"];
        li.appendChild(title);
        li.appendChild(artist);
        if (t.date && t.date.uts) {
          var when = document.createElement("div");
          when.className = "np-recent-when";
          when.textContent = formatWhen(new Date(t.date.uts * 1000));
          li.appendChild(when);
        }
        recentOl.appendChild(li);
      });
      placeRecent();
    })
    .catch(function () {
      recentOl.innerHTML = '<li class="np-recent-msg">Couldn\u2019t load right now</li>';
    });
}

function openRecent() {
  if (window.hidePeek) window.hidePeek();         // the yellow guy ducks out of the way
  placeRecent();
  recent.hidden = false;
  npNote.classList.add("is-open");
  npNote.setAttribute("aria-expanded", "true");
  loadRecent();
}
function closeRecent() {
  recent.hidden = true;
  npNote.classList.remove("is-open");
  npNote.setAttribute("aria-expanded", "false");
}

npNote.addEventListener("click", function (e) {
  e.stopPropagation();
  if (recent.hidden) openRecent(); else closeRecent();
});
npNote.addEventListener("keydown", function (e) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); npNote.click(); }
});
// it stays open (even when you press play/pause) until you click the music note again, click outside the music box, or press Esc
document.addEventListener("click", function (e) {
  if (recent.hidden) return;
  if (e.target.closest("#now-playing, #np-recent")) return;
  closeRecent();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !recent.hidden) closeRecent();
});
window.addEventListener("resize", function () { if (!recent.hidden) placeRecent(); });
window.addEventListener("scroll", function () { if (!recent.hidden && !isPhone()) placeRecent(); }, true);   // phones don't need it

checkLastfm();
setInterval(checkLastfm, CHECK_EVERY * 1000);
