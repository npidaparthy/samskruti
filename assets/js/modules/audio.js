/**
 * audio.js — YouTube IFrame API audio controller.
 * Handles per-shloka seek, repeat, speed, and auto-scroll.
 * Plug-and-play: remove this file and audio features gracefully disable.
 */

window.StotramAudio = {
  player: null,
  ytReady: false,
  meta: null,
  shlokas: [],          // array of shloka objects with audioStart/audioEnd
  currentIndex: -1,
  repeatCount: 1,
  repeatDone: 0,
  isPlaying: false,
  pollInterval: null,
  speed: 1,

  // ── Setup ─────────────────────────────────────────────────

  setup(meta) {
    this.meta = meta;
    this.shlokas = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this._stopPoll();

    const hasYT = !!(meta.youtube_url);
    this._setControlsEnabled(hasYT);

    const statusEl = document.getElementById('audioStatus');
    if (statusEl) {
      statusEl.textContent = hasYT
        ? (window.i18n?.t('ready') || 'Ready')
        : (window.i18n?.t('no_audio') || 'No audio');
    }

    if (hasYT) {
      this._initPlayer(this._extractVideoId(meta.youtube_url));
    }

    // Bind controls
    this._bindControls();
  },

  setShlokas(shlokas) {
    this.shlokas = shlokas.filter(s => s.audioStart !== null && s.audioStart !== undefined);
  },

  // ── YouTube Player Init ───────────────────────────────────

  _initPlayer(videoId) {
    if (!videoId) return;
    document.getElementById('ytPlayerWrap')?.classList.remove('hidden');

    if (this.ytReady && this.player) {
      this.player.loadVideoById(videoId);
      return;
    }

    // YT IFrame API calls this globally when ready
    if (!window._ytCallbackRegistered) {
      window._ytCallbackRegistered = true;
      const originalCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        originalCallback?.();
        window.StotramAudio._onYTReady(videoId);
      };
    }

    if (window.YT?.Player) {
      this._onYTReady(videoId);
    }
  },

  _onYTReady(videoId) {
    this.ytReady = true;
    this.player = new YT.Player('ytPlayer', {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          this._setControlsEnabled(true);
          document.getElementById('audioStatus').textContent =
            window.i18n?.t('ready') || 'Ready';
        },
        onStateChange: (e) => this._onStateChange(e),
      }
    });
  },

  _extractVideoId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
  },

  // ── Playback ──────────────────────────────────────────────

  play(index) {
    if (!this.player || !this.shlokas.length) return;
    index = Math.max(0, Math.min(index, this.shlokas.length - 1));
    this.currentIndex = index;
    this.repeatDone = 0;
    this._playCurrent();
  },

  _playCurrent() {
    const shloka = this.shlokas[this.currentIndex];
    if (!shloka || shloka.audioStart === undefined) return;
    this.player.seekTo(shloka.audioStart, true);
    this.player.setPlaybackRate(this.speed);
    this.player.playVideo();
    this.isPlaying = true;
    this._startPoll();
    this._highlightShloka(shloka.index);
    this._updatePlayBtn(true);
    document.getElementById('audioStatus').textContent =
      `${window.i18n?.t('shloka_label') || 'శ్లోకం'} ${shloka.index}`;
  },

  _onStateChange(e) {
    // YT.PlayerState.ENDED = 0
    if (e.data === 0) {
      this._onShlokaEnd();
    }
  },

  // _startPoll() {
  //   this._stopPoll();
  //   this.pollInterval = setInterval(() => {
  //     if (!this.player || !this.isPlaying) return;
  //     const t = this.player.getCurrentTime?.();
  //     const shloka = this.shlokas[this.currentIndex];
  //     if (shloka?.audioEnd !== undefined && t >= shloka.audioEnd) {
  //       this.player.pauseVideo();
  //       this._onShlokaEnd();
  //     }
  //   }, 250);
  // },

  // _stopPoll() {
  //   if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  // },
  _startPoll() {
    this._stopPoll();

    const shloka = this.shlokas[this.currentIndex];
    if (!this.player || !this.isPlaying || !shloka || shloka.audioEnd === undefined) return;

    // Calculate exactly how many milliseconds the audio should play
    // Example: (15.03 - 0) * 1000 = 15030 milliseconds
    const durationInSeconds = shloka.audioEnd - shloka.audioStart;

    // Adjust duration based on playback speed
    const adjustedDurationMs = (durationInSeconds / this.speed) * 1000;

    // Use the browser's highly accurate timer to stop the video
    this.pollInterval = setTimeout(() => {
      this.player.pauseVideo();
      this._onShlokaEnd();
    }, adjustedDurationMs);
  },

  _stopPoll() {
    // Change clearInterval to clearTimeout since we are now using setTimeout
    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
      this.pollInterval = null;
    }
  },

  _onShlokaEnd() {
    this.repeatDone++;
    const needed = parseInt(document.getElementById('repeatCount')?.value || 1);
    if (this.repeatDone < needed) {
      // Repeat this shloka
      this._playCurrent();
      return;
    }
    // Advance to next
    if (this.currentIndex + 1 < this.shlokas.length) {
      this.currentIndex++;
      this.repeatDone = 0;
      this._playCurrent();
    } else {
      // Done
      this.isPlaying = false;
      this._stopPoll();
      this._updatePlayBtn(false);
      this._clearHighlight();
      document.getElementById('audioStatus').textContent =
        window.i18n?.t('done') || 'Done';
    }
  },

  togglePlay() {
    if (!this.player) return;
    if (this.isPlaying) {
      this.player.pauseVideo();
      this.isPlaying = false;
      this._stopPoll();
      this._updatePlayBtn(false);
    } else {
      if (this.currentIndex < 0) this.currentIndex = 0;
      this._playCurrent();
    }
  },

  prev() {
    if (this.currentIndex > 0) this.play(this.currentIndex - 1);
  },

  next() {
    if (this.currentIndex < this.shlokas.length - 1) this.play(this.currentIndex + 1);
  },

  // ── Highlight & Scroll ────────────────────────────────────

  _highlightShloka(index) {
    this._clearHighlight();
    const el = document.getElementById(`shloka-${index}`);
    if (el) {
      el.classList.add('playing');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  _clearHighlight() {
    document.querySelectorAll('.shloka-block.playing').forEach(el => el.classList.remove('playing'));
  },

  // ── UI ────────────────────────────────────────────────────

  _setControlsEnabled(enabled) {
    ['audioPlay', 'audioPrev', 'audioNext'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !enabled;
    });
    ['repeatCount', 'speedSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !enabled;
    });
  },

  _updatePlayBtn(playing) {
    const btn = document.getElementById('audioPlay');
    if (btn) btn.textContent = playing ? '⏸' : '▶';
  },

  _bindControls() {
    document.getElementById('audioPlay')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('audioPrev')?.addEventListener('click', () => this.prev());
    document.getElementById('audioNext')?.addEventListener('click', () => this.next());
    document.getElementById('speedSelect')?.addEventListener('change', (e) => {
      this.speed = parseFloat(e.target.value);
      this.player?.setPlaybackRate(this.speed);
    });

    // Click on shloka block → play from that shloka
    document.getElementById('shlokasContainer')?.addEventListener('click', (e) => {
      const block = e.target.closest('.shloka-block');
      if (!block || e.target.closest('.shloka-bookmark-btn')) return;
      const dataIdx = parseInt(block.dataset.index);
      const arrIdx = this.shlokas.findIndex(s => s.index === dataIdx);
      if (arrIdx >= 0 && this.meta?.youtube_url) {
        this.play(arrIdx);
      }
    });
  }
};
