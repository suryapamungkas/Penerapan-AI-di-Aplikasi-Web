/**
 * CameraView - Camera streaming UI
 * Handles video element display and camera controls
 */
export class CameraView {
  constructor() {
    this._video = document.getElementById('video-feed');
    this._canvas = document.getElementById('camera-canvas');
    this._toggleBtn = document.getElementById('camera-toggle');
    this._placeholder = document.getElementById('camera-placeholder');
    this._fpsCounter = document.getElementById('fps-counter');
  }

  /** @returns {HTMLVideoElement} The video element */
  getVideoElement() {
    return this._video;
  }

  /** @returns {HTMLCanvasElement} The canvas element for frame capture */
  getCanvasElement() {
    return this._canvas;
  }

  /**
   * Register camera toggle callback
   * @param {Function} callback - Called when toggle button is clicked
   */
  onToggleCamera(callback) {
    if (this._toggleBtn) {
      this._toggleBtn.addEventListener('click', callback);
    }
  }

  /**
   * Update camera button text and state
   * @param {string} text - Button text
   * @param {boolean} isRecording - Whether camera is active
   */
  setCameraButtonState(text, isRecording) {
    if (this._toggleBtn) {
      this._toggleBtn.innerHTML = `<span class="btn-icon">${isRecording ? '⏹' : '▶'}</span> ${text}`;
      this._toggleBtn.classList.toggle('recording', isRecording);
    }
  }

  /** Show the video feed, hide placeholder */
  showVideoFeed() {
    if (this._video) this._video.classList.add('active');
    if (this._placeholder) this._placeholder.classList.add('hidden');
  }

  /** Hide the video feed, show placeholder */
  hideVideoFeed() {
    if (this._video) this._video.classList.remove('active');
    if (this._placeholder) this._placeholder.classList.remove('hidden');
  }

  /**
   * Update FPS counter display
   * @param {number} fps - Current frames per second
   */
  updateFPS(fps) {
    if (this._fpsCounter) {
      this._fpsCounter.textContent = `${fps} FPS`;
    }
  }
}
