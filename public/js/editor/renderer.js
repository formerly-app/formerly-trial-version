// renderer.js
// Helper to build gradient fill properties
// originX/originY = the local-space origin of the shape (0 for rect/text, -r for centered shapes)
function buildFill(el, w, h, originX, originY) {
  if (el.gradient && el.gradient.direction !== "none") {
    const g = el.gradient;
    const ox = originX || 0;
    const oy = originY || 0;

    // Gradient spans the full bounding box of the shape.
    // For centered shapes (circle, triangle, star) ox = -w/2, oy = -h/2
    // so x1/x2 start from the left edge of the bounding box.
    let x1 = ox, y1 = oy, x2 = ox, y2 = oy;

    if (g.direction === "lr")      { x1 = ox;     x2 = ox + w; }
    else if (g.direction === "rl") { x1 = ox + w; x2 = ox;     }
    else if (g.direction === "tb") { y1 = oy;     y2 = oy + h; }
    else if (g.direction === "bt") { y1 = oy + h; y2 = oy;     }

    return {
      fillLinearGradientStartPoint: { x: x1, y: y1 },
      fillLinearGradientEndPoint:   { x: x2, y: y2 },
      fillLinearGradientColorStops: [0, g.color1 || "#000000", 1, g.color2 || "#ffffff"],
      fill: undefined
    };
  }
  return { fill: el.fill || "#000000" };
}

// Build stroke gradient props (for line / arrow)
function buildStrokeGradient(el, w, h) {
  if (el.gradient && el.gradient.direction !== "none") {
    const g = el.gradient;
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    if (g.direction === "lr")      { x2 = w;  }
    else if (g.direction === "rl") { x1 = w;  }
    else if (g.direction === "tb") { y2 = h;  }
    else if (g.direction === "bt") { y1 = h;  }

    return {
      strokeLinearGradientStartPoint: { x: x1, y: y1 },
      strokeLinearGradientEndPoint:   { x: x2, y: y2 },
      strokeLinearGradientColorStops: [0, g.color1 || "#000000", 1, g.color2 || "#ffffff"],
      stroke: null   // clear solid stroke so gradient takes over
    };
  }
  return { stroke: el.fill || "#000000" };
}

function createKonvaNodeFromElement(el) {
  const common = {
    x: el.x,
    y: el.y,
    opacity: el.opacity,
    rotation: el.rotation || 0
  };
  const scaledCommon = { ...common, scaleX: el.scaleX || 1, scaleY: el.scaleY || 1 };

  switch (el.type) {
    case "image": {
      const w = el.width || 220;
      const h = el.height || 140;
      const imageObj = new window.Image();
      imageObj.src = el.src || "";
      const node = new Konva.Image({
        ...common,
        width: w,
        height: h,
        image: imageObj
      });
      imageObj.onload = () => {
        const layer = node.getLayer();
        if (layer) layer.batchDraw();
      };
      return node;
    }

    case "text":
      return new Konva.Text({
        ...common,
        text: el.text,
        fontSize: el.fontSize || 30,
        fontFamily: el.fontFamily || "Poppins",
        fontStyle: el.fontWeight || "normal",
        fill: el.fill || "#000000",
        width: el.width || 200,
        // never set height — let Konva compute it from content
      });

    case "rect": {
      const w = el.width || 80, h = el.height || 80;
      // rect origin is top-left (0,0) — no offset needed
      const fillProps = buildFill(el, w, h, 0, 0);
      return new Konva.Rect({ ...common, width: w, height: h, ...fillProps });
    }

    case "circle": {
      const rx = el.radiusX || el.radius || 40;
      const ry = el.radiusY || el.radius || 40;
      // Ellipse is centered at (x,y) so local bounding box goes from -rx..-ry to +rx,+ry
      const fillProps = buildFill(el, rx * 2, ry * 2, -rx, -ry);
      return new Konva.Ellipse({ ...common, radiusX: rx, radiusY: ry, ...fillProps });
    }

    case "line": {
      const pts = el.points || [0, 0, 120, 0];
      const w = Math.abs(pts[2] - pts[0]);
      const h = el.strokeWidth || 4;
      const strokeProps = buildStrokeGradient(el, w, h);
      return new Konva.Line({
        ...scaledCommon,
        points: pts,
        strokeWidth: h,
        ...strokeProps
      });
    }

    case "arrow": {
      const pts = el.points || [0, 0, 120, 0];
      const w = Math.abs(pts[2] - pts[0]);
      const h = el.strokeWidth || 4;
      const strokeProps = buildStrokeGradient(el, w, h);
      return new Konva.Arrow({
        ...scaledCommon,
        points: pts,
        strokeWidth: h,
        fill: strokeProps.stroke || null,   // arrowhead fill matches stroke
        ...strokeProps
      });
    }

    case "triangle": {
      const size = el.size || 80;
      // RegularPolygon is centered at (x,y); bounding box from -size/2 to +size/2
      const fillProps = buildFill(el, size, size, -(size / 2), -(size / 2));
      return new Konva.RegularPolygon({
        ...scaledCommon,
        sides: 3,
        radius: size / 2,
        ...fillProps
      });
    }

    case "star": {
      const outer = el.outerRadius || 40;
      // Star is centered at (x,y); bounding box from -outer to +outer
      const fillProps = buildFill(el, outer * 2, outer * 2, -outer, -outer);
      return new Konva.Star({
        ...scaledCommon,
        innerRadius: el.innerRadius || 20,
        outerRadius: outer,
        numPoints: el.numPoints || 5,
        ...fillProps
      });
    }
  }
}

