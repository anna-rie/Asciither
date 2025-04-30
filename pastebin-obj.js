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

// handle OBJ import (as text)
// add button: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file
 
 
let shape;
 
function setup() {
    var canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    background(0);
 
}
 
function draw(){
    background(0);
 
    lights();
 
    rotateX(frameCount * 0.01);
    rotateY(frameCount * 0.01);
 
    orbitControl();
 
    // only show if model works
    if(shape != null){
        scale(4)
        model(shape);
    }
}
 
// there's something wrong with how p5's drop reads a .obj file?!
// here's the plain vanilla JS way to load a file, where we can force to be as text
 
// read the text contents of file
// source: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText#javascript
function readFile(theFile){
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result
 
        // sets p5 shape here
        shape = createModel(data, '.obj', true)
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
 
 
// source: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
function dropHandler(ev) {
  console.log("File(s) dropped");
 
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
 
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile();        
        readFile(file) // see function above
      }
    });
  }
}
 
function dragOverHandler(ev) {
  console.log("File(s) in drop zone");
 
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}