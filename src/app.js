/**
 * Root Fact App — Main Entry Point
 * Wires all MVP components together and initializes the application
 */
import './styles/main.css';
import { AppView } from './views/AppView.js';
import { CameraView } from './views/CameraView.js';
import { DetectionView } from './views/DetectionView.js';
import { FunFactView } from './views/FunFactView.js';
import { DetectionModel } from './models/DetectionModel.js';
import { GenerativeModel } from './models/GenerativeModel.js';
import { CameraPresenter } from './presenters/CameraPresenter.js';
import { DetectionPresenter } from './presenters/DetectionPresenter.js';
import { FunFactPresenter } from './presenters/FunFactPresenter.js';
import { initTFBackend } from './utils/backendHelper.js';

async function main() {
  // === 1. Initialize Views ===
  const appView = new AppView();
  const cameraView = new CameraView();
  const detectionView = new DetectionView();
  const funFactView = new FunFactView();

  try {
    // === 2. Initialize TF.js Backend ===
    appView.updateLoadingProgress(10, 'Initializing AI backend...');
    const backendName = await initTFBackend();
    appView.updateLoadingProgress(25, `Backend ready (${backendName})`);

    // === 3. Create Models ===
    const detectionModel = new DetectionModel();
    const generativeModel = new GenerativeModel();

    // === 4. Create Presenters ===
    const cameraPresenter = new CameraPresenter(cameraView);
    const detectionPresenter = new DetectionPresenter(
      detectionModel,
      detectionView,
      cameraPresenter
    );
    const funFactPresenter = new FunFactPresenter(generativeModel, funFactView);

    // === 5. Load Detection Model ===
    appView.updateLoadingProgress(30, 'Loading vegetable detection model...');
    await detectionPresenter.init((progress) => {
      const percent = 30 + Math.round(progress * 50);
      appView.updateLoadingProgress(percent, `Loading model... ${Math.round(progress * 100)}%`);
    });

    // === 6. Loading Complete ===
    appView.updateLoadingProgress(100, 'Ready! 🎉');
    await new Promise((resolve) => setTimeout(resolve, 800));
    appView.hideLoading();

    // === 7. Wire Camera Toggle ===
    let currentVegetable = null;

    cameraView.onToggleCamera(async () => {
      if (cameraPresenter.isActive) {
        cameraPresenter.stopCamera();
        detectionPresenter.stopDetection();
        currentVegetable = null;
        funFactView.setGenerateEnabled(false);
        detectionView.clearResult();
      } else {
        try {
          await cameraPresenter.startCamera();
          detectionPresenter.startDetection();
        } catch (err) {
          console.error('Failed to start camera:', err);
          alert('Could not access camera. Please ensure camera permissions are granted.');
        }
      }
    });

    // === 8. Wire Detection to Fun Fact ===
    detectionPresenter.onDetection((label, confidence) => {
      if (label && confidence > 0.15) {
        currentVegetable = label;
        funFactView.setGenerateEnabled(true);
      } else {
        // Don't immediately disable - keep last detection for a moment
      }
    });

    // === 9. Wire Fun Fact Generation ===
    funFactView.onGenerate(async () => {
      if (currentVegetable) {
        await funFactPresenter.generate(currentVegetable);
      }
    });

    // === 10. Wire Copy to Clipboard ===
    funFactView.onCopy(async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        funFactView.showCopySuccess();
      } catch (err) {
        console.error('Clipboard write failed:', err);
        // Fallback: select text
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        funFactView.showCopySuccess();
      }
    });

    console.log('[App] Root Fact App initialized successfully!');
  } catch (error) {
    console.error('[App] Initialization failed:', error);
    appView.updateLoadingProgress(0, `Error: ${error.message}`);
  }

  // === 11. Register Service Worker ===
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('[SW] Service Worker registered:', registration.scope);
      } catch (err) {
        console.log('[SW] Service Worker registration failed (expected in dev mode):', err.message);
      }
    });
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
