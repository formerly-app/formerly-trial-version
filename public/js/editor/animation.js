// animation.js
function playAnimation() {
  if (frames.length < 2) { alert("You need at least 2 frames to animate."); return; }
  if (frames[0].elements.length === 0) { alert("Add at least one text element to animate."); return; }

  layerPreview.destroyChildren();

  // Frame background (per-frame), stored using the same fill/gradient shape as elements.
  const bgRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: stagePreview.width(),
    height: stagePreview.height(),
    listening: false
  });
  layerPreview.add(bgRect);
  applyFrameBackgroundToRect(bgRect, frames[0]);
  const previewNodes = {};

  frames[0].elements.forEach(el => {
    const node = createKonvaNodeFromElement(el);
    node.rotation(el.rotation || 0);
    node.draggable(false);
    layerPreview.add(node);
    previewNodes[el.name] = node;
  });
  layerPreview.draw();

  const timeline = gsap.timeline({ onUpdate: () => layerPreview.draw() });

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
      layerPreview.draw();
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
        layerPreview.add(node);
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

function applyFrameBackgroundToRect(rect, frame) {
  const bg = frame.background || { fill: "#ffffff" };
  const w = rect.width();
  const h = rect.height();

  if (bg.gradient && bg.gradient.direction !== "none") {
    // For export, use original canvas dimensions for gradient calculation
    // to avoid scaling issues with exportScale
    const isExporting = stagePreview.scaleX() !== 1;
    const gradientWidth = isExporting ? stagePreview.width() / stagePreview.scaleX() : w;
    const gradientHeight = isExporting ? stagePreview.height() / stagePreview.scaleY() : h;
    
    const bgEl = { type: "rect", width: gradientWidth, height: gradientHeight, gradient: bg.gradient };
    reapplyGradient(rect, bgEl, stagePreview.scaleX());
  } else {
    clearGradientFromNode(rect, { type: "rect" });
    rect.fill(bg.fill || "#ffffff");
  }
}

