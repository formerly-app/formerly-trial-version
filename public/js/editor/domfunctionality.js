// domfunctionality.js
// Properties sidebar state management

// ==========================================
// Preview Modal Functions
// ==========================================

function showPreviewModal() {
  if (frames.length < 2) { 
    alert("You need at least 2 frames to animate."); 
    return; 
  }
  if (frames[0].elements.length === 0) { 
    alert("Add at least one text element to animate."); 
    return; 
  }

  const modalOverlay = document.getElementById("preview-modal-overlay");
  modalOverlay.style.display = "flex";
  
  // Apply zoom scaling to the preview modal
  if (typeof updatePreviewModalZoom === 'function') {
    updatePreviewModalZoom();
  }
  
  // Initialize the modal canvas if not already done
  if (!stagePreviewModal) {
    const preview = createCanvas("canvas-preview-modal");
    stagePreviewModal = preview.stage;
    layerPreviewModal = preview.layer;
  }
  
  // Start animation immediately
  playAnimationInModal();
  
  // Add close button event listener if not already added
  const closeBtn = document.getElementById("preview-modal-close");
  if (closeBtn) {
    closeBtn.onclick = hidePreviewModal;
  }
  
  // Add restart button event listener
  const restartBtn = document.getElementById("preview-modal-restart");
  if (restartBtn) {
    restartBtn.onclick = restartAnimation;
  }
  
  // Close modal when clicking overlay background
  modalOverlay.onclick = function(event) {
    if (event.target === modalOverlay) {
      hidePreviewModal();
    }
  };
}

function hidePreviewModal() {
  const modalOverlay = document.getElementById("preview-modal-overlay");
  modalOverlay.style.display = "none";
  
  // Stop any ongoing animation
  if (window.currentAnimationTimeline) {
    window.currentAnimationTimeline.kill();
    window.currentAnimationTimeline = null;
  }
}

function restartAnimation() {
  // Stop any ongoing animation
  if (window.currentAnimationTimeline) {
    window.currentAnimationTimeline.kill();
    window.currentAnimationTimeline = null;
  }
  
  // Start animation from the beginning
  playAnimationInModal();
}

function playAnimationInModal() {
  // Clear previous animation
  layerPreviewModal.destroyChildren();

  // Frame background (per-frame), stored using the same fill/gradient shape as elements.
  const bgRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: stagePreviewModal.width(),
    height: stagePreviewModal.height(),
    listening: false
  });
  layerPreviewModal.add(bgRect);
  applyFrameBackgroundToRect(bgRect, frames[0]);
  const previewNodes = {};

  frames[0].elements.forEach(el => {
    const node = createKonvaNodeFromElement(el);
    node.rotation(el.rotation || 0);
    node.draggable(false);
    layerPreviewModal.add(node);
    previewNodes[el.name] = node;
  });
  layerPreviewModal.draw();

  const timeline = gsap.timeline({ 
    onUpdate: () => layerPreviewModal.draw(),
    onComplete: () => {
      // Animation completed, keep showing final frame
      window.currentAnimationTimeline = null;
    }
  });

  // Store reference to current animation
  window.currentAnimationTimeline = timeline;

  let currentTime = 0;

  for (let i = 1; i < frames.length; i++) {
    const prevFrame = frames[i - 1];
    const currFrame = frames[i];
    const transition = currFrame.transition || {};
    const delay = transition.delay || 0;
    const duration = transition.duration || 1;
    const ease = getEase(transition.easing);

    const step = gsap.timeline();

    // Background switches to the destination frame when transition begins.
    step.call(() => {
      applyFrameBackgroundToRect(bgRect, currFrame);
      layerPreviewModal.draw();
    }, null, 0);

    const prevMap = getElementMapByName(prevFrame);
    const currMap = getElementMapByName(currFrame);
    const allNames = new Set([...Object.keys(prevMap), ...Object.keys(currMap)]);

    allNames.forEach(name => {
      let node = previewNodes[name];
      if (!node && currMap[name]) {
        const el = currMap[name];
        node = createKonvaNodeFromElement(el);
        node.draggable(false);
        node.opacity(0);
        layerPreviewModal.add(node);
        previewNodes[name] = node;
      }

      const prev = prevMap[name];
      const curr = currMap[name];

      if (prev && curr) {
        // Add delay before starting the tween
        step.to(node, { x: curr.x, y: curr.y, opacity: 1, duration, ease, delay: delay }, 0);
      } else if (prev && !curr) {
        step.to(node, { opacity: 0, duration, ease, delay: delay }, 0);
      } else if (!prev && curr) {
        // New element: start invisible, fade/move in after delay
        step.to(node, { x: curr.x, y: curr.y, opacity: 1, duration, ease, delay: delay }, 0);
      }
    });

    // Position the step at the appropriate time in the master timeline
    timeline.add(step, currentTime);
    currentTime += delay + duration;
  }
}

