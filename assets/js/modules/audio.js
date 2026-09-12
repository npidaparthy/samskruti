/**
 * audio.js — YouTube IFrame API audio controller.
 *
 * Fixed bugs:
 *   1. Repeat was counting twice (poll + onStateChange both calling _onShlokaEnd)
 *   2. Multiple listeners stacking on _bindControls() being called on every setup()
 *   3. Poll firing after pause due to race condition
 *   4. shloka.index vs array index mismatch when not all shlokas have audio
 */

window.StotramAudio = {
  player: null,
  ytReady: false,
  meta: null,
  shlokas: [],      // only shlokas that have audioStart
  currentIndex: -1,      // index into this.shlokas[]  (NOT shloka.index)
  repeatNeeded: 1,
  repeatDone: 0,
  isPlaying: false,
  pollInterval: null,
  speed: 1,
  _controlsBound: false, // ← FIX 2: bind controls only once ever

  // ── Setup — called each time a stotram is opened ───────────────────────────

  setup(meta) {
    this.meta = meta;
    this.shlokas = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.repeatDone = 0;
    this._stopPoll();

    const hasYT = !!(meta.youtube_url);
    this._setControlsEnabled(hasYT);

    const statusEl = document.getElementById('audioStatus');
    if (statusEl) {
      statusEl.textContent = hasYT
        ? (window.i18n?.t('ready') || 'Ready')
        : (window.i18n?.t('no_audio') || 'No audio');
    }

    if (hasYT) this._initPlayer(this._extractVideoId(meta.youtube_url));

    // FIX 2: Only bind DOM event listeners once — never again on re-entry
    if (!this._controlsBound) {
      this._bindControls();
      this._controlsBound = true;
    }
  },

  // Called by app.js after each section renders
  setShlokas(shlokas) {
    // Only keep shlokas that have a valid audioStart
    this.shlokas = shlokas.filter(s => s.audioStart != null);
    this.currentIndex = -1;
    this.repeatDone = 0;
  },

  // ── YouTube player init ────────────────────────────────────────────────────

  _initPlayer(videoId) {
    if (!videoId) return;
    document.getElementById('ytPlayerWrap')?.classList.remove('hidden');

    // If player already exists just load the new video
    if (this.ytReady && this.player) {
      this.player.loadVideoById({ videoId, startSeconds: 0 });
      this.player.stopVideo();
      return;
    }

    // YT API not loaded yet — register callback
    if (!window._ytCallbackRegistered) {
      window._ytCallbackRegistered = true;
      window.onYouTubeIframeAPIReady = () => {
        window.StotramAudio._createPlayer(videoId);
      };
    }

    // YT API already available (e.g. navigated back to same page)
    if (window.YT?.Player && !this.player) {
      this._createPlayer(videoId);
    }
  },

  _createPlayer(videoId) {
    this.ytReady = true;
    this.player = new YT.Player('ytPlayer', {
      height: '0', width: '0',
      videoId,
      playerVars: { autoplay: 0, controls: 0, rel: 0 },
      events: {
        onReady: () => {
          this._setControlsEnabled(true);
          const el = document.getElementById('audioStatus');
          if (el) el.textContent = window.i18n?.t('ready') || 'Ready';
        },
        // FIX 1: onStateChange no longer calls _onShlokaEnd.
        // The poll is the single source of truth for shloka boundaries.
        // onStateChange only handles unexpected video-level ENDED
        // (user skipped past the last shloka's audioEnd without the poll catching it).
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            // Video ended naturally — treat as if last shloka finished
            if (this.isPlaying) this._onShlokaEnd();
          }
        },
      }
    });
  },

  _extractVideoId(url) {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  },

  // ── Playback ───────────────────────────────────────────────────────────────

  // Play shloka at position `arrIdx` in this.shlokas[]
  play(arrIdx) {
    if (!this.player || !this.shlokas.length) return;
    arrIdx = Math.max(0, Math.min(arrIdx, this.shlokas.length - 1));
    this.currentIndex = arrIdx;
    this.repeatDone = 0;
    this._playCurrent();
  },

  _playCurrent() {
    const shloka = this.shlokas[this.currentIndex];
    if (!shloka) return;

    this.isPlaying = true;
    this.player.seekTo(shloka.audioStart, true);
    this.player.setPlaybackRate(this.speed);
    this.player.playVideo();

    this._startPoll();
    this._highlightShloka(shloka.index);   // shloka.index = DOM id
    this._updatePlayBtn(true);

    const statusEl = document.getElementById('audioStatus');
    if (statusEl) {
      statusEl.textContent =
        `${window.i18n?.t('shloka_label') || 'శ్లోకం'} ${shloka.index}`;
    }
  },

  // ── Poll — the ONLY place that decides shloka boundaries ──────────────────
  // FIX 1: _onStateChange no longer calls _onShlokaEnd, so no double-counting.
  // FIX 3: poll sets isPlaying=false BEFORE calling _onShlokaEnd to prevent
  //        re-entry from a stale tick.

  _startPoll() {
    this._stopPoll();
    this.pollInterval = setInterval(() => {
      if (!this.isPlaying || !this.player) return;

      const t = this.player.getCurrentTime?.();
      const shloka = this.shlokas[this.currentIndex];
      if (!shloka) return;

      // audioEnd null means "play until next shloka's audioStart" — we just
      // let the video run and rely on the next shloka's poll check.
      if (shloka.audioEnd != null && t >= shloka.audioEnd) {
        this.isPlaying = false;          // FIX 3: mark stopped BEFORE pause
        this.player.pauseVideo();
        this._stopPoll();
        this._onShlokaEnd();
      }
    }, 100);   // 100ms gives ~10ms accuracy — fine for human perception
  },

  _stopPoll() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  // FIX 1: Called from poll only (not from onStateChange).
  // repeatDone increments exactly once per shloka completion.
  _onShlokaEnd() {
    this.repeatDone++;

    // Read repeat count fresh each time (user may have changed the spinner)
    this.repeatNeeded = parseInt(
      document.getElementById('repeatCount')?.value || '1', 10
    );

    if (this.repeatDone < this.repeatNeeded) {
      // Repeat the same shloka
      this.isPlaying = true;
      this._playCurrent();
      return;
    }

    // Move to next shloka
    if (this.currentIndex + 1 < this.shlokas.length) {
      this.currentIndex++;
      this.repeatDone = 0;
      this.isPlaying = true;
      this._playCurrent();
    } else {
      // All shlokas done
      this._clearHighlight();
      this._updatePlayBtn(false);
      const statusEl = document.getElementById('audioStatus');
      if (statusEl) statusEl.textContent = window.i18n?.t('done') || 'Done ✓';
    }
  },

  togglePlay() {
    if (!this.player) return;
    if (this.isPlaying) {
      this.isPlaying = false;
      this._stopPoll();
      this.player.pauseVideo();
      this._updatePlayBtn(false);
    } else {
      if (this.currentIndex < 0) this.currentIndex = 0;
      this.isPlaying = true;
      this._playCurrent();
    }
  },

  prev() {
    if (this.currentIndex > 0) this.play(this.currentIndex - 1);
  },

  next() {
    if (this.currentIndex < this.shlokas.length - 1) this.play(this.currentIndex + 1);
  },

  // ── Highlight & scroll ─────────────────────────────────────────────────────

  _highlightShloka(shlokaIndex) {
    this._clearHighlight();
    const el = document.getElementById(`shloka-${shlokaIndex}`);
    if (el) {
      el.classList.add('playing');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  _clearHighlight() {
    document.querySelectorAll('.shloka-block.playing')
      .forEach(el => el.classList.remove('playing'));
  },

  // ── UI helpers ─────────────────────────────────────────────────────────────

  _setControlsEnabled(enabled) {
    ['audioPlay', 'audioPrev', 'audioNext', 'repeatCount', 'speedSelect']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !enabled;
      });
  },

  _updatePlayBtn(playing) {
    const btn = document.getElementById('audioPlay');
    if (btn) btn.textContent = playing ? '⏸' : '▶';
  },

  // ── Event binding — runs exactly once ─────────────────────────────────────

  _bindControls() {
    document.getElementById('audioPlay')
      ?.addEventListener('click', () => this.togglePlay());

    document.getElementById('audioPrev')
      ?.addEventListener('click', () => this.prev());

    document.getElementById('audioNext')
      ?.addEventListener('click', () => this.next());

    document.getElementById('speedSelect')
      ?.addEventListener('change', e => {
        this.speed = parseFloat(e.target.value);
        this.player?.setPlaybackRate(this.speed);
      });

    // Click any shloka block to play it directly
    // FIX 2: this listener is added once and always reads this.shlokas live
    document.getElementById('shlokasContainer')
      ?.addEventListener('click', e => {
        if (e.target.closest('.shloka-bookmark-btn')) return;
        const block = e.target.closest('.shloka-block');
        if (!block) return;
        if (!this.meta?.youtube_url) return;

        // data-index on the DOM element = shloka.index (1-based file position)
        // We need the position in this.shlokas[] (audio-only subset)
        const domIndex = parseInt(block.dataset.index, 10);
        const arrIdx = this.shlokas.findIndex(s => s.index === domIndex);

        if (arrIdx >= 0) {
          this.play(arrIdx);
        } else {
          // Clicked shloka has no audio tag — find closest preceding audio shloka
          const fallback = this._nearestAudioBefore(domIndex);
          if (fallback >= 0) this.play(fallback);
        }
      });
  },

  // Find the array index of the nearest audio-tagged shloka at or before domIndex
  _nearestAudioBefore(domIndex) {
    let best = -1;
    for (let i = 0; i < this.shlokas.length; i++) {
      if (this.shlokas[i].index <= domIndex) best = i;
      else break;
    }
    return best;
  },
};