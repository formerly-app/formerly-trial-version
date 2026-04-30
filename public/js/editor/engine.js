// engine.js
function initEditor() {
  if (window.__editorInitialized) return;
  window.__editorInitialized = true;

  if (frames.length === 0) {
    createInitialFrame();
  } else {
    refreshFrames();
  }

  const preview = createCanvas("canvas-preview");
  stagePreview = preview.stage;
  layerPreview = preview.layer;

  renderFrame(layerPreview, 0);
  
  // Initialize properties sidebar with placeholder message
  showPlaceholderMessage();
}

initEditor();
