export function initUI(state) {
  const menu = document.getElementById("menu");

  document.getElementById("toggleMenu").onclick = () =>
    menu.classList.toggle("collapsed");

  document.getElementById("toggleWire").onclick = () =>
    state.toggleWireframe();

  // Mode buttons
  const modes = {
    modeSculpt: "sculpt",
    modeMove: "translate",
    modeRotate: "rotate",
    modeScale: "scale"
  };

  Object.entries(modes).forEach(([id, mode]) => {
    const btn = document.getElementById(id);
    btn.onclick = () => {
      document.querySelectorAll(".tool").forEach(b =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      state.setTransformMode(mode);
    };
  });

  document.getElementById("newCube").onclick = state.createCube;
  document.getElementById("newSphere").onclick = state.createSphere;

  document.getElementById("toolInflate").onclick = () => state.setTool("inflate");
  document.getElementById("toolDeflate").onclick = () => state.setTool("deflate");
  document.getElementById("toolSmooth").onclick = () => state.setTool("smooth");
  document.getElementById("toolFlatten").onclick = () => state.setTool("flatten");
  document.getElementById("toolPinch").onclick = () => state.setTool("pinch");

  document.getElementById("brushSize").oninput = e =>
    state.setRadius(+e.target.value);

  document.getElementById("brushStrength").oninput = e =>
    state.setStrength(+e.target.value);

  document.getElementById("exportGLTF").onclick = state.exportGLTF;
  document.getElementById("importGLTF").onchange = state.importGLTF;
}