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
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––*/
/* what next:
transparency
add gradient to ascii graphics layer! :)
add material (jpg!!) as texture, move ascii to graphicslayer, fake orbit control for both modes... (fake orbit control link ted) 
light colors?, color gradient to object, experimentation, export options, import videos too, layers, background images / objects */
/* CODE */
/* ASCII + DITHER SETUP */

//let libs = ["libs/p5.asciify.umd.js"];
let obj;
let gui;
let guiDom;
let asciiFolder, ditherFolder, sharedFolder, shaderDitherFolder;
let params = {
  mode: "Ascii",
  bgColor: "#000000",
  transparency: false,
  mainColor: "#ff0000",
  color1: "#00ff00",
  color2: "#0000ff",
  lightX: 100, // <--------------------- light doesn't work yet
  lightY: 100,
  lightZ: -200,
  lightColor: "#ffffff",
  lightIntensity: 5,
  fontSize: 30,
  fontColor: "#ff0000",
  fontAlpha: 0.25,
  invertAscii: false,
  normalMaterial: false,
  charactersInput: "□│▒▓▀▄█", //0123456789 ; █▙▟▛▜▝▘▗▖▞▚▄▀▐●□■_ ; │▒▓▀▄█
  blockSize: 15,
  ditherColor: "#000000",
  ditherSize: 1.0,
};
let actions = {
  uploadObj: () => {
    document.getElementById("file-input").click();
  },
};
// use local storage here maybe
let debugDisableAscii = false;
let sketchFramebuffer;
// ---
let pg1;
let pg2;
let pg3;
let rotationY = 0;
// --- st-o orbit control
const sensitivityX = 1;
const sensitivityY = 0.5;
const sensitivityZ = 0.001;
const scaleFactor = 50;
let cam1;
let cam2;
let cam3;
let dither_fs;
let shaderDither;
let bayerImage;
// let asciified;
// ---
let bayerMatrix = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
let matrixSize = 4;
let thresholdMap = [];
// ---
function preload() {
  obj = loadModel("3d/VoxelCat2.obj", { normalize: true });
  // shaderDither = loadShader("shaders/dither.vert", "shaders/dither.frag");
  // bayerImage = loadImage("textures/bayer.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  if (params.mode === "Ascii") {
    setupAscii();
  } else if (params.mode === "Dither") {
    setupDither();
  } else if (params.mode === "ShaderDither") {
    setupShaderDither();
  }
  setupShared(); //setup gui in there
}

function draw() {
  rotationY -= 0.0009 * deltaTime;
  // ambientLight(100);
  // lights();
  clear();
  background(params.bgColor);

  directionalLight(
    red(params.lightColor) * params.lightIntensity,
    green(params.lightColor) * params.lightIntensity,
    blue(params.lightColor) * params.lightIntensity,
    params.lightX,
    params.lightY,
    params.lightZ
  );
  if (params.mode === "Ascii") {
    drawAscii();
  } else if (params.mode === "Dither") {
    drawDither();
  } else if (params.mode === "ShaderDither") {
    drawShaderDither();
  }
}

/* ASCII CODE SECTION */

function setupAscii() {
  sketchFramebuffer = createFramebuffer({
    format: FLOAT,
  });

  pg1 = createGraphics(width, height, WEBGL);
  pg1.pixelDensity(1);
  cam1 = pg1.createCamera(); // st-o orbit control

  pg1.background(0);
  fill(255, 0, 0, 50);
  let c = color(params.mainColor);
  c.setAlpha(params.fontAlpha * 255); //convert to 0-255
  pg1.fill(c);
}

function drawAscii() {
  p5asciify.fontSize(params.fontSize);
  p5asciify.renderers().get("brightness").update({
    characters: params.charactersInput,
  });
  p5asciify.background([0, 0, 0, 0]);
  sketchFramebuffer.begin(); //turn this back on if possible
  clear();
  pg1.push();
  pg1.clear();
  // pg1.background(params.bgColor);
  pg1.lights();
  pg1.directionalLight(
    red(params.lightColor) * params.lightIntensity,
    green(params.lightColor) * params.lightIntensity,
    blue(params.lightColor) * params.lightIntensity,
    params.lightX,
    params.lightY,
    params.lightZ
  );

  // if (!isMouseOverGUI()) {
  //   orbitControl(4, 4, 0.3);
  // }

  pg1.rotateY(rotationY);
  pg1.noStroke();

  let c = color(params.mainColor);
  c.setAlpha(params.fontAlpha * 255); //convert to 0-255
  pg1.fill(c);

  if (params.invertAscii) {
    p5asciify.renderers().get("brightness").invert(true);
  } else {
    p5asciify.renderers().get("brightness").invert(false);
  }

  if (params.normalMaterial) {
    pg1.normalMaterial();
  }

  pg1.scale(-3);
  pg1.model(obj);
  pg1.pop();

  image(pg1, -width / 2, -height / 2);
  sketchFramebuffer.end();
  // let asciified = p5asciify(pg1);
  image(sketchFramebuffer, -windowWidth / 2, -windowHeight / 2); //or asciified instead of sketchFramebuffer
}