function getOrCreateTransformer(layer, frameIndex) {
  if (!transformers[frameIndex]) {
    const tr = new Konva.Transformer({
      borderStroke: "#4a90e2",
      borderStrokeWidth: 2,
      anchorStroke: "#4a90e2",
      anchorFill: "#ffffff",
      anchorSize: 8,
      rotateAnchorOffset: 20,
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right",
        "middle-left", "middle-right", "top-center", "bottom-center"],
    });
    layer.add(tr);
    transformers[frameIndex] = tr;
  }
  return transformers[frameIndex];
}

// Re-apply gradient to a live node after resize.
// For fill-gradient shapes: recompute start/end from current bounding-box dimensions.
// For stroke-gradient shapes (line/arrow): recompute from current points.
function reapplyGradient(node, el) {
  if (!el.gradient || el.gradient.direction === "none") return;

  if (el.type === "line" || el.type === "arrow") {
    const pts = el.points || [0, 0, 120, 0];
    const w = Math.abs(pts[2] - pts[0]) * (el.scaleX || 1);
    const h = (el.strokeWidth || 4) * (el.scaleY || 1);
    const sp = buildStrokeGradient({ ...el, gradient: el.gradient }, w, h);
    node.strokeLinearGradientStartPoint(sp.strokeLinearGradientStartPoint);
    node.strokeLinearGradientEndPoint(sp.strokeLinearGradientEndPoint);
    node.strokeLinearGradientColorStops(sp.strokeLinearGradientColorStops);
    node.stroke(null);
  } else {
    let w, h, ox, oy;
    if (el.type === "rect" || el.type === "text") {
      // For frame backgrounds, use provided dimensions if available
      w = el.width || (node ? node.width() : 80);
      h = el.height || (node ? (el.type === "text" ? node.height() : node.height()) : 80);
      ox = 0; oy = 0;
    } else if (el.type === "circle") {
      const rx = el.radiusX || el.radius || 40;
      const ry = el.radiusY || el.radius || 40;
      w = rx * 2; h = ry * 2;
      ox = -rx; oy = -ry;
    } else if (el.type === "triangle") {
      w = el.size || 80; h = el.size || 80;
      ox = -(w / 2); oy = -(h / 2);
    } else if (el.type === "star") {
      w = (el.outerRadius || 40) * 2; h = w;
      ox = -(w / 2); oy = -(h / 2);
    } else {
      return;
    }
    const fp = buildFill(el, w, h, ox, oy);
    node.fillLinearGradientStartPoint(fp.fillLinearGradientStartPoint);
    node.fillLinearGradientEndPoint(fp.fillLinearGradientEndPoint);
    node.fillLinearGradientColorStops(fp.fillLinearGradientColorStops);
    node.fill(null);
  }
}

