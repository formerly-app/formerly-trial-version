// state.js
function getInitialProject() {
  const serverProject = getServerProject();
  if (typeof window !== "undefined" && typeof initializeProject === "function") {
    return initializeProject(serverProject);
  }
  return serverProject;
}

function getServerProject() {
  // Preferred: JSON payload from server-rendered EJS
  const el = typeof document !== "undefined" ? document.getElementById("project-data") : null;
  if (el && el.textContent) {
    try {
      return JSON.parse(el.textContent);
    } catch (_) {
      // fall through to other sources
    }
  }

  // Back-compat: older pages may have set a global
  if (typeof window !== "undefined" && window.__PROJECT__) {
    return window.__PROJECT__;
  }

  return {};
}

const __project = getInitialProject();
// Keep `width`/`height` globals: other modules depend on them (e.g. canvas.js).
const width = Number.isFinite(__project.width) ? __project.width : 1920;
const height = Number.isFinite(__project.height) ? __project.height : 1080;

const frames = Array.isArray(__project.frames) ? __project.frames : [];
let selectedFrameIndex = null;

let selectedElement = null;
let selectedLayer = null;
let selectedNode = null;

// One Konva.Transformer per frame layer, keyed by frameIndex
const transformers = {};

const stages = [];
const layers = [];

const project = {
  ...(typeof __project === "object" && __project !== null ? __project : {}),
  width,
  height,
  frames,
  connections: Array.isArray(__project.connections) ? __project.connections : [],
  assets: {
    images: Array.isArray(__project?.assets?.images) ? __project.assets.images : []
  }
};

window.project = project;

// DOM references
const framesContainer = document.querySelector("#frames-container");
const addFrameBtn = document.querySelector(".add-frame-btn");
const duplicateBtn = document.querySelector(".duplicate-frame-btn");
const deleteBtn = document.querySelector(".delete-frame-btn");

const addTextBtn = document.querySelector(".add-text-btn");
const addHeadingTextBtn = document.getElementById("add-heading-text-btn");
const addSubheadingTextBtn = document.getElementById("add-subheading-text-btn");
const addBodyTextBtn = document.getElementById("add-body-text-btn");
const addRectBtn = document.querySelector(".add-rect-btn");
const addCircleBtn = document.querySelector(".add-circle-btn");
const addTriangleBtn = document.querySelector(".add-triangle-btn");
const addLineBtn = document.querySelector(".add-line-btn");
const addArrowBtn = document.querySelector(".add-arrow-btn");
const addStarBtn = document.querySelector(".add-star-btn");
const imageUploadInput = document.getElementById("image-upload-input");
const imageLibraryList = document.getElementById("image-library-list");

const nameInput = document.getElementById("prop-name-input");

// Preview stage/layer
let stagePreview;
let layerPreview;

// Modal preview stage/layer
let stagePreviewModal;
let layerPreviewModal;

// Make stages globally accessible for debugging
window.stages = stages;
window.stagePreviewModal = stagePreviewModal;
window.stagePreview = stagePreview;