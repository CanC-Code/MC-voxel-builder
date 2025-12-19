export function initUI(state) {

  /* ---------- Top Bar ---------- */

  const toggleMenuBtn = document.getElementById("toggleMenu");
  const menu = document.getElementById("menu");

  toggleMenuBtn.onclick = () => {
    menu.classList.toggle("collapsed");
  };

  const lockCameraBtn = document.getElementById("lockCamera");
  lockCameraBtn.onclick = () => {
    if (!state.controls) return;
    state.cameraLocked = !state.cameraLocked;

    lockCameraBtn.textContent = state.cameraLocked
      ? "Camera Locked"
      : "Camera Free";

    lockCameraBtn.classList.toggle("active", state.cameraLocked);
    lockCameraBtn.classList.toggle("inactive", !state.cameraLocked);

    state.controls.enableRotate = !state.cameraLocked;
  };

  const wireBtn = document.getElementById("toggleWire");
  wireBtn.onclick = () => {
    if (state.toggleWireframe) state.toggleWireframe();
  };

  /* ---------- Model Buttons ---------- */

  const cubeBtn = document.getElementById("newCube");
  cubeBtn.onclick = () => { if (state.createCube) state.createCube(); };

  const sphereBtn = document.getElementById("newSphere");
  sphereBtn.onclick = () => { if (state.createSphere) state.createSphere(); };

  /* ---------- Sculpt Tools ---------- */

  const tools = ["inflate", "smooth", "flatten"];
  tools.forEach(tool => {
    const btn = document.getElementById(`tool${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
    if (btn) {
      btn.onclick = () => {
        if (!state.brush) return;
        state.setTool(tool);

        // Highlight active tool
        tools.forEach(t => {
          const b = document.getElementById(`tool${t.charAt(0).toUpperCase() + t.slice(1)}`);
          if (b) b.classList.toggle("active", t === tool);
        });
      };
    }
  });

  /* ---------- Sliders ---------- */

  const sizeSlider = document.getElementById("brushSize");
  if (sizeSlider) {
    sizeSlider.value = state.brush ? state.brush.radius : 1;
    sizeSlider.oninput = e => state.setRadius(parseFloat(e.target.value));
  }

  const strengthSlider = document.getElementById("brushStrength");
  if (strengthSlider) {
    strengthSlider.value = state.brush ? state.brush.strength : 0.5;
    strengthSlider.oninput = e => state.setStrength(parseFloat(e.target.value));
  }

  /* ---------- File Export / Import ---------- */

  const exportBtn = document.getElementById("exportGLTF");
  if (exportBtn && state.exportGLTF) {
    exportBtn.onclick = state.exportGLTF;
  }

  const importInput = document.getElementById("importGLTF");
  if (importInput && state.importGLTF) {
    importInput.onchange = e => state.importGLTF(e);
  }

  /* ---------- Initialize UI State ---------- */

  if (lockCameraBtn) {
    lockCameraBtn.textContent = state.cameraLocked ? "Camera Locked" : "Camera Free";
    lockCameraBtn.classList.toggle("active", state.cameraLocked);
    lockCameraBtn.classList.toggle("inactive", !state.cameraLocked);
  }

  // Clear tool highlights
  tools.forEach(t => {
    const b = document.getElementById(`tool${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (b) b.classList.remove("active");
  });
}