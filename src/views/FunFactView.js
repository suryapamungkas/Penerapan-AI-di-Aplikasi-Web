/**
 * FunFactView - AI Fun Fact generator UI
 * Handles persona selection, fun fact display, and clipboard
 */
export class FunFactView {
  constructor() {
    this._personaSelect = document.getElementById('persona-select');
    this._generateBtn = document.getElementById('generate-btn');
    this._loadingEl = document.getElementById('funfact-loading');
    this._loadingText = document.getElementById('ai-loading-text');
    this._factText = document.getElementById('funfact-text');
    this._copyBtn = document.getElementById('copy-btn');
  }

  /** @returns {string} Currently selected persona */
  getPersona() {
    return this._personaSelect ? this._personaSelect.value : 'funny';
  }

  /**
   * Register generate button callback
   * @param {Function} callback - Called when generate button is clicked
   */
  onGenerate(callback) {
    if (this._generateBtn) {
      this._generateBtn.addEventListener('click', callback);
    }
  }

  /**
   * Register copy button callback
   * @param {Function} callback - Called with current fun fact text
   */
  onCopy(callback) {
    if (this._copyBtn) {
      this._copyBtn.addEventListener('click', () => {
        const text = this._factText ? this._factText.textContent : '';
        callback(text);
      });
    }
  }

  /**
   * Enable or disable the generate button
   * @param {boolean} enabled
   */
  setGenerateEnabled(enabled) {
    if (this._generateBtn) {
      this._generateBtn.disabled = !enabled;
    }
  }

  /**
   * Show loading state with message
   * @param {string} message - Loading message
   */
  showLoading(message) {
    if (this._loadingEl) this._loadingEl.classList.remove('hidden');
    if (this._loadingText) this._loadingText.textContent = message || 'Generating...';
    if (this._factText) this._factText.textContent = '';
    if (this._copyBtn) this._copyBtn.classList.add('hidden');
    this.setGenerateEnabled(false);
  }

  /** Hide loading state */
  hideLoading() {
    if (this._loadingEl) this._loadingEl.classList.add('hidden');
  }

  /**
   * Display the generated fun fact
   * @param {string} text - Fun fact text to display
   */
  showFunFact(text) {
    this.hideLoading();
    if (this._factText) this._factText.textContent = text;
    if (this._copyBtn) this._copyBtn.classList.remove('hidden');
    this.setGenerateEnabled(true);
  }

  /** Clear fun fact display */
  clearFunFact() {
    if (this._factText) this._factText.textContent = '';
    if (this._copyBtn) this._copyBtn.classList.add('hidden');
  }

  /** Show copy success feedback */
  showCopySuccess() {
    if (this._copyBtn) {
      this._copyBtn.classList.add('copied');
      this._copyBtn.innerHTML = '<span class="btn-icon">✅</span> Copied!';
      setTimeout(() => {
        this._copyBtn.classList.remove('copied');
        this._copyBtn.innerHTML = '<span class="btn-icon">📋</span> Copy to Clipboard';
      }, 2000);
    }
  }

  /**
   * Show error message in the fun fact area
   * @param {string} message - Error message
   */
  showError(message) {
    this.hideLoading();
    if (this._factText) {
      this._factText.textContent = `Error: ${message}`;
      this._factText.style.borderLeftColor = 'var(--danger)';
      setTimeout(() => {
        this._factText.style.borderLeftColor = '';
      }, 3000);
    }
    this.setGenerateEnabled(true);
  }
}
