/**
 * Generate Model Weights
 * Creates the binary weights file for the demo vegetable classifier model.
 * Run with: node scripts/generate-model.js
 */
const fs = require('fs');
const path = require('path');

// Model architecture:
// Conv2D(3->8, kernel 3x3): 3*3*3*8 = 216 kernel + 8 bias = 224 params
// Dense(8->6): 8*6 = 48 kernel + 6 bias = 54 params
// Total: 278 float32 values = 1112 bytes

const totalParams = 278;
const buffer = new Float32Array(totalParams);

// Initialize with small random values (Xavier-like initialization)
function xavierInit(fanIn, fanOut) {
  const limit = Math.sqrt(6.0 / (fanIn + fanOut));
  return () => (Math.random() * 2 - 1) * limit;
}

let offset = 0;

// Conv2D kernel: shape [3, 3, 3, 8] = 216 values
const convInit = xavierInit(3 * 3 * 3, 8);
for (let i = 0; i < 216; i++) {
  buffer[offset++] = convInit();
}

// Conv2D bias: shape [8] = 8 values
for (let i = 0; i < 8; i++) {
  buffer[offset++] = 0.0;
}

// Dense kernel: shape [8, 6] = 48 values
const denseInit = xavierInit(8, 6);
for (let i = 0; i < 48; i++) {
  buffer[offset++] = denseInit();
}

// Dense bias: shape [6] = 6 values
for (let i = 0; i < 6; i++) {
  buffer[offset++] = 0.0;
}

// Write binary file
const outputDir = path.resolve(__dirname, '..', 'public', 'model');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'group1-shard1of1.bin');
fs.writeFileSync(outputPath, Buffer.from(buffer.buffer));

console.log(`✅ Model weights generated: ${outputPath}`);
console.log(`   Total parameters: ${totalParams}`);
console.log(`   File size: ${totalParams * 4} bytes`);
