/**
 * AppView - Main application shell view
 * Handles loading overlay and app-level UI state
 */
export class AppView {
  constructor() {
    this._overlay = document.getElementById('loading-overlay');
    this._loadingFill = document.getElementById('loading-fill');
    this._loadingText = document.getElementById('loading-text');
  }

  /**
   * Update loading progress bar and status text
   * @param {number} percent - Progress percentage (0-100)
   * @param {string} message - Status message to display
   */
  updateLoadingProgress(percent, message) {
    if (this._loadingFill) {
      this._loadingFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    if (this._loadingText && message) {
      this._loadingText.textContent = message;
    }
  }

  /** Show the loading overlay */
  showLoading() {
    if (this._overlay) {
      this._overlay.classList.remove('hidden');
    }
  }

  /** Hide the loading overlay with animation */
  hideLoading() {
    if (this._overlay) {
      this._overlay.classList.add('hidden');
    }
  }
}
