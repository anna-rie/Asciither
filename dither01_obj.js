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
let blockSize = 4 // grösser = gröber
let rotationY = 0;
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

  for (let y = 0; y < matrixSize; y++) {
    thresholdMap[y] = [];
    for (let x = 0; x < matrixSize; x++) {
      thresholdMap[y][x] = (bayerMatrix[y][x] + 0.5) / (matrixSize * matrixSize);
    }
  }
}

function draw() {
  background(0);

  rotationY += 0.001 * deltaTime;

  // Render scene
  pg.background(255);
  pg.push();
  pg.orbitControl();
  pg.rotateY(rotationY);
  pg.scale(-5);
  pg.normalMaterial();
  pg.model(obj);
  pg.pop();
  pg.loadPixels();

  loadPixels();

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Mittelwert der Helligkeit im Block berechnen
      let avg = 0;
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          let px = x + bx;
          let py = y + by;
          if (px < width && py < height) {
            let index = (px + py * width) * 4;
            avg += pg.pixels[index]; // red channel
          }
        }
      }
      avg /= (blockSize * blockSize);

      // Bayer-Schwelle vergleichen
      let mx = (x / blockSize) % matrixSize;
      let my = (y / blockSize) % matrixSize;
      let threshold = thresholdMap[my][mx] * 255;
      let colorVal = avg < threshold ? 0 : 255;

      // Block einfärben
      fill(colorVal);
      noStroke();
      rect(x, y, blockSize, blockSize);
    }
  }
}
