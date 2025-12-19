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

    // Sync with OrbitControls
    if (state.controls) {
      state.controls.enableRotate = !state.cameraLocked;
    }
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

  const tools = ["inflate", "smooth", "flatten"];
  tools.forEach(tool => {
    const btn = document.getElementById(`tool${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
    if (btn) {
      btn.onclick = () => {
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

}