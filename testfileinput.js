let objModel

function preload() {
  objModel = loadModel("3d/mushrooms1.obj");
}

function setup() {
  createCanvas(400, 400, WEBGL);
  let input = createFileInput(handleFile);
  input.position(10, 10);
}

function handleFile(file) {
  let blobUrl = URL.createObjectURL(file.file);
  objModel = loadModel(file.file);
}

function draw() { 
  background(0);
  orbitControl(4, 4, 0.3);
  rotateY(radians(-frameCount));
  noStroke();
  //normalMaterial();
  scale(-300);
  if (objModel) {
    model(objModel);
  }
  else {
    console.log('❌ Kein Modell geladen!');
  }
}