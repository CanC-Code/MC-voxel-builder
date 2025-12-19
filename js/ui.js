export function initUI(state) {
  const menu = document.getElementById("menu");

  // Tool buttons
  const tools = ["inflate", "deflate", "smooth", "flatten", "pinch", "grab", "clay", "scrape"];
  const toolContainer = document.createElement("div");
  toolContainer.id = "toolContainer";
  toolContainer.style.display = "flex";
  toolContainer.style.flexWrap = "wrap";
  toolContainer.style.gap = "4px";
  menu.appendChild(toolContainer);

  tools.forEach(tool => {
    const btn = document.createElement("button");
    btn.textContent = tool[0].toUpperCase() + tool.slice(1);
    btn.onclick = () => {
      state.setTool(tool);
      document.querySelectorAll("#toolContainer button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
    toolContainer.appendChild(btn);
  });

  // Symmetry toggles
  const symContainer = document.createElement("div");
  symContainer.id = "symContainer";
  symContainer.style.display = "flex";
  symContainer.style.gap = "4px";
  menu.appendChild(symContainer);

  ["x", "y", "z"].forEach(axis => {
    const btn = document.createElement("button");
    btn.textContent = axis.toUpperCase();
    btn.onclick = () => {
      state.symmetry[axis] = !state.symmetry[axis];
      state.setSymmetry({ ...state.symmetry });
      btn.classList.toggle("active", state.symmetry[axis]);
    };
    symContainer.appendChild(btn);
  });

  // Brush size slider
  const brushSizeLabel = document.createElement("label");
  brushSizeLabel.textContent = "Brush Size";
  const brushSize = document.createElement("input");
  brushSize.type = "range";
  brushSize.min = 0.2;
  brushSize.max = 3;
  brushSize.step = 0.1;
  brushSize.value = 1;
  brushSize.oninput = () => state.setRadius(parseFloat(brushSize.value));
  menu.appendChild(brushSizeLabel);
  menu.appendChild(brushSize);

  // Brush strength slider
  const brushStrengthLabel = document.createElement("label");
  brushStrengthLabel.textContent = "Brush Strength";
  const brushStrength = document.createElement("input");
  brushStrength.type = "range";
  brushStrength.min = 0.01;
  brushStrength.max = 1;
  brushStrength.step = 0.01;
  brushStrength.value = 0.08;
  brushStrength.oninput = () => state.setStrength(parseFloat(brushStrength.value));
  menu.appendChild(brushStrengthLabel);
  menu.appendChild(brushStrength);

  // Wireframe toggle
  const wireBtn = document.getElementById("toggleWire");
  wireBtn.onclick = () => {
    state.toggleWireframe();
    wireBtn.classList.toggle("active", state.wireframe);
  };
}