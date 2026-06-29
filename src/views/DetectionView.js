/**
 * DetectionView - Detection results UI
 * Displays detected vegetable name and confidence score
 */
export class DetectionView {
  constructor() {
    this._label = document.getElementById('detection-label');
    this._confidenceFill = document.getElementById('confidence-fill');
    this._confidenceText = document.getElementById('confidence-text');
    this._section = document.getElementById('detection-section');
  }

  /**
   * Update detection result display
   * @param {string} label - Detected vegetable name
   * @param {number} confidence - Confidence score (0-1)
   */
  updateResult(label, confidence) {
    const percent = Math.round(confidence * 100);

    if (this._label) {
      this._label.textContent = label;
      this._label.classList.add('detected');
    }

    if (this._confidenceFill) {
      this._confidenceFill.style.width = `${percent}%`;
    }

    if (this._confidenceText) {
      this._confidenceText.textContent = `${percent}%`;
    }

    if (this._section) {
      this._section.classList.add('active');
    }
  }

  /** Clear detection result to default state */
  clearResult() {
    if (this._label) {
      this._label.textContent = 'No vegetable detected';
      this._label.classList.remove('detected');
    }

    if (this._confidenceFill) {
      this._confidenceFill.style.width = '0%';
    }

    if (this._confidenceText) {
      this._confidenceText.textContent = '0%';
    }

    if (this._section) {
      this._section.classList.remove('active');
    }
  }
}