function showPlaceholderMessage() {
  const propertiesSidebar = document.getElementById("properties-sidebar");
  propertiesSidebar.innerHTML = `
    <h3>Properties</h3>
    <p style="color: var(--muted-foreground); font-size: 0.875rem; margin-top: 1rem;">
      Select an element or a frame to see it's properties here.
    </p>
  `;
}

function showElementProperties() {
  const propertiesSidebar = document.getElementById("properties-sidebar");
  propertiesSidebar.innerHTML = `
    <h3>Element Properties</h3>
    <div>
      <label>Name:</label>
      <input type="text" id="prop-name-input" />
    </div>

    <div>
      <label>Opacity (%):</label>
      <input type="range" id="prop-opacity" min="0" max="100" value="100" />
    </div>

    <div>
      <label>Rotate (deg):</label>
      <input type="number" id="prop-rotate" value="0" />
    </div>

    <div>
      <label>Width (px):</label>
      <input type="number" id="prop-width" />
    </div>

    <div>
      <label>Height (px):</label>
      <input type="number" id="prop-height" />
    </div>

    <div id="color-section">
      <label>Color / Gradient:</label>
      <input type="color" id="prop-color1" />
      <input type="color" id="prop-color2" />
      <select id="prop-gradient-direction">
        <option value="none">Solid</option>
        <option value="lr">Left → Right</option>
        <option value="rl">Right → Left</option>
        <option value="tb">Top → Bottom</option>
        <option value="bt">Bottom → Top</option>
      </select>
    </div>

    <div id="image-section" style="display: none;">
      <label>Image Source:</label>
      <input type="text" id="prop-image-src" readonly />
    </div>

    <div id="text-section" style="display: none;">
      <label>Contents:</label>
      <textarea id="prop-text-content" rows="3"></textarea>
      <label>Font Size (px):</label>
      <input type="number" id="prop-fontsize" />
      <label>Font Family:</label>
      <select id="prop-fontfamily">
        <option value="Poppins">Poppins</option>
        <option value="sans-serif">Sans-serif</option>
        <option value="cursive">Curvy</option>
        <option value="Times New Roman">Times New Roman</option>
      </select>
      <label>Font Weight:</label>
      <select id="prop-fontweight">
        <option value="bold">Bold</option>
        <option value="600">Semi-bold</option>
        <option value="normal">Regular</option>
      </select>
    </div>
    <button id="delete-element-btn" class="btn-secondary"><i class="fas fa-trash"></i> Delete Element</button>
  `;
}

function showFrameProperties() {
  const propertiesSidebar = document.getElementById("properties-sidebar");
  propertiesSidebar.innerHTML = `
    <h3>Frame Properties</h3>

    <div id="frame-bg-color-section">
      <label>Background Color / Gradient:</label>
      <input type="color" id="frame-bg-color1" />
      <input type="color" id="frame-bg-color2" />
      <select id="frame-bg-gradient-direction">
        <option value="none">Solid</option>
        <option value="lr">Left → Right</option>
        <option value="rl">Right → Left</option>
        <option value="tb">Top → Bottom</option>
        <option value="bt">Bottom → Top</option>
      </select>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
      <button id="duplicate-frame-btn" class="btn-secondary"><i class="fas fa-copy"></i> Duplicate Frame</button>
      <button id="delete-frame-btn" class="btn-secondary"><i class="fas fa-trash"></i> Delete Frame</button>
    </div>
  `;
  
  // Background color bindings (reuse same fill/gradient state shape as elements)
  if (selectedFrameIndex !== null) {
    const frame = frames[selectedFrameIndex];
    const layer = frame.layer;
    setTimeout(() => {
      updateFrameBackgroundUI(frame);
      bindFrameBackgroundProperties(frame, layer);
    }, 10);
  }

  const duplicateBtn = document.getElementById("duplicate-frame-btn");
  const deleteBtn = document.getElementById("delete-frame-btn");
  
  if (duplicateBtn) duplicateBtn.onclick = duplicateFrame;
  if (deleteBtn) deleteBtn.onclick = deleteFrame;
}

