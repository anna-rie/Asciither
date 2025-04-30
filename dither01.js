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
let img;
let bayerMatrix = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];
let matrixSize = 4;
let thresholdMap = [];

function preload() {
  img = loadImage('data/images/willem.jpeg');
}

function setup() {
  createCanvas(img.width, img.height);
  img.loadPixels();

  // Normierte Bayer-Matrix erstellen
  for (let y = 0; y < matrixSize; y++) {
    thresholdMap[y] = [];
    for (let x = 0; x < matrixSize; x++) {
      thresholdMap[y][x] = (bayerMatrix[y][x] + 0.5) / (matrixSize * matrixSize);
    }
  }

  applyDithering();
  img.updatePixels();
  image(img, 0, 0);
}

function applyDithering() {
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (x + y * img.width) * 4;
      let brightness = img.pixels[index]; // Graustufen-Wert
      let threshold = thresholdMap[y % matrixSize][x % matrixSize] * 255;
      let newColor = brightness < threshold ? 0 : 255;
      img.pixels[index] = img.pixels[index + 1] = img.pixels[index + 2] = newColor;
    }
  }
}