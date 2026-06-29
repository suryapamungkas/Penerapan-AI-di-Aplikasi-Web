/**
 * DetectionModel — TensorFlow.js Vegetable Detection Model
 * Loads a pre-trained model and metadata, runs inference with memory management
 */
import { tidyPrediction, disposeTensors } from '../utils/memoryManager.js';

export class DetectionModel {
  constructor() {
    this._model = null;
    this._metadata = null;
    this._imageSize = 224;
    this._isLoaded = false;
  }

  /** @returns {boolean} Whether the model is loaded and ready */
  get isLoaded() {
    return this._isLoaded;
  }

  /** @returns {string[]} Array of label names */
  get labels() {
    return this._metadata ? this._metadata.labels : [];
  }

  /**
   * Load the model and metadata
   * @param {string} modelUrl - URL to model.json
   * @param {string} metadataUrl - URL to metadata.json
   * @param {Function} [onProgress] - Progress callback (0.0 to 1.0)
   */
  async load(modelUrl = '/model/model.json', metadataUrl = '/model/metadata.json', onProgress = null) {
    try {
      // Load metadata first
      if (onProgress) onProgress(0.1);
      const metaResponse = await fetch(metadataUrl);
      if (!metaResponse.ok) throw new Error(`Failed to load metadata: ${metaResponse.status}`);
      this._metadata = await metaResponse.json();
      this._imageSize = this._metadata.imageSize || 224;
      console.log(`[DetectionModel] Metadata loaded: ${this._metadata.labels.length} classes`);

      if (onProgress) onProgress(0.3);

      // Load TF.js model
      this._model = await tf.loadLayersModel(modelUrl, {
        onProgress: (fraction) => {
          if (onProgress) onProgress(0.3 + fraction * 0.7);
        },
      });

      // Warm up the model with a dummy prediction
      const warmupTensor = tf.zeros([1, this._imageSize, this._imageSize, 3]);
      const warmupResult = this._model.predict(warmupTensor);
      disposeTensors(warmupTensor, warmupResult);

      this._isLoaded = true;
      if (onProgress) onProgress(1.0);
      console.log('[DetectionModel] Model loaded and warmed up successfully');
    } catch (error) {
      console.error('[DetectionModel] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Run prediction on a video frame
   * Uses tf.tidy() for disciplined memory management
   * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source - Image source
   * @returns {{ label: string, confidence: number, allPredictions: Array }} Detection result
   */
  predict(source) {
    if (!this._isLoaded) {
      return { label: null, confidence: 0, allPredictions: [] };
    }

    // Use tf.tidy() to automatically clean up intermediate tensors
    const predictions = tidyPrediction(() => {
      // Convert image to tensor
      const imageTensor = tf.browser.fromPixels(source);

      // Resize to model's expected input size
      const resized = tf.image.resizeBilinear(imageTensor, [this._imageSize, this._imageSize]);

      // Normalize pixel values to [0, 1]
      const normalized = resized.div(255.0);

      // Add batch dimension: [height, width, channels] -> [1, height, width, channels]
      const batched = normalized.expandDims(0);

      // Run inference
      const output = this._model.predict(batched);

      // Return the prediction data (this exits tf.tidy, so we need dataSync)
      return output.dataSync();
    });

    // Process predictions outside of tidy (no tensor ops)
    const predArray = Array.from(predictions);
    const maxIndex = predArray.indexOf(Math.max(...predArray));
    const allPredictions = this._metadata.labels.map((label, i) => ({
      label,
      confidence: predArray[i],
    }));

    // Sort by confidence descending
    allPredictions.sort((a, b) => b.confidence - a.confidence);

    return {
      label: this._metadata.labels[maxIndex],
      confidence: predArray[maxIndex],
      allPredictions,
    };
  }

  /** Dispose model and free memory */
  dispose() {
    if (this._model) {
      this._model.dispose();
      this._model = null;
      this._isLoaded = false;
      console.log('[DetectionModel] Model disposed');
    }
  }
}