function updatePropertiesSidebar() {
  if (selectedElement) {
    showElementProperties();
    setTimeout(() => {
      if (selectedFrameIndex !== null) {
        const layer = frames[selectedFrameIndex].layer;
        
        const nameInput = document.getElementById("prop-name-input");
        const deleteElementBtn = document.getElementById("delete-element-btn");
        
        updatePropertiesUI(selectedElement);
        bindAllProperties(selectedElement, layer);
        
        if (nameInput) {
          nameInput.value = selectedElement.name || "";
          nameInput.oninput = () => {
            const newName = nameInput.value.trim();
            const frame = frames[selectedFrameIndex];
            const exists = frame.elements.some(e => e.name === newName && e !== selectedElement);
            if (exists) {
              nameInput.style.border = "2px solid red";
              return;
            }
            nameInput.style.border = "";
            selectedElement.name = newName;
            saveProject();
          };
        }
        
        if (deleteElementBtn) {
          deleteElementBtn.onclick = () => {
            if (selectedElement && selectedFrameIndex !== null) {
              const frame = frames[selectedFrameIndex];
              const index = frame.elements.findIndex(e => e.id === selectedElement.id);
              if (index !== -1) {
                frame.elements.splice(index, 1);
                renderFrame(frame.layer, selectedFrameIndex);
                deselectElement();
                saveProject();
              }
            }
          };
        }
      }
    }, 10);
  } else if (selectedFrameIndex !== null) {
    showFrameProperties();
  } else {
    showPlaceholderMessage();
  }
}

function getFrameBackgroundNode(layer) {
  if (!layer) return null;
  // background rect is created in renderFrame() with name "frame-background"
  return layer.findOne(".frame-background");
}

function updateFrameBackgroundUI(frame) {
  const c1 = document.getElementById("frame-bg-color1");
  const c2 = document.getElementById("frame-bg-color2");
  const dir = document.getElementById("frame-bg-gradient-direction");
  if (!c1 || !c2 || !dir) return;

  frame.background = frame.background || { fill: "#ffffff" };
  const bg = frame.background;

  if (bg.gradient && bg.gradient.direction !== "none") {
    c1.value = bg.gradient.color1 || "#ffffff";
    c2.value = bg.gradient.color2 || "#ffffff";
    dir.value = bg.gradient.direction;
    c2.disabled = false;
  } else {
    c1.value = bg.fill || "#ffffff";
    c2.value = "#ffffff";
    dir.value = "none";
    c2.disabled = true;
  }
}

function bindFrameBackgroundProperties(frame, layer) {
  const c1 = document.getElementById("frame-bg-color1");
  const c2 = document.getElementById("frame-bg-color2");
  const dir = document.getElementById("frame-bg-gradient-direction");
  if (!c1 || !c2 || !dir) return;

  frame.background = frame.background || { fill: "#ffffff" };

  function applyBackground() {
    const bgNode = getFrameBackgroundNode(layer);
    if (!bgNode) return;

    const stage = layer.getStage();
    const w = stage ? stage.width() : bgNode.width();
    const h = stage ? stage.height() : bgNode.height();

    if (dir.value === "none") {
      frame.background.fill = c1.value;
      delete frame.background.gradient;

      // clear any existing gradient on the node then set solid fill
      clearGradientFromNode(bgNode, { type: "rect" });
      bgNode.fill(frame.background.fill);
      layer.draw();
      return;
    }

    frame.background.gradient = {
      color1: c1.value,
      color2: c2.value || "#ffffff",
      direction: dir.value
    };
    delete frame.background.fill;

    const bgEl = { type: "rect", width: w, height: h, gradient: frame.background.gradient };
    reapplyGradient(bgNode, bgEl);
    layer.draw();
  }

  c1.oninput = applyBackground;
  c2.oninput = applyBackground;
  dir.oninput = () => {
    c2.disabled = (dir.value === "none");
    applyBackground();
  };
}