function setupAsciify() {
  p5asciify.fontSize(params.fontSize);
  //console.log("setupAsciify");
  //p5asciify.renderers().get("brightness").invert(true);
  // p5asciify.renderers().get("brightness").update({
  //   characters: "%&asdf0123456789",
  // });
}

/* DITHER CODE SECTION */

function setupDither() {
  // <- clear previous canvas here?
  //createCanvas(windowWidth, windowHeight);
  // pixelDensity(1);

  pg2 = createGraphics(width, height, WEBGL);
  pg2.pixelDensity(1);
  cam2 = pg2.createCamera(); // st-o orbit control

  for (let y = 0; y < matrixSize; y++) {
    thresholdMap[y] = [];
    for (let x = 0; x < matrixSize; x++) {
      thresholdMap[y][x] =
        (bayerMatrix[y][x] + 0.5) / (matrixSize * matrixSize);
    }
  }
}

// // fake orbit control functions
// function mouseDragged() {
//   targetRot.x += movedY / 50;
//   targetRot.y += movedX / 50;
// }

// function mouseWheel(event) {
//   targetZoom += event.delta;
//   targetZoom = constrain(targetZoom, minZoom, maxZoom);
//   return false; // prevent page scrolling
// }

// st-o orbit control functions
function mouseDragged() {
  if (!isMouseOverGUI()) {
    const deltaTheta = (-sensitivityX * (mouseX - pmouseX)) / scaleFactor;
    const deltaPhi = (sensitivityY * (mouseY - pmouseY)) / scaleFactor;
    if (params.mode === "Ascii") {
      cam1._orbit(deltaTheta, deltaPhi, 0);
    } else if (params.mode === "Dither") {
      cam2._orbit(deltaTheta, deltaPhi, 0);
    } else if (params.mode === "ShaderDither") {
      cam3._orbit(deltaTheta, deltaPhi, 0);
    }
  }
}
function mouseWheel(event) {
  if (!isMouseOverGUI()) {
    // Calculate zoom direction: scroll up (delta > 0) zooms in (-), down zooms out (+)
    let direction = event.delta > 0 ? 1 : -1;
    let offset = direction * sensitivityZ * scaleFactor;

    switch (params.mode) {
      case "Ascii":
        cam1._orbit(0, 0, offset);
        break;
      case "Dither":
        cam2._orbit(0, 0, offset);
        break;
      case "ShaderDither":
        cam3._orbit(0, 0, offset);
        break;
    }
  }
}

function drawDither() {
  background(0);
  // Render scene
  pg2.background(255);
  // pg2.clear(); //this for transparency ?
  pg2.push();

  pg2.rotateY(rotationY);

  pg2.scale(-3);
  if (params.normalMaterial) {
    pg2.normalMaterial();
  }
  pg2.model(obj);
  pg2.pop();
  pg2.loadPixels();

  loadPixels();

  for (let y = 0; y < height; y += params.blockSize) {
    for (let x = 0; x < width; x += params.blockSize) {
      // Mittelwert der Helligkeit im Block berechnen
      let avg = 0;
      for (let by = 0; by < params.blockSize; by++) {
        for (let bx = 0; bx < params.blockSize; bx++) {
          let px = x + bx;
          let py = y + by;
          if (px < width && py < height) {
            let index = (px + py * width) * 4;
            avg += pg2.pixels[index]; // red channel
          }
        }
      }
      avg /= params.blockSize * params.blockSize;

      // Bayer-Schwelle vergleichen
      let mx = (x / params.blockSize) % matrixSize;
      let my = (y / params.blockSize) % matrixSize;
      let threshold = thresholdMap[my][mx] * 255;
      let colorVal = avg < threshold ? params.mainColor : 255;

      // Block einfärben
      push();
      fill(colorVal);
      noStroke();
      resetMatrix(); // resets the WEBGL transform
      translate(-width / 2, -height / 2); // shift origin to top-left
      rect(x, y, params.blockSize, params.blockSize);
      pop();
    }
  }
}

