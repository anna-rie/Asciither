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
  asciiMode: true,
  fontSize: 30,
  blockSize: 10,
  sharedValue: 0.5
};
let actions = {
  uploadObj: () => {
    document.getElementById("file-input").click();
  }
}
// use local storage here maybe

let sketchFramebuffer;

let asciiBrightness;
let sliderFontSize; //remove after new gui
let fontSize; //remove after new gui
let toggleAscii; //remove after new gui
// ---
let pg;
//let blockSize = 10 // grösser = gröber
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
    obj = loadModel("3d/VoxelCat2.obj", { normalize: true });
  }

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    if (params.asciiMode) {
        setupAscii();
        console.log("function setup setupAscii");
      } else {
        setupDither();
      }
    setupShared();
    setupGui();
    // toggleMode(true);
    // console.log("setup");
}
    

function draw() {
    rotationY -= 0.0009 * deltaTime;
    if (params.asciiMode) {
        drawAscii();
      } else {
        drawDither();
      }
    }


/* ASCII CODE SECTION */

function setupAscii(){
  // console.log("function setupAscii");
  // sliderFontSize = createSlider(5, 50, 30, 5);
  // sliderFontSize.position(10, 75);
  // sliderFontSize.size(80);
  // <- clear previous canvas here?
  //createCanvas(windowWidth, windowHeight, WEBGL);
  sketchFramebuffer = createFramebuffer({
    format: FLOAT,
  });
  fill(255, 0, 0, 50);
    //sliderFontSize.show();
}

function drawAscii() {
    fontSize = params.fontSize;
    p5asciify.fontSize(fontSize);
    sketchFramebuffer.begin();

    background(0);
    orbitControl(4, 4, 0.3);
    //rotateY(radians(-frameCount));
    rotateY(rotationY);
    noStroke();
    //normalMaterial();
    scale(-3);
    model(obj);

    sketchFramebuffer.end();

    image(sketchFramebuffer, -windowWidth / 2, -windowHeight / 2);
}

function setupAsciify() {
    p5asciify.fontSize(fontSize);
    //console.log("setupAsciify");
    //p5asciify.renderers().get("brightness").invert(true);
    p5asciify.renderers().get("brightness").update({
      characters: "%&asdf0123456789",
    });
  }


/* DITHER CODE SECTION */

function setupDither(){
    // <- clear previous canvas here?
    //createCanvas(windowWidth, windowHeight);
    pixelDensity(1);

    pg = createGraphics(width, height, WEBGL);
    pg.pixelDensity(1);

    //sliderFontSize.hide();

    for (let y = 0; y < matrixSize; y++) {
        thresholdMap[y] = [];
        for (let x = 0; x < matrixSize; x++) {
        thresholdMap[y][x] = (bayerMatrix[y][x] + 0.5) / (matrixSize * matrixSize);
        }
    }
}

function drawDither() {
    background(0);
    let blockSize = params.blockSize;
    
  
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
        push();
        fill(colorVal);
        noStroke();
        resetMatrix(); // resets the WEBGL transform
translate(-width / 2, -height / 2); // shift origin to top-left
        rect(x, y, blockSize, blockSize);
        pop();
      }
    }
}

/* ASCII + DITHER FUNCTIONS */

function setupShared() {    
  // toggleAscii = createCheckbox("ascii", true);
  // toggleAscii.style("color", "white");
  // toggleAscii.position(10, 50);
  // toggleAscii.changed(toggleMode);
}

function setupGui() {
    gui = new dat.GUI();

    //shared folder
    sharedFolder = gui.addFolder("Settings");
    sharedFolder.add(actions, "uploadObj").name("Upload OBJ");
    sharedFolder.add(params, "asciiMode").name("Tool Mode").onChange(toggleMode);
    //sharedFolder.add(params, "sharedValue", 0, 1).name("sharedValue");

    //ascii folder
    asciiFolder = gui.addFolder("ASCII");
    asciiFolder.add(params, "fontSize", 5, 60, 1).name("Font Size").onChange(val => {
      if (typeof p5asciify !== "undefined") {
        p5asciify.fontSize(val);
      }
    });

    //dither folder
    ditherFolder = gui.addFolder("Dither");
    ditherFolder.add(params, "blockSize", 8, 25, 1).name("Block Size");
    
    updateGui();
}

function updateGui() {
  sharedFolder.open();
  if (params.asciiMode) {
    toggleFolder(asciiFolder, true);
    asciiFolder.open();
    toggleFolder(ditherFolder, false);
  } else {
    toggleFolder(asciiFolder, false);
    toggleFolder(ditherFolder, true);
    ditherFolder.open();
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
  params.asciiMode = params.asciiMode;

  // Show/hide folders depending on mode
  if (params.asciiMode) {
    setupAscii();
    p5asciify.renderers().get("brightness").enable();
  } else {
    p5asciify.renderers().get("brightness").disable();
      setupDither();
  }
  updateGui();
}

function toggleFolder(folder, show) {
  if (show) {
    folder.domElement.style.display = "";
  } else {
    folder.domElement.style.display = "none";
  }
}

/* ----------- unsorted code below */
