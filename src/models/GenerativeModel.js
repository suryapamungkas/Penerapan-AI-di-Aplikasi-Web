/**
 * GenerativeModel — Transformers.js Text Generation
 * Generates fun facts about detected vegetables using a local LLM
 */
import { getTransformersDevice } from '../utils/backendHelper.js';

// Persona prompt templates (in English for better model performance)
const PERSONA_PROMPTS = {
  funny: 'You are a hilarious comedian who loves vegetables. Tell a short, funny, and entertaining fun fact about {vegetable}. Be witty and humorous. Keep it concise.',
  history: 'You are a knowledgeable historian. Tell a short, fascinating historical fun fact about {vegetable}. Focus on its origins, historical uses, or cultural significance. Keep it concise.',
  science: 'You are a brilliant scientist. Tell a short, mind-blowing scientific fun fact about {vegetable}. Focus on nutrition, biology, chemistry, or interesting scientific properties. Keep it concise.',
};

export class GenerativeModel {
  constructor() {
    this._generator = null;
    this._isLoaded = false;
    this._isLoading = false;
  }

  /** @returns {boolean} Whether the model is loaded */
  get isLoaded() {
    return this._isLoaded;
  }

  /** @returns {boolean} Whether the model is currently loading */
  get isLoading() {
    return this._isLoading;
  }

  /**
   * Load the Transformers.js text generation pipeline
   * @param {Function} [onProgress] - Progress callback with status message
   */
  async load(onProgress = null) {
    if (this._isLoaded || this._isLoading) return;
    this._isLoading = true;

    try {
      if (onProgress) onProgress('Loading Transformers.js library...');

      // Dynamic import from CDN (webpackIgnore prevents Webpack from bundling)
      const { pipeline, env } = await import(
        /* webpackIgnore: true */
        'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1'
      );

      // Disable local model check to allow CDN downloads
      env.allowLocalModels = false;

      // Determine optimal device (WebGPU or WASM)
      const device = getTransformersDevice();
      if (onProgress) onProgress(`Downloading AI model (${device})... This may take a moment.`);

      // Load text generation pipeline with quantized model
      this._generator = await pipeline(
        'text-generation',
        'onnx-community/Qwen2.5-0.5B-Instruct',
        {
          dtype: 'q4',
          device: device,
          progress_callback: (progress) => {
            if (onProgress && progress.status === 'progress') {
              const pct = Math.round(progress.progress || 0);
              onProgress(`Downloading AI model... ${pct}%`);
            }
          },
        }
      );

      this._isLoaded = true;
      this._isLoading = false;
      if (onProgress) onProgress('AI model ready!');
      console.log('[GenerativeModel] Model loaded successfully');
    } catch (error) {
      this._isLoading = false;
      console.error('[GenerativeModel] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Generate a fun fact about a vegetable
   * @param {string} vegetableName - Name of the vegetable
   * @param {string} persona - Persona key ('funny', 'history', 'science')
   * @returns {Promise<string>} Generated fun fact text
   */
  async generate(vegetableName, persona = 'funny') {
    // Lazy-load model on first generation
    if (!this._isLoaded) {
      await this.load();
    }

    const systemPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.funny;
    const userPrompt = systemPrompt.replace('{vegetable}', vegetableName);

    try {
      const result = await this._generator(
        [
          { role: 'system', content: 'You are a helpful assistant that shares fun facts about vegetables. Respond in 1-3 sentences.' },
          { role: 'user', content: userPrompt },
        ],
        {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
        }
      );

      // Extract the generated text from the last message
      const generated = result[0].generated_text;
      const lastMessage = generated[generated.length - 1];
      const text = lastMessage.content.trim();

      console.log(`[GenerativeModel] Generated fun fact for ${vegetableName} (${persona})`);
      return text;
    } catch (error) {
      console.error('[GenerativeModel] Generation failed:', error);
      throw error;
    }
  }

  /** Dispose the model pipeline */
  dispose() {
    this._generator = null;
    this._isLoaded = false;
    console.log('[GenerativeModel] Model disposed');
  }
}
