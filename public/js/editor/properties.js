// properties.js
const propOpacity = document.getElementById("prop-opacity");
const propRotate = document.getElementById("prop-rotate");
const propWidth = document.getElementById("prop-width");
const propHeight = document.getElementById("prop-height");
const propColor1 = document.getElementById("prop-color1");
const propColor2 = document.getElementById("prop-color2");
const propGradientDir = document.getElementById("prop-gradient-direction");

// Add after propFontWeight declaration
const propTextContent = document.getElementById("prop-text-content");
const propFontSize = document.getElementById("prop-fontsize");
const propFontFamily = document.getElementById("prop-fontfamily");
const propFontWeight = document.getElementById("prop-fontweight");

const deleteElementBtn = document.getElementById("delete-element-btn");

function toRoundedInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function getDisplaySize(el) {
  switch (el.type) {
    case "image":
      return { w: el.width || 0, h: el.height || 0 };
    case "text": {
      // Read live node dimensions so height is real (Konva auto-computes text height)
      const node = selectedNode;
      const w = node ? Math.round(node.width()) : (el.width || 0);
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
        h: Math.round((el.strokeWidth || 4) * scy)   // height = stroke thickness
      };
    }
    default:
      return { w: 0, h: 0 };
  }
}

function updatePropertiesUI(el) {
  propOpacity.value = toRoundedInt((el.opacity ?? 1) * 100, 100);
  propRotate.value = toRoundedInt(el.rotation, 0);

  const { w, h } = getDisplaySize(el);
  propWidth.value = w;
  propHeight.value = h;

  if (el.type === "text") {
    propColor1.value = el.fill || "#000000";
    propColor2.value = "#ffffff";
    propColor2.disabled = true;
    propGradientDir.value = "none";
  } else {
    if (el.gradient && el.gradient.direction !== "none") {
      propColor1.value = el.gradient.color1 || "#000000";
      propColor2.value = el.gradient.color2 || "#ffffff";
      propGradientDir.value = el.gradient.direction;
      propColor2.disabled = false;
    } else {
      propColor1.value = el.fill || "#000000";
      propColor2.value = "#ffffff";
      propGradientDir.value = "none";
      propColor2.disabled = true;
    }
  }

  if (el.type === "text") {
    propFontSize.value = el.fontSize || 30;
    propFontFamily.value = el.fontFamily || "Poppins";
    propFontWeight.value = el.fontWeight || "normal";
    propTextContent.value = el.text || "";
    document.getElementById("text-section").style.display = "block";
  } else {
    document.getElementById("text-section").style.display = "none";
  }
}

function applyGradientToNode(node, el) {
  // Get current dimensions of the node
  let w = 0, h = 0;
  
  // Get accurate dimensions based on element type
  if (el.type === "rect") {
    w = el.width || 80;
    h = el.height || 80;
  } else if (el.type === "circle") {
    w = (el.radiusX || el.radius || 40) * 2;
    h = (el.radiusY || el.radius || 40) * 2;
  } else if (el.type === "triangle") {
    w = el.size || 80;
    h = el.size || 80;
  } else if (el.type === "star") {
    w = (el.outerRadius || 40) * 2;
    h = (el.outerRadius || 40) * 2;
  } else if (el.type === "line" || el.type === "arrow") {
    const pts = el.points || [0, 0, 120, 0];
    w = Math.abs(pts[2] - pts[0]);
    h = el.strokeWidth || 4;
  } else if (el.type === "text") {
    w = el.width || 200;
    h = node ? node.height() : 50;
  }
  
  const g = el.gradient;
  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  
  // Make gradient span the ENTIRE width/height
  if (g.direction === "lr") { 
    x2 = w; 
  }
  else if (g.direction === "rl") { 
    x1 = w; 
  }
  else if (g.direction === "tb") { 
    y2 = h; 
  }
  else if (g.direction === "bt") { 
    y1 = h; 
  }

  if (el.type === "line" || el.type === "arrow") {
    // Lines/arrows are stroked — apply gradient to stroke
    node.strokeLinearGradientStartPoint({ x: x1, y: y1 });
    node.strokeLinearGradientEndPoint({ x: x2, y: y2 });
    node.strokeLinearGradientColorStops([0, g.color1, 1, g.color2]);
    node.stroke(null);
  } else {
    node.fillLinearGradientStartPoint({ x: x1, y: y1 });
    node.fillLinearGradientEndPoint({ x: x2, y: y2 });
    node.fillLinearGradientColorStops([0, g.color1, 1, g.color2]);
    node.fill(null);
  }
}

