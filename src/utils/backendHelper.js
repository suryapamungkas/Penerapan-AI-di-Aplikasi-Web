/**
 * Backend Helper — Adaptive Backend Detection
 * Checks for WebGPU availability and falls back to WebGL
 * Used by both TensorFlow.js and Transformers.js
 */

/**
 * Initialize TensorFlow.js backend with WebGPU priority, WebGL fallback
 * @returns {Promise<string>} The name of the active backend
 */
export async function initTFBackend() {
  try {
    if (navigator.gpu) {
      console.log('[Backend] WebGPU detected, attempting to set backend...');
      try {
        await tf.setBackend('webgpu');
        await tf.ready();
        console.log('[Backend] TF.js using WebGPU backend');
        return 'webgpu';
      } catch (err) {
        console.warn('[Backend] WebGPU backend failed, falling back to WebGL:', err.message);
      }
    }

    // Fallback to WebGL
    await tf.setBackend('webgl');
    await tf.ready();
    console.log('[Backend] TF.js using WebGL backend');
    return 'webgl';
  } catch (err) {
    // Last resort: CPU backend
    console.warn('[Backend] WebGL failed, falling back to CPU:', err.message);
    await tf.setBackend('cpu');
    await tf.ready();
    console.log('[Backend] TF.js using CPU backend');
    return 'cpu';
  }
}

/**
 * Get the optimal device type for Transformers.js
 * WebGPU if available, otherwise WASM
 * @returns {string} 'webgpu' or 'wasm'
 */
export function getTransformersDevice() {
  if (navigator.gpu) {
    console.log('[Backend] Transformers.js will use WebGPU device');
    return 'webgpu';
  }
  console.log('[Backend] Transformers.js will use WASM device (WebGPU not available)');
  return 'wasm';
}
