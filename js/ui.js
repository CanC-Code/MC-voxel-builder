export function initUI(state) {
  /* ---------- Top Bar ---------- */
  const toggleMenuBtn = document.getElementById("toggleMenu");
  const menu = document.getElementById("menu");
  toggleMenuBtn.onclick = () => {
    if (menu.classList.contains("collapsed")) {
      menu.classList.remove("collapsed");
      menu.style.opacity = 0;
      menu.style.display = "block";
      requestAnimationFrame(() => {
        menu.style.transition = "opacity 0.2s";
        menu.style.opacity = 1;
      });
    } else {
      menu.style.transition = "opacity 0.2s";
      menu.style.opacity = 0;
      menu.addEventListener("transitionend", function hide() {
        menu.style.display = "none";
        menu.classList.add("collapsed");
        menu.removeEventListener("transitionend", hide);
      });
    }
  };

  const lockCameraBtn = document.getElementById("lockCamera");
  lockCameraBtn.onclick = () => {
    state.cameraLocked = !state.cameraLocked;
    lockCameraBtn.textContent = state.cameraLocked ? "Camera Locked" : "Camera Free";
    lockCameraBtn.classList.toggle("active", state.cameraLocked);
    lockCameraBtn.classList.toggle("inactive", !state.cameraLocked);
    state.controls.enabled = !state.cameraLocked;
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
  const toolMapping = {
    toolInflate: "inflate",
    toolDeflate: "deflate",
    toolSmooth: "smooth",
    toolFlatten: "flatten",
    toolPinch: "pinch"
  };

  Object.entries(toolMapping).forEach(([id, tool]) => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = () => state.setTool(tool);
  });

  /* ---------- Sliders ---------- */
  const sizeSlider = document.getElementById("brushSize");
  if (sizeSlider) sizeSlider.oninput = e => state.setRadius(parseFloat(e.target.value));

  const strengthSlider = document.getElementById("brushStrength");
  if (strengthSlider) strengthSlider.oninput = e => state.setStrength(parseFloat(e.target.value));

  /* ---------- File ---------- */
  const exportBtn = document.getElementById("exportGLTF");
  if (exportBtn && state.exportGLTF) exportBtn.onclick = state.exportGLTF;

  const importInput = document.getElementById("importGLTF");
  if (importInput && state.importGLTF) importInput.onchange = state.importGLTF;
}