function startExport() {
  if (frames.length < 2) { alert("You need at least 2 frames to export."); return; }
  if (frames[0].elements.length === 0) { alert("Add at least one text element to export."); return; }

  const originalWidth = stagePreview.width();
  const originalHeight = stagePreview.height();
  const originalScale = stagePreview.scaleX();
  
  // Adaptive export scale based on canvas size
  const maxDimension = Math.max(originalWidth, originalHeight);
  let exportScale;
  let fps;
  
  if (maxDimension <= 500) {
    exportScale = 4;  // Small canvases: maintain current quality
    fps = 60;
  } else if (maxDimension <= 1000) {
    exportScale = 2;  // Medium canvases: balanced performance
    fps = 45;
  } else {
    exportScale = 1.5; // Large canvases: optimized performance
    fps = 30;
  }
  
  // No frame skipping - preserve exact timing
  let frameSkip = 1;
  if (maxDimension > 800) {
    fps = 60; // Keep 60fps for smoothness
  }
  
  // Ensure minimum 1080p export resolution
  const exportWidth = originalWidth * exportScale;
  const exportHeight = originalHeight * exportScale;
  if (exportWidth < 1920 && exportHeight < 1080) {
    const minScale = Math.max(1920 / originalWidth, 1080 / originalHeight);
    exportScale = Math.max(exportScale, minScale);
  }

  stagePreview.width(originalWidth * exportScale);
  stagePreview.height(originalHeight * exportScale);
  stagePreview.scale({ x: exportScale, y: exportScale });

  layerPreview.destroyChildren();
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: stagePreview.width(),
    height: stagePreview.height(),
    listening: false
  });
  layerPreview.add(background);
  applyFrameBackgroundToRect(background, frames[0]);

  const exportNodes = {};
  frames[0].elements.forEach(el => {
    const node = createKonvaNodeFromElement(el);
    node.rotation(el.rotation || 0);
    layerPreview.add(node); 
    exportNodes[el.name] = node;
  });
  layerPreview.draw();

  const canvas = layerPreview.getCanvas()._canvas;
  const capturer = new CCapture({ format: "webm", framerate: fps });
  
  // Show export progress feedback
  const exportBtn = document.querySelector(".export-btn");
  const originalBtnText = exportBtn.innerHTML;
  exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
  exportBtn.disabled = true;
  
  // Show progress notification
  const progressNotification = document.createElement('div');
  progressNotification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  progressNotification.innerHTML = `<i class="fas fa-download"></i> Starting export...`;
  document.body.appendChild(progressNotification);
  
  // Optimize canvas for export
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  capturer.start();

  // Precompute cumulative times for each transition
  const transitionTimes = [];
  let cumulativeTime = 0;
  for (let i = 1; i < frames.length; i++) {
    const transition = frames[i].transition || {};
    const delay = transition.delay || 0;
    const duration = transition.duration || 1;
    transitionTimes.push({
      startFrame: i - 1,
      endFrame: i,
      delay,
      duration,
      startTime: cumulativeTime,
      endTime: cumulativeTime + delay + duration
    });
    cumulativeTime += delay + duration;
  }

  const totalDuration = cumulativeTime;
  const totalExportFrames = Math.ceil(totalDuration * fps);

  for (let frameIdx = 0; frameIdx <= totalExportFrames; frameIdx++) {
    const time = frameIdx / fps;
    
    // Only capture every Nth frame for performance
    if (frameIdx % frameSkip !== 0) {
      continue;
    }

    // Update progress every 20 frames to avoid DOM updates slowing down export
    if (frameIdx % 20 === 0) {
      const actualFramesProcessed = Math.floor(frameIdx / frameSkip);
      const totalFramesToProcess = Math.floor(totalExportFrames / frameSkip);
      const progress = Math.round((actualFramesProcessed / totalFramesToProcess) * 100);
      progressNotification.innerHTML = `<i class="fas fa-download"></i> Exporting... ${progress}%`;
    }

    // Find which transition we're in (if any)
    let activeTransition = null;
    for (const t of transitionTimes) {
      if (time >= t.startTime && time <= t.endTime) {
        activeTransition = t;
        break;
      }
    }

    if (activeTransition) {
      const transitionStart = activeTransition.startTime;
      const delay = activeTransition.delay;
      const duration = activeTransition.duration;
      const relativeTime = time - transitionStart;

      let progress;
      if (relativeTime < delay) {
        progress = 0; // still in delay period
      } else {
        progress = Math.min(1, (relativeTime - delay) / duration);
      }

      const eased = gsap.parseEase(getEase(frames[activeTransition.endFrame].transition?.easing || "easeInOut"))(progress);

      const startFrame = frames[activeTransition.startFrame];
      const endFrame = frames[activeTransition.endFrame];

      // Background: during delay show start frame, during transition show end frame.
      applyFrameBackgroundToRect(background, relativeTime < delay ? startFrame : endFrame);

      const startMap = getElementMapByName(startFrame);
      const endMap = getElementMapByName(endFrame);
      const allNames = new Set([...Object.keys(startMap), ...Object.keys(endMap)]);

      allNames.forEach(name => {
        let node = exportNodes[name];
        if (!node && endMap[name]) {
          node = createKonvaNodeFromElement(endMap[name]);
          layerPreview.add(node);
          exportNodes[name] = node;
        }

        const start = startMap[name];
        const end = endMap[name];

        if (start && end) {
          if (relativeTime < delay) {
            // Still in delay: show start position
            node.x(start.x);
            node.y(start.y);
            node.opacity(1);
          } else {
            node.x(start.x + (end.x - start.x) * eased);
            node.y(start.y + (end.y - start.y) * eased);
            node.opacity(1);
          }
        } else if (start && !end) {
          // Element disappears
          node.opacity(relativeTime < delay ? 1 : 1 - eased);
        } else if (!start && end) {
          // New element appears
          if (relativeTime < delay) {
            node.opacity(0);
            node.x(end.x);
            node.y(end.y);
          } else {
            node.opacity(eased);
            node.x(end.x);
            node.y(end.y);
          }
        }
      });
    } else if (frameIdx === 0) {
      // Before first transition - show first frame
      applyFrameBackgroundToRect(background, frames[0]);
      const startMap = getElementMapByName(frames[0]);
      Object.keys(exportNodes).forEach(name => {
        const node = exportNodes[name];
        const el = startMap[name];
        if (el) {
          node.x(el.x);
          node.y(el.y);
          node.opacity(1);
        } else {
          node.opacity(0);
        }
      });
    } else if (time >= totalDuration) {
      // After last transition - show last frame
      const lastFrame = frames[frames.length - 1];
      applyFrameBackgroundToRect(background, lastFrame);
      const lastMap = getElementMapByName(lastFrame);
      Object.keys(exportNodes).forEach(name => {
        const node = exportNodes[name];
        const el = lastMap[name];
        if (el) {
          node.x(el.x);
          node.y(el.y);
          node.opacity(1);
        } else {
          node.opacity(0);
        }
      });
    }

    layerPreview.draw();
    capturer.capture(canvas);
  }

  capturer.stop();
  capturer.save();

  // Clean up UI and show success message
  progressNotification.innerHTML = '<i class="fas fa-check"></i> Export completed!';
  progressNotification.style.background = '#2196F3';
  
  setTimeout(() => {
    document.body.removeChild(progressNotification);
    exportBtn.innerHTML = originalBtnText;
    exportBtn.disabled = false;
  }, 3000);

  stagePreview.width(originalWidth);
  stagePreview.height(originalHeight);
  stagePreview.scale({ x: originalScale, y: originalScale });
  layerPreview.draw();
}