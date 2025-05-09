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
fake orbit control, more GUIs, dither size, color controls, which ascii characters, experimentation, export options, .mtl?, layers, background images / objects */
/* CODE */
/* ASCII + DITHER SETUP */

//let libs = ["libs/p5.asciify.umd.js"];
let obj;
let gui;
let asciiFolder, ditherFolder, sharedFolder;
let params = {
  mode: "Ascii",
  bgColor: "#000000",
  fontSize: 30,
  fontColor: "#ff0000",
  fontAlpha: 0.25,
  normalMaterial: false,
  charactersInput: "0123456789",
  blockSize: 15,
  ditherColor: "#000000",
};
let actions = {
  uploadObj: () => {
    document.getElementById("file-input").click();
  }
}
// use local storage here maybe

let sketchFramebuffer;
// ---
let pg;
let rotationY = 0;
let bayerMatrix = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];
let matrixSize = 4;
let thresholdMap = [];
// ---
function preload() {
    obj = loadModel("3d/VoxelCat2.obj", { normalize: true });
  }

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    if (params.mode === "Ascii") {
        setupAscii();
        console.log("function setup setupAscii");
      } else {
        setupDither();
      }
    setupShared(); //setup gui in there
}
    

function draw() {
    rotationY -= 0.0009 * deltaTime;
    if (params.mode === "Ascii") {
        drawAscii();
      } else {
        drawDither();
      }
    }


/* ASCII CODE SECTION */

function setupAscii(){
  sketchFramebuffer = createFramebuffer({
    format: FLOAT,
  });
  fill(255, 0, 0, 50);
  let c = color(params.fontColor);
  c.setAlpha(params.fontAlpha * 255); //convert to 0-255
  fill(c);

}

function drawAscii() {
    p5asciify.fontSize(params.fontSize);
    sketchFramebuffer.begin();

    background(params.bgColor);
    orbitControl(4, 4, 0.3);
    //rotateY(radians(-frameCount));
    rotateY(rotationY);
    noStroke();
    c = color(params.fontColor);
    c.setAlpha(params.fontAlpha * 255); //convert to 0-255
    fill(c);
    if(params.normalMaterial){
      normalMaterial();
    }
    scale(-3);
    model(obj);

    sketchFramebuffer.end();

    image(sketchFramebuffer, -windowWidth / 2, -windowHeight / 2);
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

function setupDither(){
    // <- clear previous canvas here?
    //createCanvas(windowWidth, windowHeight);
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

function drawDither() {
    background(0);
    // Render scene
    pg.background(255);
    pg.push();
    pg.orbitControl();
    pg.rotateY(rotationY);
    pg.scale(-3);
    pg.normalMaterial();
    pg.model(obj);
    pg.pop();
    pg.loadPixels();
  
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
              avg += pg.pixels[index]; // red channel
            }
          }
        }
        avg /= (params.blockSize * params.blockSize);
  
        // Bayer-Schwelle vergleichen
        let mx = (x / params.blockSize) % matrixSize;
        let my = (y / params.blockSize) % matrixSize;
        let threshold = thresholdMap[my][mx] * 255;
        let colorVal = avg < threshold ? params.ditherColor : 255;
  
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


/* ASCII + DITHER FUNCTIONS */

function setupShared() {    
  setupGui();
}

function setupGui() {
    gui = new dat.GUI({width: 300});

    //shared folder
    sharedFolder = gui.addFolder("Settings");
    sharedFolder.add(actions, "uploadObj").name("Upload OBJ");
    sharedFolder.add(params, "mode", ["Ascii", "Dither"]).name("Render Mode").onChange(toggleMode);
    sharedFolder.addColor(params, "bgColor").name("BG Color");

    //ascii folder
    asciiFolder = gui.addFolder("ASCII");
    asciiFolder.add(params, "fontSize", 5, 60, 1).name("Font Size").onChange(val => {
      if (typeof p5asciify !== "undefined") {
        p5asciify.fontSize(val);
      }
    });
    asciiFolder.addColor(params, "fontColor").name("Font Color");
    asciiFolder.add(params, "fontAlpha", 0, 1).step(0.01).name("Opacity");
    asciiFolder.add(params, "normalMaterial").name("Normal Material");
    asciiFolder.add(params, "charactersInput").name("Ascii Characters").onChange(handleAsciiCharsInput); //function in here

    //dither folder
    ditherFolder = gui.addFolder("Dither");
    ditherFolder.add(params, "blockSize", 8, 25, 1).name("Pixel Size");
    ditherFolder.addColor(params, "ditherColor").name("Dither Color");
    
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
    toggleFolder(asciiFolder, true);
    asciiFolder.open();
    toggleFolder(ditherFolder, false);
  } else if (params.mode === "Dither") {
    toggleFolder(asciiFolder, false);
    toggleFolder(ditherFolder, true);
    ditherFolder.open();
  } else {
    console.error("Invalid mode");
  }
}

function readFile(theFile){
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result
 
        // sets p5 shape here
        obj = createModel(data, '.obj', true)
    };
    // load into reader above
    reader.readAsText(theFile);   
}

document.getElementById("file-input").addEventListener("change", function(event) {
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

/* ----------- unsorted code below */
