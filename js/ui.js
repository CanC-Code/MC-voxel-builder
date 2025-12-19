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
  };

  const wireBtn = document.getElementById("toggleWire");
  wireBtn.onclick = () => {
    if (state.toggleWireframe) {
      state.toggleWireframe();
    }
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

  const inflateBtn = document.getElementById("toolInflate");
  if (inflateBtn) {
    inflateBtn.onclick = () => state.setTool("inflate");
  }

  const smoothBtn = document.getElementById("toolSmooth");
  if (smoothBtn) {
    smoothBtn.onclick = () => state.setTool("smooth");
  }

  const flattenBtn = document.getElementById("toolFlatten");
  if (flattenBtn) {
    flattenBtn.onclick = () => state.setTool("flatten");
  }

  /* ---------- Sliders ---------- */

  const sizeSlider = document.getElementById("brushSize");
  if (sizeSlider) {
    sizeSlider.oninput = e =>
      state.setRadius(parseFloat(e.target.value));
  }

  const strengthSlider = document.getElementById("brushStrength");
  if (strengthSlider) {
    strengthSlider.oninput = e =>
      state.setStrength(parseFloat(e.target.value));
  }

  /* ---------- File ---------- */

  const exportBtn = document.getElementById("exportGLTF");
  if (exportBtn && state.exportGLTF) {
    exportBtn.onclick = state.exportGLTF;
  }

}