function clearGradientFromNode(node, el) {
  node.fillLinearGradientColorStops(null);
  node.fillLinearGradientStartPoint({ x: 0, y: 0 });
  node.fillLinearGradientEndPoint({ x: 0, y: 0 });
  // Also clear stroke gradient for line/arrow
  if (el && (el.type === "line" || el.type === "arrow")) {
    node.strokeLinearGradientColorStops(null);
    node.strokeLinearGradientStartPoint({ x: 0, y: 0 });
    node.strokeLinearGradientEndPoint({ x: 0, y: 0 });
  }
}

function bindProperties(el, layer) {
  if (!el) return;

  propOpacity.oninput = () => {
    el.opacity = propOpacity.value / 100;
    if (selectedNode) selectedNode.opacity(el.opacity);
    layer.draw();
    saveProject();
  };

  propRotate.oninput = () => {
    el.rotation = toRoundedInt(propRotate.value, 0);
    propRotate.value = el.rotation;
    if (selectedNode) selectedNode.rotation(el.rotation);
    layer.draw();
    saveProject();
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
      el.radius = Math.round((el.radiusX + (el.radiusY || el.radiusX)) / 2);
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
    layer.draw();
    saveProject();
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
      el.radius = Math.round(((el.radiusX || el.radiusY) + el.radiusY) / 2);
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
    // text height is auto — don't set it manually
    layer.draw();
    saveProject();
  };

  // COLOR / GRADIENT
  function applyColor() {
    if (el.type === "text") {
      el.fill = propColor1.value;
      if (selectedNode) { clearGradientFromNode(selectedNode, el); selectedNode.fill(el.fill); }
    } else {
      if (propGradientDir.value === "none") {
        el.fill = propColor1.value;
        delete el.gradient;
        if (selectedNode) { clearGradientFromNode(selectedNode, el); selectedNode.fill(el.fill); }
      } else {
        el.gradient = { color1: propColor1.value, color2: propColor2.value, direction: propGradientDir.value };
        delete el.fill;
        if (selectedNode) applyGradientToNode(selectedNode, el);
      }
    }
    layer.draw();
    saveProject();
  }

  propColor1.oninput = applyColor;
  propColor2.oninput = applyColor;
  propGradientDir.onchange = () => {
    propColor2.disabled = (propGradientDir.value === "none");
    applyColor();
  };

  if (el.type === "text") {
    propTextContent.oninput = () => {
      el.text = propTextContent.value;          // newlines are preserved as-is
      if (selectedNode) {
        selectedNode.text(el.text);
        propHeight.value = Math.round(selectedNode.height()); // height grows with lines
      }
      layer.draw();
      saveProject();
    };

    propFontSize.oninput = () => {
      el.fontSize = toRoundedInt(propFontSize.value, 30);
      propFontSize.value = el.fontSize;
      if (selectedNode) {
        selectedNode.fontSize(el.fontSize);
        propHeight.value = Math.round(selectedNode.height()); // FIX: sync height live
      }
      layer.draw();
      saveProject();
    };
    propFontFamily.onchange = () => {
      el.fontFamily = propFontFamily.value;
      if (selectedNode) selectedNode.fontFamily(el.fontFamily);
      layer.draw();
      saveProject();
    };
    propFontWeight.onchange = () => {
      el.fontWeight = propFontWeight.value;
      if (selectedNode) selectedNode.fontStyle(el.fontWeight);
      layer.draw();
      saveProject();
    };
  }
}

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