/* SHADER DITHER CODE SECTION */

function setupShaderDither() {
  pg3 = createGraphics(width, height, WEBGL);
  pg3.pixelDensity(1);
  cam3 = pg3.createCamera(); // st-o orbit control
  dither_fs = createFilterShader(dither_src);
}

function drawShaderDither() {
  // render 3d scene into pg3
  pg3.push();
  //add ambient light
  // pg3.ambientLight(100);
  pg3.background(params.bgColor);
  pg3.camera(cam3.eyeX, cam3.eyeY, cam3.eyeZ, 0, 0, 0, 0, 1, 0); //lock to cam3 (?)
  pg3.scale(-3);
  pg3.rotateY(rotationY);
  pg3.fill(params.mainColor);
  if (params.normalMaterial) {
    pg3.normalMaterial();
  }
  pg3.noStroke();
  pg3.model(obj);
  pg3.pop();

  // set uniforms
  let indexMatrix4x4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  dither_fs.setUniform("indexMatrix4x4", indexMatrix4x4);
  dither_fs.setUniform("tex0", pg3); //send pg3 texture into shader
  dither_fs.setUniform("ditherSize", params.ditherSize);
  dither_fs.setUniform("ditherColor", [
    red(params.ditherColor) / 255,
    green(params.ditherColor) / 255,
    blue(params.ditherColor) / 255,
  ]);

  image(pg3, -width / 2, -height / 2);

  filter(dither_fs);
}

/* ASCII + DITHER FUNCTIONS */

function setupShared() {
  setupGui();
}

function setupGui() {
  gui = new dat.GUI({ width: 300 });
  guiDom = document.querySelector(".dg.main.a");

  //shared folder
  sharedFolder = gui.addFolder("Settings");
  sharedFolder.add(actions, "uploadObj").name("Upload OBJ");
  sharedFolder
    .add(params, "mode", ["Ascii", "Dither", "ShaderDither"])
    .name("Render Mode")
    .onChange(toggleMode);
  sharedFolder.addColor(params, "bgColor").name("BG Color");
  sharedFolder.add(params, "transparency").name("Transparency");
  sharedFolder.addColor(params, "mainColor").name("Main Color");
  sharedFolder.addColor(params, "color1").name("Color 1");
  sharedFolder.addColor(params, "color2").name("Color 2");
  sharedFolder.add(params, "normalMaterial").name("Normal Material");

  sharedFolder.add(params, "lightX", -500, 500).step(1).name("Light X");
  sharedFolder.add(params, "lightY", -500, 500).step(1).name("Light Y");
  sharedFolder.add(params, "lightZ", -500, 500).step(1).name("Light Z");
  sharedFolder.addColor(params, "lightColor").name("Light Color");
  sharedFolder
    .add(params, "lightIntensity", 0, 100)
    .step(0.01)
    .name("Light Intensity");

  //ascii folder
  asciiFolder = gui.addFolder("ASCII");
  asciiFolder
    .add(params, "fontSize", 5, 60, 1)
    .name("Font Size")
    .onChange((val) => {
      if (typeof p5asciify !== "undefined") {
        p5asciify.fontSize(val);
      }
    });
  //asciiFolder.addColor(params, "fontColor").name("Font Color");
  asciiFolder.add(params, "fontAlpha", 0, 1).step(0.01).name("Opacity");
  asciiFolder.add(params, "invertAscii").name("Invert");
  asciiFolder
    .add(params, "charactersInput")
    .name("Ascii Characters")
    .onChange(handleAsciiCharsInput); //function in here

  //dither folder
  ditherFolder = gui.addFolder("Dither");
  ditherFolder.add(params, "blockSize", 8, 25, 1).name("Pixel Size");

  //shader dither folder
  shaderDitherFolder = gui.addFolder("Shader Dither");
  shaderDitherFolder.addColor(params, "ditherColor").name("Dither Color");
  shaderDitherFolder
    .add(params, "ditherSize", 0.1, 2.0, 0.1)
    .name("Dither Size");
  updateGui();
}

function handleAsciiCharsInput(value) {
  if (value.length > 20) {
    params.charactersInput = value.substring(0, 20); //or slice?
  }
  p5asciify.renderers().get("brightness").update({
    characters: value,
  });
  console.log("ASCII characters: " + params.charactersInput);
}

