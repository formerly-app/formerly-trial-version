// frames.js
function createFrameFromData(frameData) {
  const frameId = frameData.id;

  // Add connecting line if not the first frame
  if (frameId > 0) {
    const connectionLine = document.createElement("div");
    connectionLine.className = "connection-line";
    framesContainer.appendChild(connectionLine);
  }

  // Create transition properties box if not the first frame
  if (frameId !== 0) {
    // Create transition properties box
    const transitionBox = document.createElement("div");
    transitionBox.className = "transition-properties-box";

    // Add transition title
    const transitionTitle = document.createElement("div");
    transitionTitle.className = "transition-title";
    transitionTitle.innerText = "Transition Properties";
    transitionBox.appendChild(transitionTitle);

    // Create transition controls container
    const transitionControls = document.createElement("div");
    transitionControls.className = "transition-controls";

    // Create row for delay and duration
    const transitionRow = document.createElement("div");
    transitionRow.className = "transition-row";

    // Delay group
    const delayGroup = document.createElement("div");
    delayGroup.className = "transition-group";
    
    const delayLabel = document.createElement("label");
    delayLabel.className = "transition-label";
    delayLabel.innerText = "Delay (s)";
    delayGroup.appendChild(delayLabel);
    
    const delayInput = document.createElement("input");
    delayInput.type = "text";
    delayInput.className = "form-input transition-input-compact";
    delayInput.value = frameData.transition?.delay || 0;
    delayInput.oninput = () => { 
      frames[frameId].transition.delay = parseFloat(delayInput.value) || 0;
      saveProject();
    };
    delayGroup.appendChild(delayInput);
    transitionRow.appendChild(delayGroup);

    // Duration group
    const durationGroup = document.createElement("div");
    durationGroup.className = "transition-group";
    
    const durationLabel = document.createElement("label");
    durationLabel.className = "transition-label";
    durationLabel.innerText = "Duration (s)";
    durationGroup.appendChild(durationLabel);
    
    const durationInput = document.createElement("input");
    durationInput.type = "text";
    durationInput.className = "form-input transition-input-compact";
    durationInput.value = frameData.transition?.duration || 1;
    durationInput.oninput = () => { 
      frames[frameId].transition.duration = parseFloat(durationInput.value) || 1;
      saveProject();
    };
    durationGroup.appendChild(durationInput);
    transitionRow.appendChild(durationGroup);

    // Add the row to controls
    transitionControls.appendChild(transitionRow);

    // Easing group (separate below)
    const easingGroup = document.createElement("div");
    easingGroup.className = "transition-group";
    
    const easingLabel = document.createElement("label");
    easingLabel.className = "transition-label";
    easingLabel.innerText = "Easing";
    easingGroup.appendChild(easingLabel);
    
    const easingSelect = document.createElement("select");
    easingSelect.className = "form-input transition-input-compact";
    easingSelect.innerHTML = `
      <option value="linear">Linear</option>
      <option value="easeIn">Ease In</option>
      <option value="easeOut">Ease Out</option>
      <option value="easeInOut">Ease In Out</option>
    `;
    easingSelect.value = frameData.transition?.easing || "easeInOut";
    easingSelect.onchange = () => { 
      frames[frameId].transition.easing = easingSelect.value;
      saveProject();
    };
    easingGroup.appendChild(easingSelect);
    transitionControls.appendChild(easingGroup);

    transitionBox.appendChild(transitionControls);
    framesContainer.appendChild(transitionBox);

    // Add connecting line after transition box
    const afterTransitionLine = document.createElement("div");
    afterTransitionLine.className = "connection-line";
    framesContainer.appendChild(afterTransitionLine);
  }

  // Create main frame wrapper for vertical flow
  const frameFlowItem = document.createElement("div");
  frameFlowItem.className = "frame-flow-item";

  // Create frame label
  const label = document.createElement("div");
  label.className = "frame-label";
  label.innerText = "Frame " + (frameId + 1);

  // Add click handler to frame label
  label.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    selectFrame(frameId, canvasDiv);
  });

  // Create canvas container
  const canvasDiv = document.createElement("div");
  canvasDiv.className = "canvases";
  canvasDiv.id = "canvas-" + frameId;

  // Add frame label and canvas to flow item
  frameFlowItem.appendChild(label);
  frameFlowItem.appendChild(canvasDiv);

  // Add the frame flow item to container
  framesContainer.appendChild(frameFlowItem);

  // Create canvas and setup event handlers
  const { stage, layer } = createCanvas(canvasDiv.id);
  frames[frameId].layer = layer;
  renderFrame(layer, frameId);

  canvasDiv.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    selectFrame(frameId, canvasDiv);
  });

  // Update zoom after frame is created to handle oversized canvases
  if (typeof updateCanvasZoom === 'function') {
    updateCanvasZoom();
  }
}

function createInitialFrame() {
  const frameData = { id: 0, transition: null, background: { fill: "#ffffff" }, elements: [] };
  frames.push(frameData);
  createFrameFromData(frameData);
}

function addFrame() {
  const newFrame = {
    id: frames.length,
    transition: { delay: 0, duration: 1, easing: "easeInOut" },
    background: { fill: "#ffffff" },
    elements: []
  };
  frames.push(newFrame);
  createFrameFromData(newFrame);

  // Save after adding frame
  saveProject();
}

function duplicateFrame() {
  if (selectedFrameIndex === null) { alert("Select a frame first"); return; }
  const frameToCopy = frames[selectedFrameIndex];
  const newFrame = JSON.parse(JSON.stringify(frameToCopy));
  newFrame.id = frames.length;
  newFrame.transition = { 
    delay: frameToCopy.transition?.delay || 0,
    duration: frameToCopy.transition?.duration || 1, 
    easing: frameToCopy.transition?.easing || "easeInOut" 
  };
  frames.push(newFrame);
  createFrameFromData(newFrame);

  // Save after duplicating frame
  saveProject();
}

function deleteFrame() {
  if (selectedFrameIndex === null) { alert("Select a frame first"); return; }
  if (frames.length === 1) { alert("You must have at least one frame"); return; }
  frames.splice(selectedFrameIndex, 1);
  selectedFrameIndex = null;
  refreshFrames();
  saveProject();
}

function refreshFrames() {
  framesContainer.innerHTML = "";
  stages.length = 0;
  layers.length = 0;
  frames.forEach((frame, index) => { frame.id = index; createFrameFromData(frame); });
}