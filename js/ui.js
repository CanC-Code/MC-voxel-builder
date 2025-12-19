export function initUI(state) {
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("toggleMenu");
  const lockCam = document.getElementById("lockCamera");

  toggle.onclick = () => {
    menu.classList.toggle("collapsed");
  };

  lockCam.onclick = () => {
    state.cameraLocked = !state.cameraLocked;
    lockCam.textContent = state.cameraLocked ? "Camera Locked" : "Camera Free";
    lockCam.classList.toggle("active", state.cameraLocked);
  };

  document.querySelectorAll("[data-tool]").forEach(btn => {
    btn.onclick = () => {
      state.setTool(btn.dataset.tool);
      document.querySelectorAll("[data-tool]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  document.getElementById("brushSize").oninput = e =>
    state.setRadius(parseFloat(e.target.value));

  document.getElementById("brushStrength").oninput = e =>
    state.setStrength(parseFloat(e.target.value));
}