// persistence.js
const STORAGE_KEY = "anim_project_v1";

function loadProjectFromStorage() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.warn("Failed to load project from localStorage", error);
    return null;
  }
}

function getDefaultProject() {
  return {
    title: "Untitled animation",
    width: 1920,
    height: 1080,
    frames: [
      {
        id: 0,
        transition: null,
        background: { fill: "#ffffff" },
        elements: []
      }
    ],
    connections: [],
    assets: {
      images: []
    }
  };
}

function normalizeProject(rawProject = {}) {
  const project = {
    title: rawProject.title || "Untitled animation",
    width: Number.isFinite(rawProject.width) ? rawProject.width : 1920,
    height: Number.isFinite(rawProject.height) ? rawProject.height : 1080,
    frames: Array.isArray(rawProject.frames) && rawProject.frames.length > 0
      ? rawProject.frames
      : getDefaultProject().frames,
    connections: Array.isArray(rawProject.connections) ? rawProject.connections : [],
    assets: {
      images: Array.isArray(rawProject?.assets?.images) ? rawProject.assets.images : []
    }
  };
  return project;
}

function serializeProject(projectObject) {
  return {
    ...projectObject,
    frames: (projectObject.frames || []).map(frame => {
      const { layer, ...frameData } = frame;
      return {
        ...frameData,
        elements: (frameData.elements || []).map(element => ({ ...element }))
      };
    })
  };
}

function saveProjectData(projectObject) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject(projectObject)));
  } catch (error) {
    console.warn("Failed to save project to localStorage", error);
  }
}

function syncProjectCssVariables(project) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty("--project-canvas-width", project.width + "px");
  root.style.setProperty("--project-canvas-height", project.height + "px");
}

function initializeProject(serverProject = {}) {
  const stored = loadProjectFromStorage();
  if (stored) {
    const normalized = normalizeProject(stored);
    syncProjectCssVariables(normalized);
    return normalized;
  }

  const project = normalizeProject(serverProject);
  syncProjectCssVariables(project);
  saveProjectData(project);
  return project;
}

function saveProject() {
  if (typeof window === "undefined" || !window.project) return;
  saveProjectData(window.project);
}

function startAutosave() {
  if (typeof window === "undefined") return;
  setInterval(saveProject, 3000);
}

startAutosave();
