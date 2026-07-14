/**
 * GenerativeModel — Transformers.js Text Generation
 * Generates fun facts about detected vegetables using a local LLM
 */
import { getTransformersDevice } from '../utils/backendHelper.js';


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
        'text2text-generation',
        'Xenova/LaMini-Flan-T5-77M',
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
      throw new Error('Gagal mengunduh model AI karena masalah jaringan atau server. Pastikan koneksi stabil dan coba lagi.');
    }
  }

  /**
   * Generate a fun fact about a vegetable
   * @param {string} vegetableName - Name of the vegetable (in English)
   * @param {string} persona - Persona key ('funny', 'history', 'science')
   * @returns {Promise<string>} Generated fun fact text
   */
  async generate(vegetableName, persona = 'funny') {
    // Lazy-load model on first generation
    if (!this._isLoaded) {
      await this.load();
    }

    // Exact prompt format recommended by Dicoding reviewer
    const userPrompt = `Describe ${vegetableName} in a ${persona} way with one sentence.`;

    try {
      // Create a combined string prompt for text2text-generation
      const promptText = `You are an AI assistant that shares interesting fun facts and health benefits about vegetables in one clear English sentence. ${userPrompt}`;
      
      const result = await this._generator(
        promptText,
        {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
        }
      );

      // text2text-generation returns [{ generated_text: "..." }]
      const text = result[0].generated_text.trim();

      console.log(`[GenerativeModel] Generated fun fact for ${vegetableName} (${persona}):`, text);
      return text;
    } catch (error) {
      console.error('[GenerativeModel] Generation failed:', error);
      throw new Error('Terjadi kesalahan saat menghasilkan Fun Fact. Silakan coba lagi nanti.');
    }
  }

  /** Dispose the model pipeline */
  dispose() {
    this._generator = null;
    this._isLoaded = false;
    console.log('[GenerativeModel] Model disposed');
  }
}
