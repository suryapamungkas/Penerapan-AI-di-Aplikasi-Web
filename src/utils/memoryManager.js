/**
 * Memory Manager — TensorFlow.js Memory Management Utilities
 * Provides disciplined memory management using tf.tidy() and .dispose()
 */

/**
 * Execute a prediction function within tf.tidy() for automatic memory cleanup
 * @param {Function} predictionFn - Function that creates and returns tensors
 * @returns {*} The return value of predictionFn
 */
export function tidyPrediction(predictionFn) {
  return tf.tidy(() => {
    return predictionFn();
  });
}

/**
 * Safely dispose a tensor or array of tensors
 * @param  {...(tf.Tensor|tf.Tensor[])} tensors - Tensors to dispose
 */
export function disposeTensors(...tensors) {
  tensors.forEach((tensor) => {
    if (tensor) {
      if (Array.isArray(tensor)) {
        tensor.forEach((t) => {
          if (t && typeof t.dispose === 'function') {
            t.dispose();
          }
        });
      } else if (typeof tensor.dispose === 'function') {
        tensor.dispose();
      }
    }
  });
}

/**
 * Log current TensorFlow.js memory status
 * Useful for debugging memory leaks
 */
export function logMemoryStatus() {
  const mem = tf.memory();
  console.log(`[Memory] Tensors: ${mem.numTensors}, Bytes: ${(mem.numBytes / 1024 / 1024).toFixed(2)}MB`);
}
