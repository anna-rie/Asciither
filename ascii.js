//3d_voxelCat_04

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

      //next up: "A" key toggle fixe mit mim setup, p5asciify.irgendwas erkunde, sliders, combine with dither

      let libs = ["libs/p5.asciify.umd.js"];

      let sketchFramebuffer;
      let obj;
      let asciiEnabled = true;
      let asciiBrightness;

      let fontSizeSlider;
      // let fontSizeVal = 50;
      let size;

      function preload() {
        obj = loadModel("3d/VoxelCat2.obj", { normalize: true });
      }

      function setup() {
        createCanvas(windowWidth, windowHeight, WEBGL);
        sketchFramebuffer = createFramebuffer({
          format: FLOAT,
        });
        fill(255, 0, 0, 50);
        fontSizeSlider = createSlider(5, 50, 30, 5);
        fontSizeSlider.position(10, 10);
        fontSizeSlider.size(80);

        //setupAsciify()
      }

      function setupAsciify() {
        p5asciify.fontSize(size);
        console.log("setupAsciify");
        //p5asciify.renderers().get("brightness").invert(true);
        p5asciify.renderers().get("brightness").update({
          characters: "0123456789",
        });
      }

      function draw() {
        let size = fontSizeSlider.value();
        p5asciify.fontSize(size);
        sketchFramebuffer.begin();


        background(0);
        orbitControl(4, 4, 0.3);
        rotateY(radians(-frameCount));
        noStroke();
        //normalMaterial();
        scale(-3);
        model(obj);

        sketchFramebuffer.end();

        image(sketchFramebuffer, -windowWidth / 2, -windowHeight / 2);
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

      //toggle ascii
      function keyPressed() {
        if (key === "A" || key === "a") {
          asciiEnabled = !asciiEnabled;
          if (asciiEnabled) {
            // setupAsciify()
            p5asciify.renderers().enable();
          } else {
            p5asciify.renderers().disable();
          }
        }
      }

      console.log("p5asciify", p5asciify);
      console.log(p5asciify.renderers().list());
