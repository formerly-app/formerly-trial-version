// selection.js
function selectFrame(frameIndex, canvasDiv) {
  document.querySelectorAll(".canvases").forEach(c => c.classList.remove("selected"));
  canvasDiv.classList.add("selected");
  selectedFrameIndex = frameIndex;
  
  // Update properties sidebar for frame selection
  updatePropertiesSidebar();
}

function deselectFrame() {
  document.querySelectorAll(".canvases").forEach(c => c.classList.remove("selected"));
  selectedFrameIndex = null;
  
  // Update properties sidebar when frame is deselected
  updatePropertiesSidebar();
}

function selectElement(el, frameIndex) {
  // Clear any previous selection visuals across ALL frame transformers
  deselectElement();

  selectedElement = el;
  selectedFrameIndex = frameIndex;

  const layer = frames[frameIndex].layer;
  selectedLayer = layer;

  const node = layer.findOne(n => n.name() === el.id);
  selectedNode = node;

  if (node) {
    const tr = transformers[frameIndex];
    if (tr) {
      tr.nodes([node]);
      layer.draw();
    }
  }

  // Update properties sidebar for element selection
  updatePropertiesSidebar();

}

function deselectElement() {
  // Clear the transformer on whatever layer was previously selected
  if (selectedLayer) {
    // Find the transformer for the previously selected frame
    const prevFrameIndex = frames.findIndex(f => f.layer === selectedLayer);
    if (prevFrameIndex !== -1 && transformers[prevFrameIndex]) {
      transformers[prevFrameIndex].nodes([]);
    }
    selectedLayer.draw();
    selectedLayer = null;
  }

  selectedElement = null;
  selectedNode = null;

  
  // Update properties sidebar when element is deselected
  updatePropertiesSidebar();
}

// GLOBAL deselection — clicking outside the editor clears selection
document.addEventListener("mousedown", (e) => {
  if (!e.target.closest("#editor-wrapper")) {
    deselectFrame();
    deselectElement();
  }
});
