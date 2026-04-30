// zoom.js
// Canvas zoom functionality for oversized frames

function updateCanvasZoom() {
  const editorContent = document.querySelector('.editor-content');
  const framesContainer = document.querySelector('#frames-container');
  
  if (!editorContent || !framesContainer) return;
  
  // Get the available width inside .editor-content (excluding padding)
  const editorWidth = editorContent.clientWidth;
  
  // Calculate available height more accurately
  // Viewport height minus navbar (4rem = 64px) and margins
  const viewportHeight = window.innerHeight;
  const navbarHeight = 64; // 4rem in pixels
  const editorTopMargin = 0; // Already accounted for in wrapper
  const availableHeight = viewportHeight - navbarHeight - 80; // 80px for padding and controls
  
  const canvasWidthNum = Number.isFinite(width) ? width : parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--project-canvas-width').replace('px', '').trim()) || 1920;
  const canvasHeightNum = Number.isFinite(height) ? height : parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--project-canvas-height').replace('px', '').trim()) || 1080;
  
  // Calculate the scale needed to fit the canvas within the editor
  // Add some padding to ensure the canvas doesn't touch the edges horizontally
  const availableWidth = editorWidth - 40;
  
  let scale = 1;
  
  // Calculate scale based on width if needed
  let widthScale = 1;
  if (canvasWidthNum > availableWidth) {
    widthScale = availableWidth / canvasWidthNum;
  }
  
  // Calculate scale based on height if needed
  let heightScale = 1;
  if (canvasHeightNum > availableHeight) {
    heightScale = availableHeight / canvasHeightNum;
  }
  
  // Use the smaller scale to ensure both dimensions fit
  scale = Math.min(widthScale, heightScale);
  
  // Ensure we don't scale down too much (minimum 0.1)
  scale = Math.max(scale, 0.1);
  
  // Apply the scale to the frames container using CSS transform
  framesContainer.style.transform = `scale(${scale})`;
  framesContainer.style.transformOrigin = 'top center';
}

function initializeZoom() {
  // Initial zoom calculation with a small delay to ensure DOM is ready
  setTimeout(updateCanvasZoom, 100);
  
  // Update zoom when window is resized
  let resizeTimeout;
  window.addEventListener('resize', () => {
    // Debounce resize events to improve performance
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateCanvasZoom();
      // Also update preview modal zoom if it's visible
      const modalOverlay = document.getElementById('preview-modal-overlay');
      if (modalOverlay && modalOverlay.style.display === 'flex') {
        updatePreviewModalZoom();
      }
    }, 100);
  });
  
  // Update zoom when sidebar states might change (for responsive behavior)
  const observer = new ResizeObserver(() => {
    updateCanvasZoom();
  });
  
  // Observe the editor content for size changes
  const editorContent = document.querySelector('.editor-content');
  if (editorContent) {
    observer.observe(editorContent);
  }
}

function updatePreviewModalZoom() {
  const modalOverlay = document.getElementById('preview-modal-overlay');
  const modalContainer = document.querySelector('.preview-modal-container');
  const modalBar = document.querySelector('.preview-modal-bar');
  const modalCanvas = document.querySelector('.canvas-preview-modal');
  
  if (!modalOverlay || !modalContainer || !modalBar || !modalCanvas) return;
  
  // DEBUG: Log actual Konva stage dimensions
  if (window.stagePreviewModal) {
    console.log('Preview modal Konva stage dimensions:');
    console.log('  stagePreviewModal.width():', window.stagePreviewModal.width());
    console.log('  stagePreviewModal.height():', window.stagePreviewModal.height());
    console.log('  Global width/height vars:', width, height);
  }
  
  // DEBUG: Log regular frame dimensions
  if (window.stages && window.stages[0]) {
    console.log('Regular frame Konva stage dimensions:');
    console.log('  stages[0].width():', window.stages[0].width());
    console.log('  stages[0].height():', window.stages[0].height());
  }
  
  // Get the viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Account for modal padding (1.5rem on each side = 24px each side = 48px total)
  const availableWidth = viewportWidth - 48;
  // Account for modal padding, top bar height (40px), and some bottom margin
  const availableHeight = viewportHeight - 48 - 40 - 20; // 20px bottom margin
  
  const canvasWidthNum = Number.isFinite(width) ? width : parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--project-canvas-width').replace('px', '').trim()) || 1920;
  const canvasHeightNum = Number.isFinite(height) ? height : parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--project-canvas-height').replace('px', '').trim()) || 1080;
  
  let scale = 1;
  
  // Calculate scale based on width if needed
  let widthScale = 1;
  if (canvasWidthNum > availableWidth) {
    widthScale = availableWidth / canvasWidthNum;
  }
  
  // Calculate scale based on height if needed
  let heightScale = 1;
  if (canvasHeightNum > availableHeight) {
    heightScale = availableHeight / canvasHeightNum;
  }
  
  // Use the smaller scale to ensure both dimensions fit
  scale = Math.min(widthScale, heightScale);
  
  // Ensure we don't scale down too much (minimum 0.1)
  scale = Math.max(scale, 0.1);
  
  // Apply the scale to the modal container using CSS transform
  modalContainer.style.transform = `scale(${scale})`;
  modalContainer.style.transformOrigin = 'center center';
  
  // Ensure the canvas maintains exact dimensions by setting them explicitly
  // Use the same global width/height variables that regular frames use
  modalCanvas.style.width = width + 'px';
  modalCanvas.style.height = height + 'px';
  
  // Also ensure the modal bar matches the canvas width
  modalBar.style.width = width + 'px';
}

// Initialize zoom when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeZoom);
} else {
  initializeZoom();
}
