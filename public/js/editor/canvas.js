// canvas.js
function createCanvas(containerId) {
  const stage = new Konva.Stage({
    container: containerId,
    width: width,
    height: height
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  stages.push(stage);
  layers.push(layer);

  return { stage, layer };
}