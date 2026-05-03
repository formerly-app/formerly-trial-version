// interpolation.js
// Shared size/geometry interpolation helpers for preview and export.

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function getNumber(value, fallback) {
  return isFiniteNumber(value) ? value : fallback;
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getCompatiblePoints(startPoints, endPoints) {
  if (!Array.isArray(startPoints) || !Array.isArray(endPoints)) return null;
  if (startPoints.length !== endPoints.length || startPoints.length === 0) return null;
  for (let i = 0; i < startPoints.length; i++) {
    if (!isFiniteNumber(startPoints[i]) || !isFiniteNumber(endPoints[i])) return null;
  }
  return { start: startPoints, end: endPoints };
}

function getSizeTweenProps(startEl, endEl) {
  if (!startEl || !endEl || startEl.type !== endEl.type) return {};
  const type = startEl.type;

  switch (type) {
    case "rect":
    case "image":
      return {
        width: getNumber(endEl.width, getNumber(startEl.width, 0)),
        height: getNumber(endEl.height, getNumber(startEl.height, 0)),
        scaleX: getNumber(endEl.scaleX, getNumber(startEl.scaleX, 1)),
        scaleY: getNumber(endEl.scaleY, getNumber(startEl.scaleY, 1))
      };

    case "text":
      return {
        scaleX: getNumber(endEl.scaleX, getNumber(startEl.scaleX, 1)),
        scaleY: getNumber(endEl.scaleY, getNumber(startEl.scaleY, 1))
      };

    case "circle": {
      const endRadiusX = getNumber(endEl.radiusX, getNumber(endEl.radius, getNumber(startEl.radiusX, getNumber(startEl.radius, 40))));
      const endRadiusY = getNumber(endEl.radiusY, getNumber(endEl.radius, getNumber(startEl.radiusY, getNumber(startEl.radius, 40))));
      return {
        radiusX: endRadiusX,
        radiusY: endRadiusY,
        scaleX: getNumber(endEl.scaleX, getNumber(startEl.scaleX, 1)),
        scaleY: getNumber(endEl.scaleY, getNumber(startEl.scaleY, 1))
      };
    }

    case "triangle":
      return {
        radius: getNumber(endEl.size, getNumber(startEl.size, 80)) / 2,
        scaleX: getNumber(endEl.scaleX, getNumber(startEl.scaleX, 1)),
        scaleY: getNumber(endEl.scaleY, getNumber(startEl.scaleY, 1))
      };

    case "star":
      return {
        innerRadius: getNumber(endEl.innerRadius, getNumber(startEl.innerRadius, 20)),
        outerRadius: getNumber(endEl.outerRadius, getNumber(startEl.outerRadius, 40)),
        scaleX: getNumber(endEl.scaleX, getNumber(startEl.scaleX, 1)),
        scaleY: getNumber(endEl.scaleY, getNumber(startEl.scaleY, 1))
      };

    case "line":
    case "arrow": {
      const compatiblePoints = getCompatiblePoints(startEl.points, endEl.points);
      const props = {
        scaleX: getNumber(endEl.scaleX, getNumber(startEl.scaleX, 1)),
        scaleY: getNumber(endEl.scaleY, getNumber(startEl.scaleY, 1))
      };
      if (compatiblePoints) {
        props.points = [...compatiblePoints.end];
      }
      if (isFiniteNumber(endEl.strokeWidth) || isFiniteNumber(startEl.strokeWidth)) {
        props.strokeWidth = getNumber(endEl.strokeWidth, getNumber(startEl.strokeWidth, 4));
      }
      return props;
    }

    default:
      return {};
  }
}

function applyNodeProps(node, props) {
  if (!node || !props) return;
  Object.keys(props).forEach((key) => {
    const value = props[key];
    if (key === "points" && Array.isArray(value) && typeof node.points === "function") {
      node.points(value);
      return;
    }
    if (typeof node[key] === "function" && value !== undefined) {
      node[key](value);
    }
  });
}

function hasGradientToSync(startEl, endEl) {
  return Boolean(
    (startEl && startEl.gradient && startEl.gradient.direction !== "none") ||
    (endEl && endEl.gradient && endEl.gradient.direction !== "none")
  );
}

function getGradientSourceElement(startEl, endEl) {
  if (endEl && endEl.gradient && endEl.gradient.direction !== "none") return endEl;
  if (startEl && startEl.gradient && startEl.gradient.direction !== "none") return startEl;
  return null;
}

function syncGradientForCurrentNode(node, startEl, endEl) {
  const gradientSource = getGradientSourceElement(startEl, endEl);
  if (!node || !gradientSource || typeof reapplyGradient !== "function") return;

  const type = startEl?.type || endEl?.type;
  const gradientEl = { type, gradient: gradientSource.gradient };

  if (type === "rect" || type === "text" || type === "image") {
    gradientEl.width = getNumber(node.width ? node.width() * getNumber(node.scaleX ? node.scaleX() : 1, 1) : undefined, 0);
    gradientEl.height = getNumber(node.height ? node.height() * getNumber(node.scaleY ? node.scaleY() : 1, 1) : undefined, 0);
  } else if (type === "circle") {
    gradientEl.radiusX = node.radiusX ? node.radiusX() : (node.radius ? node.radius() : undefined);
    gradientEl.radiusY = node.radiusY ? node.radiusY() : (node.radius ? node.radius() : undefined);
    gradientEl.radius = getNumber(gradientEl.radiusX, getNumber(gradientEl.radiusY, 40));
  } else if (type === "triangle") {
    gradientEl.size = node.radius ? node.radius() * 2 : getNumber(endEl?.size, getNumber(startEl?.size, 80));
  } else if (type === "star") {
    gradientEl.innerRadius = node.innerRadius ? node.innerRadius() : getNumber(endEl?.innerRadius, getNumber(startEl?.innerRadius, 20));
    gradientEl.outerRadius = node.outerRadius ? node.outerRadius() : getNumber(endEl?.outerRadius, getNumber(startEl?.outerRadius, 40));
  } else if (type === "line" || type === "arrow") {
    gradientEl.points = node.points ? node.points() : (endEl?.points || startEl?.points || [0, 0, 120, 0]);
    gradientEl.strokeWidth = node.strokeWidth ? node.strokeWidth() : getNumber(endEl?.strokeWidth, getNumber(startEl?.strokeWidth, 4));
    gradientEl.scaleX = node.scaleX ? node.scaleX() : getNumber(endEl?.scaleX, getNumber(startEl?.scaleX, 1));
    gradientEl.scaleY = node.scaleY ? node.scaleY() : getNumber(endEl?.scaleY, getNumber(startEl?.scaleY, 1));
  }

  reapplyGradient(node, gradientEl);
}

function applyInterpolatedSizeState(node, startEl, endEl, progress) {
  if (!node || !startEl || !endEl || startEl.type !== endEl.type) return;
  const type = startEl.type;

  if (type === "rect" || type === "image" || type === "text") {
    const startWidth = getNumber(startEl.width, getNumber(endEl.width, 0));
    const endWidth = getNumber(endEl.width, startWidth);
    const startHeight = getNumber(startEl.height, getNumber(endEl.height, 0));
    const endHeight = getNumber(endEl.height, startHeight);
    const startScaleX = getNumber(startEl.scaleX, 1);
    const endScaleX = getNumber(endEl.scaleX, startScaleX);
    const startScaleY = getNumber(startEl.scaleY, 1);
    const endScaleY = getNumber(endEl.scaleY, startScaleY);

    applyNodeProps(node, {
      width: lerp(startWidth, endWidth, progress),
      height: lerp(startHeight, endHeight, progress),
      scaleX: lerp(startScaleX, endScaleX, progress),
      scaleY: lerp(startScaleY, endScaleY, progress)
    });
  } else if (type === "circle") {
    const startRadiusX = getNumber(startEl.radiusX, getNumber(startEl.radius, getNumber(endEl.radiusX, getNumber(endEl.radius, 40))));
    const endRadiusX = getNumber(endEl.radiusX, getNumber(endEl.radius, startRadiusX));
    const startRadiusY = getNumber(startEl.radiusY, getNumber(startEl.radius, getNumber(endEl.radiusY, getNumber(endEl.radius, 40))));
    const endRadiusY = getNumber(endEl.radiusY, getNumber(endEl.radius, startRadiusY));
    const startScaleX = getNumber(startEl.scaleX, 1);
    const endScaleX = getNumber(endEl.scaleX, startScaleX);
    const startScaleY = getNumber(startEl.scaleY, 1);
    const endScaleY = getNumber(endEl.scaleY, startScaleY);

    applyNodeProps(node, {
      radiusX: lerp(startRadiusX, endRadiusX, progress),
      radiusY: lerp(startRadiusY, endRadiusY, progress),
      scaleX: lerp(startScaleX, endScaleX, progress),
      scaleY: lerp(startScaleY, endScaleY, progress)
    });
  } else if (type === "triangle") {
    const startSize = getNumber(startEl.size, getNumber(endEl.size, 80));
    const endSize = getNumber(endEl.size, startSize);
    const startScaleX = getNumber(startEl.scaleX, 1);
    const endScaleX = getNumber(endEl.scaleX, startScaleX);
    const startScaleY = getNumber(startEl.scaleY, 1);
    const endScaleY = getNumber(endEl.scaleY, startScaleY);

    applyNodeProps(node, {
      radius: lerp(startSize, endSize, progress) / 2,
      scaleX: lerp(startScaleX, endScaleX, progress),
      scaleY: lerp(startScaleY, endScaleY, progress)
    });
  } else if (type === "star") {
    const startInner = getNumber(startEl.innerRadius, getNumber(endEl.innerRadius, 20));
    const endInner = getNumber(endEl.innerRadius, startInner);
    const startOuter = getNumber(startEl.outerRadius, getNumber(endEl.outerRadius, 40));
    const endOuter = getNumber(endEl.outerRadius, startOuter);
    const startScaleX = getNumber(startEl.scaleX, 1);
    const endScaleX = getNumber(endEl.scaleX, startScaleX);
    const startScaleY = getNumber(startEl.scaleY, 1);
    const endScaleY = getNumber(endEl.scaleY, startScaleY);

    applyNodeProps(node, {
      innerRadius: lerp(startInner, endInner, progress),
      outerRadius: lerp(startOuter, endOuter, progress),
      scaleX: lerp(startScaleX, endScaleX, progress),
      scaleY: lerp(startScaleY, endScaleY, progress)
    });
  } else if (type === "line" || type === "arrow") {
    const startScaleX = getNumber(startEl.scaleX, 1);
    const endScaleX = getNumber(endEl.scaleX, startScaleX);
    const startScaleY = getNumber(startEl.scaleY, 1);
    const endScaleY = getNumber(endEl.scaleY, startScaleY);
    const startStroke = getNumber(startEl.strokeWidth, getNumber(endEl.strokeWidth, 4));
    const endStroke = getNumber(endEl.strokeWidth, startStroke);
    const compatiblePoints = getCompatiblePoints(startEl.points, endEl.points);

    const props = {
      scaleX: lerp(startScaleX, endScaleX, progress),
      scaleY: lerp(startScaleY, endScaleY, progress),
      strokeWidth: lerp(startStroke, endStroke, progress)
    };
    if (compatiblePoints) {
      props.points = compatiblePoints.start.map((startValue, index) =>
        lerp(startValue, compatiblePoints.end[index], progress)
      );
    }
    applyNodeProps(node, props);
  }

  if (hasGradientToSync(startEl, endEl)) {
    syncGradientForCurrentNode(node, startEl, endEl);
  }
}