function updateGui() {
  //decide which folders to show and hide
  sharedFolder.open();
  if (params.mode === "Ascii") {
    toggleFolder(ditherFolder, false);
    toggleFolder(shaderDitherFolder, false);
    toggleFolder(asciiFolder, true);
    asciiFolder.open();
    toggleFolder(ditherFolder, false);
  } else if (params.mode === "Dither") {
    toggleFolder(asciiFolder, false);
    toggleFolder(shaderDitherFolder, false);
    toggleFolder(ditherFolder, true);
    ditherFolder.open();
  } else if (params.mode === "ShaderDither") {
    toggleFolder(asciiFolder, false);
    toggleFolder(ditherFolder, false);
    toggleFolder(shaderDitherFolder, true);
    shaderDitherFolder.open();
    console.log("shader dither mode");
  } else {
    console.log("none of the modes");
    console.error("Invalid mode");
  }
}

function readFile(theFile) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var data = e.target.result;

    // sets p5 shape here
    obj = createModel(data, ".obj", true);
  };
  // load into reader above
  reader.readAsText(theFile);
}

document
  .getElementById("file-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      readFile(file);
    }
  });

function toggleMode(init = false) {
  // Show/hide/setup renderers depending on mode
  if (params.mode === "Ascii") {
    setupAscii();
    p5asciify.renderers().get("brightness").enable();
  } else if (params.mode === "Dither") {
    p5asciify.renderers().get("brightness").disable();
    setupDither();
  } else if (params.mode === "ShaderDither") {
    p5asciify.renderers().get("brightness").disable();
    setupShaderDither();
  } else {
    console.error("Invalid mode");
  }
  updateGui();
}

function toggleFolder(folder, show) {
  //show or hide the folder
  if (show) {
    folder.domElement.style.display = "";
  } else {
    folder.domElement.style.display = "none";
  }
}

function isMouseOverGUI() {
  const rect = guiDom.getBoundingClientRect();
  // console.log(rect);
  // console.log(mouseX, mouseY);
  // console.log(width - rect.width, rect.height);
  return mouseX >= width - rect.width && mouseY <= rect.height;
}
//add keypressed for a and A
function keyPressed() {
  if (!isMouseOverGUI()) {
    if (key === "a" || key === "A") {
      debugDisableAscii = !debugDisableAscii;
      if (debugDisableAscii) {
        p5asciify.renderers().get("brightness").disable();
      } else {
        p5asciify.renderers().get("brightness").enable();
      }
    }
  }
}

