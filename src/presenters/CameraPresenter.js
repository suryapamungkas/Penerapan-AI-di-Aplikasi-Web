/**
 * CameraPresenter — Camera Lifecycle Management
 * Manages MediaStream API, starts/stops camera, connects to view
 */
export class CameraPresenter {
  /**
   * @param {import('../views/CameraView.js').CameraView} cameraView
   */
  constructor(cameraView) {
    this._view = cameraView;
    this._stream = null;
    this._active = false;
  }

  /** @returns {boolean} Whether the camera is currently active */
  get isActive() {
    return this._active;
  }

  /** @returns {HTMLVideoElement} The video element */
  get videoElement() {
    return this._view.getVideoElement();
  }

  /**
   * Start camera streaming via MediaStream API
   * Prefers rear-facing camera for mobile devices
   */
  async startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = this._view.getVideoElement();
      video.srcObject = this._stream;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      this._active = true;
      this._view.showVideoFeed();
      this._view.setCameraButtonState('Stop Camera', true);
      console.log('[CameraPresenter] Camera started');
    } catch (error) {
      console.error('[CameraPresenter] Failed to start camera:', error);
      this._active = false;
      throw error;
    }
  }

  /** Stop camera streaming and release resources */
  stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }

    const video = this._view.getVideoElement();
    if (video) {
      video.srcObject = null;
    }

    this._active = false;
    this._view.hideVideoFeed();
    this._view.setCameraButtonState('Start Camera', false);
    this._view.updateFPS(0);
    console.log('[CameraPresenter] Camera stopped');
  }
}
