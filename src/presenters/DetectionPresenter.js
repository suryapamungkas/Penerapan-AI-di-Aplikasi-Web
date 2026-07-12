/**
 * DetectionPresenter — Detection Flow Orchestration
 * Manages the detection loop with FPS limiting and memory management
 */
import { logMemoryStatus } from '../utils/memoryManager.js';

const FPS_LIMIT = 10;
const FRAME_INTERVAL = 1000 / FPS_LIMIT;
const MEMORY_LOG_INTERVAL = 30000; // Log memory every 30 seconds

export class DetectionPresenter {
  /**
   * @param {import('../models/DetectionModel.js').DetectionModel} model
   * @param {import('../views/DetectionView.js').DetectionView} view
   * @param {import('./CameraPresenter.js').CameraPresenter} cameraPresenter
   */
  constructor(model, view, cameraPresenter) {
    this._model = model;
    this._view = view;
    this._cameraPresenter = cameraPresenter;
    this._animationFrameId = null;
    this._lastFrameTime = 0;
    this._lastMemoryLogTime = 0;
    this._isRunning = false;
    this._detectionCallbacks = [];
    this._frameCount = 0;
    this._fpsStartTime = 0;
    this._currentFPS = 0;
  }

  /**
   * Initialize the detection model
   * @param {Function} [onProgress] - Progress callback (0-1)
   */
  async init(onProgress = null) {
    await this._model.load('/model/model.json', '/model/metadata.json', onProgress);
  }

  /**
   * Register a detection callback
   * @param {Function} callback - Called with (label, confidence) on each detection
   */
  onDetection(callback) {
    this._detectionCallbacks.push(callback);
  }

  /** Start the detection loop */
  startDetection() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._fpsStartTime = performance.now();
    this._frameCount = 0;
    this._lastFrameTime = 0;
    this._lastMemoryLogTime = performance.now();
    console.log('[DetectionPresenter] Detection loop started');
    this._runDetectionLoop(performance.now());
  }

  /** Stop the detection loop */
  stopDetection() {
    this._isRunning = false;
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    this._view.clearResult();
    console.log('[DetectionPresenter] Detection loop stopped');
  }

  /**
   * Internal detection loop with FPS limiting
   * @param {number} timestamp - requestAnimationFrame timestamp
   * @private
   */
  _runDetectionLoop(timestamp) {
    if (!this._isRunning) return;

    this._animationFrameId = requestAnimationFrame((ts) => this._runDetectionLoop(ts));

    // FPS limiting: skip frame if too soon
    if (timestamp - this._lastFrameTime < FRAME_INTERVAL) return;
    this._lastFrameTime = timestamp;

    // Only detect if camera is active and model is loaded
    if (!this._cameraPresenter.isActive || !this._model.isLoaded) return;

    try {
      const video = this._cameraPresenter.videoElement;
      if (!video || video.readyState < 2) return;

      // Run prediction (uses tf.tidy internally)
      const result = this._model.predict(video);

      // Map Indonesian label to English for consistency across UI and AI
      const LABEL_MAP = {
        'Brokoli': 'Broccoli',
        'Wortel': 'Carrot',
        'Tomat': 'Tomato',
        'Kentang': 'Potato',
        'Kubis': 'Cabbage',
        'Bawang': 'Onion'
      };
      const englishLabel = result.label ? (LABEL_MAP[result.label] || result.label) : null;

      // Update view
      if (englishLabel && result.confidence > 0.1) {
        this._view.updateResult(englishLabel, result.confidence);
      } else {
        this._view.clearResult();
      }

      // Notify callbacks
      this._detectionCallbacks.forEach((cb) => cb(englishLabel, result.confidence));

      // Update FPS counter
      this._frameCount++;
      const elapsed = timestamp - this._fpsStartTime;
      if (elapsed >= 1000) {
        this._currentFPS = Math.round((this._frameCount * 1000) / elapsed);
        this._cameraPresenter._view.updateFPS(this._currentFPS);
        this._frameCount = 0;
        this._fpsStartTime = timestamp;
      }

      // Periodic memory logging (debug)
      if (timestamp - this._lastMemoryLogTime > MEMORY_LOG_INTERVAL) {
        logMemoryStatus();
        this._lastMemoryLogTime = timestamp;
      }
    } catch (error) {
      console.error('[DetectionPresenter] Detection error:', error);
    }
  }
}