function renderFrame(layer, frameIndex) {
  layer.destroyChildren();
  if (transformers[frameIndex]) delete transformers[frameIndex];

  const frame = frames[frameIndex];
  const stage = layer.getStage();

  // Frame background (non-interactive, always behind elements)
  const bg = frame.background || { fill: "#ffffff" };
  const bgRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    listening: false,
    name: "frame-background"
  });
  // Reuse the same fill/gradient shape as element fills
  if (bg.gradient && bg.gradient.direction !== "none") {
    const bgEl = { type: "rect", width: stage.width(), height: stage.height(), gradient: bg.gradient };
    reapplyGradient(bgRect, bgEl);
  } else {
    bgRect.fill(bg.fill || "#ffffff");
  }
  layer.add(bgRect);

  frame.elements.forEach(el => {
    const node = createKonvaNodeFromElement(el);
    if (!node) return;

    node.draggable(true);
    node.listening(true);
    node.name(el.id);
    layer.add(node);

    // ── dragmove: sync x/y to state ──
    node.on("dragmove", () => {
      el.x = Math.round(node.x());
      el.y = Math.round(node.y());
    });

    node.on("dragend", () => {
      saveProject();
    });

    // ── transform: update UI in real-time during transformation ──
    node.on("transform", () => {
      if (selectedElement && selectedElement.id === el.id) {
        updatePropertiesUI(el);
      }
    });

    // ── transformend: commit everything to state ──
    node.on("transformend", () => {
      el.x = Math.round(node.x());
      el.y = Math.round(node.y());
      el.rotation = Math.round(node.rotation());

      const sx = node.scaleX();
      const sy = node.scaleY();

      if (el.type === "text" || el.type === "image") {
        el.width = Math.round(node.width() * sx);
        el.height = Math.round(node.height() * sy);
        node.width(el.width);
        node.height(el.height);
        node.scaleX(1);
        node.scaleY(1);
      }
      else if (el.type === "rect") {
        el.width  = Math.round(node.width()  * sx);
        el.height = Math.round(node.height() * sy);
        node.width(el.width);
        node.height(el.height);
        node.scaleX(1);
        node.scaleY(1);
        // Re-apply gradient with new absolute dimensions
        if (el.gradient && el.gradient.direction !== "none") {
          reapplyGradient(node, el);
        }
      }
      else if (el.type === "circle") {
        el.radiusX = Math.round((node.radiusX ? node.radiusX() : node.radius()) * sx);
        el.radiusY = Math.round((node.radiusY ? node.radiusY() : node.radius()) * sy);
        el.radius  = Math.round((el.radiusX + el.radiusY) / 2);
        if (node.radiusX) node.radiusX(el.radiusX);
        if (node.radiusY) node.radiusY(el.radiusY);
        node.scaleX(1);
        node.scaleY(1);
        if (el.gradient && el.gradient.direction !== "none") {
          reapplyGradient(node, el);
        }
      }
      else if (el.type === "triangle" || el.type === "star") {
        el.scaleX = Math.round(sx * 100) / 100;
        el.scaleY = Math.round(sy * 100) / 100;
        node.scaleX(el.scaleX);
        node.scaleY(el.scaleY);
        // For scaled centered shapes, the gradient coords stay the same
        // (they scale with the node's own transform) — no reapply needed.
      }
      else if (el.type === "line" || el.type === "arrow") {
        el.scaleX = Math.round(sx * 100) / 100;
        el.scaleY = Math.round(sy * 100) / 100;
        node.scaleX(el.scaleX);
        node.scaleY(el.scaleY);
        if (el.gradient && el.gradient.direction !== "none") {
          reapplyGradient(node, el);
        }
      }

      node.rotation(el.rotation);

      const tr = getOrCreateTransformer(layer, frameIndex);
      tr.nodes([node]);
      layer.draw();

      if (selectedElement && selectedElement.id === el.id) updatePropertiesUI(el);
      saveProject();
    });

    node.on("mousedown", (e) => {
      e.cancelBubble = true;
      selectElement(el, frameIndex);
    });
  });

  getOrCreateTransformer(layer, frameIndex);

  stage.off("mousedown.deselect").on("mousedown.deselect", (e) => {
    if (e.target === stage) deselectElement();
  });

  layer.draw();
}