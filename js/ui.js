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
  const inflateBtn = document.getElementById("toolInflate");
  if (inflateBtn) inflateBtn.onclick = () => state.setTool("inflate");

  const smoothBtn = document.getElementById("toolSmooth");
  if (smoothBtn) smoothBtn.onclick = () => state.setTool("smooth");

  const flattenBtn = document.getElementById("toolFlatten");
  if (flattenBtn) flattenBtn.onclick = () => state.setTool("flatten");

  const deflateBtn = document.getElementById("toolDeflate");
  if (deflateBtn) deflateBtn.onclick = () => state.setTool("deflate");

  /* ---------- Sliders ---------- */
  const sizeSlider = document.getElementById("brushSize");
  if (sizeSlider) {
    sizeSlider.oninput = (e) => state.setRadius(parseFloat(e.target.value));
  }

  const strengthSlider = document.getElementById("brushStrength");
  if (strengthSlider) {
    strengthSlider.oninput = (e) => state.setStrength(parseFloat(e.target.value));
  }

  /* ---------- Symmetry ---------- */
  const symX = document.getElementById("symX");
  const symY = document.getElementById("symY");
  const symZ = document.getElementById("symZ");

  function updateSymmetry() {
    if (state.brush) {
      state.brush.setSymmetry({
        x: symX.checked,
        y: symY.checked,
        z: symZ.checked,
      });
    }
  }

  if (symX) symX.onchange = updateSymmetry;
  if (symY) symY.onchange = updateSymmetry;
  if (symZ) symZ.onchange = updateSymmetry;

  /* ---------- Falloff ---------- */
  const falloffSelect = document.getElementById("falloffType");
  if (falloffSelect) {
    falloffSelect.onchange = () => {
      if (state.brush) state.brush.setFalloff(falloffSelect.value);
    };
  }

  /* ---------- File ---------- */
  const exportBtn = document.getElementById("exportGLTF");
  if (exportBtn && state.exportGLTF) exportBtn.onclick = state.exportGLTF;

  const importInput = document.getElementById("importGLTF");
  if (importInput && state.importGLTF)
    importInput.onchange = state.importGLTF;
}