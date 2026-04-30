// utils.js
function getEase(easing){
  return easing === "linear" ? "none" :
         easing === "easeIn" ? "power2.in" :
         easing === "easeOut" ? "power2.out" :
         "power2.inOut";
}

function getElementMapByName(frame) {
  const map = {};
  frame.elements.forEach(el => { if (el.name) map[el.name] = el; });
  return map;
}