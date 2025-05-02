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

/* CODE */
let obj;
let pg;
let bayerMatrix = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];
let matrixSize = 4;
let thresholdMap = [];

function preload() {
  obj = loadModel("3d/VoxelCat2.obj", {normalize: true});
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  pg = createGraphics(width, height, WEBGL);
  pg.pixelDensity(1);

  // Normierte Bayer-Matrix erstellen
  for (let y = 0; y < matrixSize; y++) {
    thresholdMap[y] = [];
    for (let x = 0; x < matrixSize; x++) {
      thresholdMap[y][x] = (bayerMatrix[y][x] + 0.5) / (matrixSize * matrixSize);
    }
  }

  // applyDithering();
  // img.updatePixels();
  // image(img, 0, 0);
}

function draw() {
    background(0);

    // render obj model to buffer
    pg.background(255);
    pg.push();
    pg.orbitControl();
    pg.rotateY(frameCount * 0.01);
    pg.scale(-5);
    pg.normalMaterial();
    pg.model(obj);
    pg.pop();
    pg.loadPixels();

    // dither it using my bayer matrix
    let dithered = createImage(pg.width, pg.height);
    dithered.loadPixels();

  for (let y = 0; y < pg.height; y++) {
    for (let x = 0; x < pg.width; x++) {
      let index = (x + y * pg.width) * 4;
      let brightness = pg.pixels[index]; // Graustufen-Wert... angeblich red channel?
      let threshold = thresholdMap[y % matrixSize][x % matrixSize] * 255;
      let newColor = brightness < threshold ? 0 : 255;
      dithered.pixels[index] = dithered.pixels[index + 1] = dithered.pixels[index + 2] = newColor;
      dithered.pixels[index + 3] = 255; // Alpha-Kanal
    }
  }
  dithered.updatePixels();

  noSmooth();
image(dithered, 0, 0);
}