function updatePropertiesUI(el) {
  const propOpacity    = document.getElementById("prop-opacity");
  const propRotate     = document.getElementById("prop-rotate");
  const propWidth      = document.getElementById("prop-width");
  const propHeight     = document.getElementById("prop-height");
  const propColor1     = document.getElementById("prop-color1");
  const propColor2     = document.getElementById("prop-color2");
  const propGradientDir = document.getElementById("prop-gradient-direction");
  const propTextContent = document.getElementById("prop-text-content");
  const propFontSize   = document.getElementById("prop-fontsize");
  const propFontFamily = document.getElementById("prop-fontfamily");
  const propFontWeight = document.getElementById("prop-fontweight");
  const imageSection = document.getElementById("image-section");
  const imageSrcInput = document.getElementById("prop-image-src");
  const colorSection = document.getElementById("color-section");
  
  if (!propOpacity || !propRotate || !propWidth || !propHeight) return;
  
  if (selectedNode) {
    propOpacity.value = toRoundedInt(selectedNode.opacity() * 100, 100);
    propRotate.value  = toRoundedInt(selectedNode.rotation(), 0);
    
    if (el.type === "circle") {
      const radiusX = selectedNode.radiusX ? selectedNode.radiusX() * selectedNode.scaleX() : selectedNode.radius() * selectedNode.scaleX();
      const radiusY = selectedNode.radiusY ? selectedNode.radiusY() * selectedNode.scaleY() : selectedNode.radius() * selectedNode.scaleY();
      propWidth.value  = Math.round(radiusX * 2);
      propHeight.value = Math.round(radiusY * 2);
    } else {
      propWidth.value  = Math.round(selectedNode.width()  * selectedNode.scaleX());
      propHeight.value = Math.round(selectedNode.height() * selectedNode.scaleY());
    }
  } else {
    propOpacity.value = toRoundedInt((el.opacity ?? 1) * 100, 100);
    propRotate.value  = toRoundedInt(el.rotation, 0);
    const { w, h } = getDisplaySize(el);
    propWidth.value  = w;
    propHeight.value = h;
  }

  if (el.type === "text") {
    if (propColor1)      propColor1.value = el.fill || "#000000";
    if (propColor2)      propColor2.value = "#ffffff";
    if (propColor2)      propColor2.disabled = true;
    if (propGradientDir) propGradientDir.value = "none";
  } else if (el.type !== "image") {
    if (el.gradient && el.gradient.direction !== "none") {
      if (propColor1)      propColor1.value = el.gradient.color1 || "#000000";
      if (propColor2)      propColor2.value = el.gradient.color2 || "#ffffff";
      if (propGradientDir) propGradientDir.value = el.gradient.direction;
      if (propColor2)      propColor2.disabled = false;
    } else {
      if (propColor1)      propColor1.value = el.fill || "#000000";
      if (propColor2)      propColor2.value = "#ffffff";
      if (propGradientDir) propGradientDir.value = "none";
      if (propColor2)      propColor2.disabled = true;
    }
  }

  if (el.type === "text") {
    if (propFontSize)    propFontSize.value    = el.fontSize   || 30;
    if (propFontFamily)  propFontFamily.value  = el.fontFamily || "Poppins";
    if (propFontWeight)  propFontWeight.value  = el.fontWeight || "normal";
    if (propTextContent) propTextContent.value = el.text       || "";
    const textSection = document.getElementById("text-section");
    if (textSection) textSection.style.display = "block";
  } else {
    const textSection = document.getElementById("text-section");
    if (textSection) textSection.style.display = "none";
  }

  if (el.type === "image") {
    if (imageSection) imageSection.style.display = "block";
    if (imageSrcInput) imageSrcInput.value = (el.src || "").slice(0, 80) + ((el.src || "").length > 80 ? "..." : "");
    if (colorSection) colorSection.style.display = "none";
  } else {
    if (imageSection) imageSection.style.display = "none";
    if (colorSection) colorSection.style.display = "flex";
  }
}

