/**
 * FunFactPresenter — Fun Fact Generation Orchestration
 * Connects GenerativeModel with FunFactView, handles generation flow
 */
export class FunFactPresenter {
  /**
   * @param {import('../models/GenerativeModel.js').GenerativeModel} model
   * @param {import('../views/FunFactView.js').FunFactView} view
   */
  constructor(model, view) {
    this._model = model;
    this._view = view;
    this._isGenerating = false;
  }

  /**
   * Generate a fun fact for a detected vegetable
   * Lazy-loads the AI model on first call
   * @param {string} vegetableName - Detected vegetable name
   */
  async generate(vegetableName) {
    if (this._isGenerating) return;
    this._isGenerating = true;

    try {
      const persona = this._view.getPersona();

      // Show loading state
      if (!this._model.isLoaded) {
        this._view.showLoading('Loading AI model... This may take a moment.');
        await this._model.load((statusMsg) => {
          this._view.showLoading(statusMsg);
        });
      } else {
        this._view.showLoading('Generating fun fact...');
      }

      // Generate fun fact
      const funFact = await this._model.generate(vegetableName, persona);

      // Display result
      this._view.showFunFact(funFact);
      console.log(`[FunFactPresenter] Fun fact generated for ${vegetableName}`);
    } catch (error) {
      console.error('[FunFactPresenter] Generation failed:', error);
      this._view.showError(error.message || 'Failed to generate fun fact. Please try again.');
    } finally {
      this._isGenerating = false;
    }
  }
}
