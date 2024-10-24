import './styles/style.css';

const PLUGIN_PATH = "/cursor-pen";
let isPenMode = false;
let permanentCanvas = null;
let tempCanvas = null;
let permCtx = null;
let tempCtx = null;
let currentTool = 'pen';
let currentColor = '#FF0000';
let currentSize = 2;
let isDrawing = false;
let startX, startY;

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2147483647'; 
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return canvas;
};

const initializeDrawing = () => {
  permanentCanvas = createCanvas();
  tempCanvas = createCanvas();
  permCtx = permanentCanvas.getContext('2d');
  tempCtx = tempCanvas.getContext('2d');
  updateDrawingStyle(permCtx);
  updateDrawingStyle(tempCtx);
  document.body.appendChild(permanentCanvas);
  document.body.appendChild(tempCanvas);
};

const updateDrawingStyle = (context) => {
  context.strokeStyle = currentColor;
  context.lineWidth = currentSize;
  context.lineCap = 'round';
};

const startDrawing = (e) => {
  if (!isPenMode) return;
  isDrawing = true;
  const rect = tempCanvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  if (currentTool === 'pen') {
    tempCtx.beginPath();
    tempCtx.moveTo(startX, startY);
  }
};

const draw = (e) => {
  if (!isDrawing || !isPenMode) return;
  const rect = tempCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  switch (currentTool) {
    case 'pen':
      tempCtx.lineTo(x, y);
      tempCtx.stroke();
      break;
    case 'circle':
      drawCircle(tempCtx, startX, startY, x, y);
      break;
    case 'square':
      drawSquare(tempCtx, startX, startY, x, y);
      break;
    case 'blur':
      
      const blurSize = 50;
      permCtx.save();
      permCtx.filter = 'blur(5px)';
      permCtx.drawImage(
        permanentCanvas,
        x - blurSize / 2,
        y - blurSize / 2,
        blurSize,
        blurSize,
        x - blurSize / 2,
        y - blurSize / 2,
        blurSize,
        blurSize
      );
      permCtx.restore();
      break;
  }
};

const stopDrawing = () => {
  if (!isDrawing) return;
  isDrawing = false;
  
  permCtx.drawImage(tempCanvas, 0, 0);
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
};

const drawCircle = (context, startX, startY, endX, endY) => {
  const radius = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );
  context.beginPath();
  context.arc(startX, startY, radius, 0, Math.PI * 2);
  context.stroke();
};

const drawSquare = (context, startX, startY, endX, endY) => {
  const width = endX - startX;
  const height = endY - startY;
  context.strokeRect(startX, startY, width, height);
};

const clearCanvas = () => {
  permCtx.clearRect(0, 0, permanentCanvas.width, permanentCanvas.height);
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
};

const togglePenMode = () => {
  isPenMode = !isPenMode;
  document.body.style.cursor = isPenMode ? 'crosshair' : 'default';
  updateToolbarState();
  if (isPenMode) {
    tempCanvas.style.pointerEvents = 'auto';
    permanentCanvas.style.pointerEvents = 'auto';
  } else {
    tempCanvas.style.pointerEvents = 'none';
    permanentCanvas.style.pointerEvents = 'none';
  }
};

const createToolbar = () => {
  const toolbar = document.createElement('div');
  toolbar.className = 'cursor-pen-toolbar';
  toolbar.style.position = 'fixed';
  toolbar.style.top = '10px';
  toolbar.style.right = '10px';
  toolbar.style.zIndex = '2147483647';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.onclick = togglePenMode;

  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear';
  clearButton.onclick = clearCanvas;

  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = currentColor;
  colorPicker.onchange = (e) => {
    currentColor = e.target.value;
    updateDrawingStyle(permCtx);
    updateDrawingStyle(tempCtx);
  };

  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.min = '1';
  sizeInput.max = '50';
  sizeInput.value = currentSize;
  sizeInput.onchange = (e) => {
    currentSize = parseInt(e.target.value);
    updateDrawingStyle(permCtx);
    updateDrawingStyle(tempCtx);
  };

  const toolSelect = document.createElement('select');
  ['pen', 'circle', 'square', 'blur'].forEach((tool) => {
    const option = document.createElement('option');
    option.value = tool;
    option.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
    toolSelect.appendChild(option);
  });
  toolSelect.onchange = (e) => {
    currentTool = e.target.value;
  };

  toolbar.appendChild(closeButton);
  toolbar.appendChild(clearButton);
  toolbar.appendChild(colorPicker);
  toolbar.appendChild(sizeInput);
  toolbar.appendChild(toolSelect);

  return toolbar;
};

const updateToolbarState = () => {
  const toolbar = document.querySelector('.cursor-pen-toolbar');
  if (toolbar) {
    toolbar.style.display = isPenMode ? 'block' : 'none';
  }
};

const createPage = (sdk) => {
  initializeDrawing();
  const toolbar = createToolbar();
  document.body.appendChild(toolbar);

  
  const instructionsDiv = document.createElement('div');
  instructionsDiv.className = 'cursor-pen-instructions';
  instructionsDiv.innerHTML = `
    <h1>Screen Drawing Plugin</h1>
    <p>This plugin allows you to draw on the screen.</p>
    <p><strong>How to Activate:</strong></p>
    <ul>
      <li>Press <strong>F12</strong> to toggle the drawing mode on and off.</li>
      <li>Use the toolbar at the top-right corner to select tools, colors, and sizes.</li>
      <li>Press <strong>F12</strong> again or click the <strong>Close</strong> button to deactivate the drawing mode.</li>
    </ul>
    <p>If you need any help, join our <a href="#" id="discord-link">Discord server</a>.</p>
    <p>Follow me on <a href="#" id="X-link">X</a>.</p>
  `;

  
  instructionsDiv.querySelector('#discord-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof __CAIDO_DESKTOP__ !== 'undefined' && __CAIDO_DESKTOP__.openInBrowser) {
      __CAIDO_DESKTOP__.openInBrowser('https://links.caido.io/www-discord');
    } else {
      
      window.open('https://links.caido.io/www-discord', '_blank', 'noopener,noreferrer');
    }
  });

  
  instructionsDiv.querySelector('#X-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof __CAIDO_DESKTOP__ !== 'undefined' && __CAIDO_DESKTOP__.openInBrowser) {
      __CAIDO_DESKTOP__.openInBrowser('https://x.com/Tur24Tur');
    } else {
      
      window.open('https://x.com/Tur24Tur', '_blank', 'noopener,noreferrer');
    }
  });

  window.addEventListener('resize', () => {
    permanentCanvas.width = window.innerWidth;
    permanentCanvas.height = window.innerHeight;
    tempCanvas.width = window.innerWidth;
    tempCanvas.height = window.innerHeight;
    
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      e.preventDefault();
      togglePenMode();
    }
  });

  
  tempCanvas.addEventListener('mousedown', startDrawing);
  tempCanvas.addEventListener('mousemove', draw);
  tempCanvas.addEventListener('mouseup', stopDrawing);
  tempCanvas.addEventListener('mouseout', stopDrawing);

  
  sdk.navigation.addPage(PLUGIN_PATH, {
    body: instructionsDiv,
  });
};

export const init = (sdk) => {
  createPage(sdk);
  sdk.sidebar.registerItem('Screen Drawing', PLUGIN_PATH, {
    icon: 'fas fa-pen',
  });
};