function bindAllProperties(el, layer) {
  const propOpacity     = document.getElementById("prop-opacity");
  const propRotate      = document.getElementById("prop-rotate");
  const propWidth       = document.getElementById("prop-width");
  const propHeight      = document.getElementById("prop-height");
  const propColor1      = document.getElementById("prop-color1");
  const propColor2      = document.getElementById("prop-color2");
  const propGradientDir = document.getElementById("prop-gradient-direction");
  const propTextContent = document.getElementById("prop-text-content");
  const propFontSize    = document.getElementById("prop-fontsize");
  const propFontFamily  = document.getElementById("prop-fontfamily");
  const propFontWeight  = document.getElementById("prop-fontweight");
  
  if (!propOpacity || !propRotate || !propWidth || !propHeight) return;

  propOpacity.oninput = () => {
    el.opacity = propOpacity.value / 100;
    if (selectedNode) selectedNode.opacity(el.opacity);
    layer.draw();
  };

  propRotate.oninput = () => {
    el.rotation = toRoundedInt(propRotate.value, 0);
    propRotate.value = el.rotation;
    if (selectedNode) selectedNode.rotation(el.rotation);
    layer.draw();
  };

  propWidth.oninput = () => {
    const val = toRoundedInt(propWidth.value, 0);
    propWidth.value = val;
    if (!selectedNode) return;

    if (el.type === "rect" || el.type === "text" || el.type === "image") {
      el.width = val;
      selectedNode.width(val);
    } else if (el.type === "circle") {
      el.radiusX = Math.round(val / 2);
      el.radius  = Math.round((el.radiusX + (el.radiusY || el.radiusX)) / 2);
      if (selectedNode.radiusX) selectedNode.radiusX(el.radiusX);
      else selectedNode.radius(el.radius);
    } else if (el.type === "triangle") {
      el.size = val;
      if (selectedNode.radius) selectedNode.radius(val / 2);
    } else if (el.type === "star") {
      el.outerRadius = Math.round(val / 2);
      selectedNode.outerRadius(el.outerRadius);
    } else if (el.type === "line" || el.type === "arrow") {
      const pts = [...(el.points || [0, 0, 120, 0])];
      const sign = pts[2] >= pts[0] ? 1 : -1;
      pts[2] = pts[0] + sign * val;
      el.points = pts;
      selectedNode.points(pts);
    }
    // Re-apply gradient so it always spans the new full size
    if (el.gradient && el.gradient.direction !== "none") {
      reapplyGradient(selectedNode, el);
    }
    layer.draw();
  };

  propHeight.oninput = () => {
    const val = toRoundedInt(propHeight.value, 0);
    propHeight.value = val;
    if (!selectedNode) return;

    if (el.type === "rect" || el.type === "image") {
      el.height = val;
      selectedNode.height(val);
    } else if (el.type === "circle") {
      el.radiusY = Math.round(val / 2);
      el.radius  = Math.round(((el.radiusX || el.radiusY) + el.radiusY) / 2);
      if (selectedNode.radiusY) selectedNode.radiusY(el.radiusY);
      else selectedNode.radius(el.radius);
    } else if (el.type === "triangle") {
      el.size = val;
      if (selectedNode.radius) selectedNode.radius(val / 2);
    } else if (el.type === "star") {
      el.outerRadius = Math.round(val / 2);
      selectedNode.outerRadius(el.outerRadius);
    } else if (el.type === "line" || el.type === "arrow") {
      const pts = [...(el.points || [0, 0, 120, 0])];
      const sign = pts[3] >= pts[1] ? 1 : -1;
      pts[3] = pts[1] + sign * val;
      el.points = pts;
      selectedNode.points(pts);
    }
    if (el.gradient && el.gradient.direction !== "none") {
      reapplyGradient(selectedNode, el);
    }
    layer.draw();
  };

  // ── COLOR / GRADIENT ──
  function applyColor() {
    if (el.type === "text") {
      el.fill = propColor1.value;
      if (selectedNode) {
        clearGradientFromNode(selectedNode, el);
        selectedNode.fill(el.fill);
      }
    } else {
      if (propGradientDir.value === "none") {
        el.fill = propColor1.value;
        delete el.gradient;
        if (selectedNode) {
          clearGradientFromNode(selectedNode, el);
          selectedNode.fill(el.fill);
          // Also restore solid stroke for line/arrow
          if (el.type === "line" || el.type === "arrow") {
            selectedNode.stroke(el.fill);
            selectedNode.strokeLinearGradientColorStops(null);
            if (el.type === "arrow") selectedNode.fill(el.fill);
          }
        }
      } else {
        el.gradient = {
          color1: propColor1.value,
          color2: propColor2.value || "#ffffff",
          direction: propGradientDir.value
        };
        delete el.fill;
        if (selectedNode) {
          reapplyGradient(selectedNode, el);
        }
      }
    }
    layer.draw();
  }

  if (propColor1)      propColor1.oninput    = applyColor;
  if (propColor2)      propColor2.oninput    = applyColor;
  if (propGradientDir) {
    propGradientDir.oninput = () => {
      if (propColor2) propColor2.disabled = (propGradientDir.value === "none");
      applyColor();
    };
  }

  // ── TEXT PROPERTIES ──
  if (el.type === "text") {
    if (propTextContent) {
      propTextContent.oninput = () => {
        el.text = propTextContent.value;
        if (selectedNode) {
          selectedNode.text(el.text);
          if (propHeight) propHeight.value = Math.round(selectedNode.height());
        }
        layer.draw();
      };
    }

    if (propFontSize) {
      propFontSize.oninput = () => {
        el.fontSize = toRoundedInt(propFontSize.value, 30);
        propFontSize.value = el.fontSize;
        if (selectedNode) {
          selectedNode.fontSize(el.fontSize);
          if (propHeight) propHeight.value = Math.round(selectedNode.height());
        }
        layer.draw();
      };
    }
    
    if (propFontFamily) {
      propFontFamily.oninput = () => {
        el.fontFamily = propFontFamily.value;
        if (selectedNode) selectedNode.fontFamily(el.fontFamily);
        layer.draw();
      };
    }
    
    if (propFontWeight) {
      propFontWeight.oninput = () => {
        el.fontWeight = propFontWeight.value;
        if (selectedNode) selectedNode.fontStyle(el.fontWeight);
        layer.draw();
      };
    }
  }
}