// dither - https://medium.com/the-bkpt/dithered-shading-tutorial-29f57d06ac39
// http://alex-charlton.com/posts/Dithering_on_the_GPU/
// https://github.com/hughsk/glsl-dither/blob/master/example/index.frag
let dither_src = `precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex0;
uniform float _noise;
uniform float indexMatrix4x4[16];
uniform float ditherSize;
uniform vec3 ditherColor; //color to use instead of black
 
mat4 bayer = mat4(
  -0.5, 0.0, -0.375, 0.125,
  0.25, -0.25, 0.375, -0.125,
  -0.3125, 0.1875, -0.4375, 0.0625,
  0.4375, -0.0625, 0.3125, -0.1875
); 
 
// https://github.com/hughsk/glsl-luma/blob/master/index.glsl
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}
// https://github.com/hughsk/glsl-luma/blob/master/index.glsl
float luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}
 
float dither4x4(vec2 position, float brightness) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;
  float limit = 0.0;
 
  if (x < 8) {
    if (index == 0) limit = 0.0625;
    if (index == 1) limit = 0.5625;
    if (index == 2) limit = 0.1875;
    if (index == 3) limit = 0.6875;
    if (index == 4) limit = 0.8125;
    if (index == 5) limit = 0.3125;
    if (index == 6) limit = 0.9375;
    if (index == 7) limit = 0.4375;
    if (index == 8) limit = 0.25;
    if (index == 9) limit = 0.75;
    if (index == 10) limit = 0.125;
    if (index == 11) limit = 0.625;
    if (index == 12) limit = 1.0;
    if (index == 13) limit = 0.5;
    if (index == 14) limit = 0.875;
    if (index == 15) limit = 0.375;
  }
 
  return brightness < limit ? 0.0 : 1.0;
}
 
vec3 dither4x4(vec2 position, vec3 color) {
  return color * dither4x4(position, luma(color));
}
 
vec4 dither4x4(vec2 position, vec4 color) {
  return vec4(color.rgb * dither4x4(position, luma(color)), 1.0);
}
 
float dither8x8(vec2 position, float brightness) {
  int x = int(mod(position.x, 8.0));
  int y = int(mod(position.y, 8.0));
  int index = x + y * 8;
  float limit = 0.0;
 
  if (x < 8) {
    if (index == 0) limit = 0.015625;
    if (index == 1) limit = 0.515625;
    if (index == 2) limit = 0.140625;
    if (index == 3) limit = 0.640625;
    if (index == 4) limit = 0.046875;
    if (index == 5) limit = 0.546875;
    if (index == 6) limit = 0.171875;
    if (index == 7) limit = 0.671875;
    if (index == 8) limit = 0.765625;
    if (index == 9) limit = 0.265625;
    if (index == 10) limit = 0.890625;
    if (index == 11) limit = 0.390625;
    if (index == 12) limit = 0.796875;
    if (index == 13) limit = 0.296875;
    if (index == 14) limit = 0.921875;
    if (index == 15) limit = 0.421875;
    if (index == 16) limit = 0.203125;
    if (index == 17) limit = 0.703125;
    if (index == 18) limit = 0.078125;
    if (index == 19) limit = 0.578125;
    if (index == 20) limit = 0.234375;
    if (index == 21) limit = 0.734375;
    if (index == 22) limit = 0.109375;
    if (index == 23) limit = 0.609375;
    if (index == 24) limit = 0.953125;
    if (index == 25) limit = 0.453125;
    if (index == 26) limit = 0.828125;
    if (index == 27) limit = 0.328125;
    if (index == 28) limit = 0.984375;
    if (index == 29) limit = 0.484375;
    if (index == 30) limit = 0.859375;
    if (index == 31) limit = 0.359375;
    if (index == 32) limit = 0.0625;
    if (index == 33) limit = 0.5625;
    if (index == 34) limit = 0.1875;
    if (index == 35) limit = 0.6875;
    if (index == 36) limit = 0.03125;
    if (index == 37) limit = 0.53125;
    if (index == 38) limit = 0.15625;
    if (index == 39) limit = 0.65625;
    if (index == 40) limit = 0.8125;
    if (index == 41) limit = 0.3125;
    if (index == 42) limit = 0.9375;
    if (index == 43) limit = 0.4375;
    if (index == 44) limit = 0.78125;
    if (index == 45) limit = 0.28125;
    if (index == 46) limit = 0.90625;
    if (index == 47) limit = 0.40625;
    if (index == 48) limit = 0.25;
    if (index == 49) limit = 0.75;
    if (index == 50) limit = 0.125;
    if (index == 51) limit = 0.625;
    if (index == 52) limit = 0.21875;
    if (index == 53) limit = 0.71875;
    if (index == 54) limit = 0.09375;
    if (index == 55) limit = 0.59375;
    if (index == 56) limit = 1.0;
    if (index == 57) limit = 0.5;
    if (index == 58) limit = 0.875;
    if (index == 59) limit = 0.375;
    if (index == 60) limit = 0.96875;
    if (index == 61) limit = 0.46875;
    if (index == 62) limit = 0.84375;
    if (index == 63) limit = 0.34375;
  }
 
  return brightness < limit ? 0.0 : 1.0;
}
 
vec3 dither8x8(vec2 position, vec3 color) {
  float factor = dither8x8(position, luma(color)); //return color * dither8x8(position, luma(color));
  return mix(ditherColor, color, factor); //0.0 = ditherColor, 1.0 = original color
}
 
vec4 dither8x8(vec2 position, vec4 color) {
  return vec4(color.rgb * dither8x8(position, luma(color)), 1.0);
}
 
float dither2x2(vec2 position, float brightness) {
  int x = int(mod(position.x, 2.0));
  int y = int(mod(position.y, 2.0));
  int index = x + y * 2;
  float limit = 0.0;
 
  if (x < 8) {
    if (index == 0) limit = 0.25;
    if (index == 1) limit = 0.75;
    if (index == 2) limit = 1.00;
    if (index == 3) limit = 0.50;
  }
 
  return brightness < limit ? 0.0 : 1.0;
}
 
vec3 dither2x2(vec2 position, vec3 color) {
  return color * dither2x2(position, luma(color));
}
 
vec4 dither2x2(vec2 position, vec4 color) {
  return vec4(color.rgb * dither2x2(position, luma(color)), 1.0);
}
 
 
void main() {
  vec2 uv = vTexCoord;

  float scale = 0.5;
  vec2 scaledCoord = gl_FragCoord.xy * ditherSize;

  vec3 texColor = texture2D(tex0, uv).rgb;
  vec3 finalColor = dither8x8(scaledCoord, texColor);

  gl_FragColor = vec4(finalColor, 1.0);
}
  `;

/* ----------- unsorted code below */
