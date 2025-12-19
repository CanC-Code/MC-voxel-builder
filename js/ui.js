export function initUI(state) {
  /* ---------- Top Bar ---------- */
  const toggleMenuBtn = document.getElementById("toggleMenu");
  const menu = document.getElementById("menu");

  toggleMenuBtn.onclick = () => {
    menu.classList.toggle("collapsed");
  };

  const lockCameraBtn = document.getElementById("lockCamera");
  lockCameraBtn.onclick = () => {
    state.cameraLocked = !state.cameraLocked;
    lockCameraBtn.textContent = state.cameraLocked
      ? "Camera Locked"
      : "Camera Free";
    lockCameraBtn.classList.toggle("active", state.cameraLocked);
    lockCameraBtn.classList.toggle("inactive", !state.cameraLocked);
    if (state.controls) state.controls.enabled = !state.cameraLocked;
  };

  const wireBtn = document.getElementById("toggleWire");
  wireBtn.onclick = () => {
    if (state.toggleWireframe) state.toggleWireframe();
  };

  /* ---------- Model ---------- */
  const cubeBtn = document.getElementById("newCube");
  cubeBtn.onclick = () => {
    if (state.createCube) state.createCube();
  };

  const sphereBtn = document.getElementById("newSphere");
  sphereBtn.onclick = () => {
    if (state.createSphere) state.createSphere();
  };

  /* ---------- Sculpt Tools ---------- */
  const tools = [
    "inflate",
    "deflate",
    "smooth",
    "flatten",
    "pinch",
    "clay",
    "scrape",
  ];

  tools.forEach(tool => {
    const btn = document.getElementById(`tool${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
    if (btn) {
      btn.onclick = () => state.setTool(tool);
    }
  });

  /* ---------- Symmetry ---------- */
  const symmetryX = document.getElementById("symX");
  const symmetryY = document.getElementById("symY");
  const symmetryZ = document.getElementById("symZ");

  if (symmetryX)
    symmetryX.onchange = e =>
      state.brush && state.brush.setSymmetry("x", e.target.checked);
  if (symmetryY)
    symmetryY.onchange = e =>
      state.brush && state.brush.setSymmetry("y", e.target.checked);
  if (symmetryZ)
    symmetryZ.onchange = e =>
      state.brush && state.brush.setSymmetry("z", e.target.checked);

  /* ---------- Sliders ---------- */
  const sizeSlider = document.getElementById("brushSize");
  if (sizeSlider) {
    sizeSlider.oninput = e => state.setRadius(parseFloat(e.target.value));
  }

  const strengthSlider = document.getElementById("brushStrength");
  if (strengthSlider) {
    strengthSlider.oninput = e => state.setStrength(parseFloat(e.target.value));
  }

  /* ---------- File ---------- */
  const exportBtn = document.getElementById("exportGLTF");
  if (exportBtn && state.exportGLTF) {
    exportBtn.onclick = state.exportGLTF;
  }

  const importInput = document.getElementById("importGLTF");
  if (importInput && state.importGLTF) {
    importInput.onchange = state.importGLTF;
  }
}