// ── HELPERS (shared with renderer via global scope) ──

function toRoundedInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function getDisplaySize(el) {
  switch (el.type) {
    case "image":
      return { w: el.width || 0, h: el.height || 0 };
    case "text": {
      const node = selectedNode;
      const w = node ? Math.round(node.width())  : (el.width  || 0);
      const h = node ? Math.round(node.height()) : (el.height || 0);
      return { w, h };
    }
    case "rect":
      return { w: el.width || 0, h: el.height || 0 };
    case "circle":
      return {
        w: (el.radiusX || el.radius || 0) * 2,
        h: (el.radiusY || el.radius || 0) * 2
      };
    case "triangle": {
      const scx = el.scaleX || 1, scy = el.scaleY || 1;
      return { w: Math.round((el.size || 80) * scx), h: Math.round((el.size || 80) * scy) };
    }
    case "star": {
      const scx = el.scaleX || 1, scy = el.scaleY || 1;
      return {
        w: Math.round((el.outerRadius || 40) * 2 * scx),
        h: Math.round((el.outerRadius || 40) * 2 * scy)
      };
    }
    case "line":
    case "arrow": {
      const pts = el.points || [0, 0, 0, 0];
      const scx = el.scaleX || 1, scy = el.scaleY || 1;
      return {
        w: Math.round(Math.abs(pts[2] - pts[0]) * scx),
        h: Math.round((el.strokeWidth || 4) * scy)
      };
    }
    default:
      return { w: 0, h: 0 };
  }
}

// Apply gradient to a live Konva node, correctly handling centered shapes.
// This is the single authoritative gradient-apply function used by both
// domfunctionality and renderer (via reapplyGradient in renderer.js).
function applyGradientToNode(node, el) {
  reapplyGradient(node, el);
  if (node.getLayer()) node.getLayer().batchDraw();
}

function clearGradientFromNode(node, el) {
  node.fillLinearGradientColorStops(null);
  node.fillLinearGradientStartPoint({ x: 0, y: 0 });
  node.fillLinearGradientEndPoint({ x: 0, y: 0 });
  if (el && (el.type === "line" || el.type === "arrow")) {
    node.strokeLinearGradientColorStops(null);
    node.strokeLinearGradientStartPoint({ x: 0, y: 0 });
    node.strokeLinearGradientEndPoint({ x: 0, y: 0 });
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderImageLibrary() {
  if (!imageLibraryList) return;
  if (!project.assets) project.assets = {};
  if (!Array.isArray(project.assets.images)) project.assets.images = [];

  imageLibraryList.innerHTML = "";
  project.assets.images.forEach(asset => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-library-item";
    button.title = "Add image to current frame";
    const thumb = document.createElement("img");
    thumb.src = asset.src;
    thumb.alt = asset.name || "Uploaded image";
    const label = document.createElement("span");
    label.textContent = asset.name || "Image";
    button.appendChild(thumb);
    button.appendChild(label);
    button.onclick = () => addImageElementFromAsset(asset);
    imageLibraryList.appendChild(button);
  });
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const base64 = await fileToBase64(file);
      addImageAsset({
        id: "asset_image_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        name: file.name,
        type: "image",
        src: base64,
        createdAt: Date.now()
      });
    } catch (error) {
      console.warn("Failed to read image file", error);
    }
  }

  event.target.value = "";
}