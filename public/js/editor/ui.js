// ui.js
document.querySelector(".add-frame-btn").onclick = addFrame;

document.querySelector(".play-btn").onclick = showPreviewModal;
document.querySelector(".export-btn").onclick = startExport;

addHeadingTextBtn.onclick = addHeadingTextElement;
addSubheadingTextBtn.onclick = addSubheadingTextElement;
addBodyTextBtn.onclick = addBodyTextElement;
addRectBtn.onclick = addRectElement;
addCircleBtn.onclick = addCircleElement;
addTriangleBtn.onclick = addTriangleElement;
addLineBtn.onclick = addLineElement;
addArrowBtn.onclick = addArrowElement;
addStarBtn.onclick = addStarElement;

if (imageUploadInput) {
  imageUploadInput.onchange = handleImageUpload;
}

renderImageLibrary();