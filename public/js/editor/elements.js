// elements.js
function baseElement(type) {
  return {
    id: type + "_" + Date.now(),
    name: type + " " + Date.now(),
    type,
    x: 120,
    y: 100,
    fill: "#000000",
    opacity: 1,
    scaleX: 1,
    scaleY: 1
  };
}

function ensureProjectImages() {
  if (!project.assets) project.assets = {};
  if (!Array.isArray(project.assets.images)) project.assets.images = [];
}

function addImageAsset(imageAsset) {
  ensureProjectImages();
  project.assets.images.push(imageAsset);
  if (typeof renderImageLibrary === "function") renderImageLibrary();
  saveProject();
}

function createImageElementFromAsset(asset, options = {}) {
  return {
    ...baseElement("image"),
    x: Number.isFinite(options.x) ? options.x : 140,
    y: Number.isFinite(options.y) ? options.y : 120,
    width: Number.isFinite(options.width) ? options.width : 220,
    height: Number.isFinite(options.height) ? options.height : 140,
    src: asset.src,
    assetId: asset.id
  };
}

function addImageElementFromAsset(asset) {
  if (!asset || !asset.src) return;
  addElementToFrame(createImageElementFromAsset(asset));
}

function addElementToFrame(element) {
  if (selectedFrameIndex === null) {
    alert("Select a frame first");
    return;
  }

  const frame = frames[selectedFrameIndex];
  frame.elements.push(element);

  const layer = frames[selectedFrameIndex].layer;
  renderFrame(layer, selectedFrameIndex);
  saveProject();
}

// ELEMENT FACTORIES
function addTextElement() {
  addElementToFrame({
    ...baseElement("text"),
    text: "New Text",
    fontSize: 24
  });
}

function addHeadingTextElement() {
  addElementToFrame({
    ...baseElement("text"),
    text: "Heading Text",
    fontSize: 40,
    fontWeight: "bold"
  });
}

function addSubheadingTextElement() {
  addElementToFrame({
    ...baseElement("text"),
    text: "Sub-heading Text",
    fontSize: 32,
    fontWeight: "600"
  });
}

function addBodyTextElement() {
  addElementToFrame({
    ...baseElement("text"),
    text: "Body Text",
    fontSize: 25,
    fontWeight: "normal"
  });
}

function addRectElement() {
  addElementToFrame({
    ...baseElement("rect"),
    width: 80,
    height: 80
  });
}

function addCircleElement() {
  addElementToFrame({
    ...baseElement("circle"),
    radius: 40,
    radiusX: 40,
    radiusY: 40
  });
}

function addTriangleElement() {
  addElementToFrame({
    ...baseElement("triangle"),
    size: 80
  });
}

function addLineElement() {
  addElementToFrame({
    ...baseElement("line"),
    points: [0, 0, 120, 0],
    strokeWidth: 4
  });
}

function addArrowElement() {
  addElementToFrame({
    ...baseElement("arrow"),
    points: [0, 0, 120, 0],
    strokeWidth: 4
  });
}

function addStarElement() {
  addElementToFrame({
    ...baseElement("star"),
    innerRadius: 20,
    outerRadius: 40,
    numPoints: 5
  });
}