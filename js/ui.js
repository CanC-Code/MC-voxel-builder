export function initUI(state) {

  const menu = document.getElementById("menu");
  document.getElementById("toggleMenu").onclick = () => {
    menu.classList.toggle("collapsed");
  };

  // ---------- Mode Buttons ----------
  const modeButtons = {
    sculpt: document.getElementById("toolSculpt"),
    move: document.getElementById("toolMove"),
    rotate: document.getElementById("toolRotate"),
    scale: document.getElementById("toolScale"),
  };

  Object.entries(modeButtons).forEach(([mode, btn]) => {
    btn.onclick = () => {
      state.setMode(mode);
      Object.values(modeButtons).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  // ---------- Wireframe ----------
  document.getElementById("toggleWire").onclick = () => {
    state.toggleWireframe();
  };

  // ---------- Model ----------
  document.getElementById("newCube").onclick = state.createCube;
  document.getElementById("newSphere").onclick = state.createSphere;

  // ---------- Sculpt Tools ----------
  document.getElementById("toolInflate").onclick = () => state.brush.setTool("inflate");
  document.getElementById("toolDeflate").onclick = () => state.brush.setTool("deflate");
  document.getElementById("toolSmooth").onclick = () => state.brush.setTool("smooth");
  document.getElementById("toolFlatten").onclick = () => state.brush.setTool("flatten");
  document.getElementById("toolPinch").onclick = () => state.brush.setTool("pinch");

  // ---------- Sliders ----------
  document.getElementById("brushSize").oninput = e =>
    state.brush.setRadius(parseFloat(e.target.value));

  document.getElementById("brushStrength").oninput = e =>
    state.brush.setStrength(parseFloat(e.target.value));

  // ---------- Export ----------
  document.getElementById("exportGLTF").onclick = state.exportGLTF;
}