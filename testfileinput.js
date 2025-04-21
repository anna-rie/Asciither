      /* CUSTOM FUNCTIONS FOR P5LIVE */
      // keep fullscreen if window resized
      function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
      }

      // custom ease function
      function ease(iVal, oVal, eVal) {
        return (oVal += (iVal - oVal) * eVal);
      }

      // processing compatibility
      function println(msg) {
        print(msg);
      }


let objModel;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  createFileInput(handleFile).attribute('accept', '.obj');
}

function handleFile(file) {
  if (!file || !file.file || !file.name.endsWith('.obj')) {
    console.warn('⚠️ Not a valid OBJ file');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    loadModel(url, true,
      model => {
        console.log("✅ Model loaded from blob");
        objModel = model;
      },
      err => {
        console.error("❌ Failed to load model:", err);
      }
    );
  };
  reader.readAsText(file.file);
}

function draw() {
  background(30);
  orbitControl();
  rotateY(frameCount * 0.01);
  if (objModel) {
    scale(200);
    noStroke();
    normalMaterial();
    model(objModel);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Upload an OBJ file to view it", 0, 0);
  }
}
