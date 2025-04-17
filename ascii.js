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

      function preload() {
        obj = loadModel("3d/VoxelCat2.obj");
      }

      function setup() {
        createCanvas(windowWidth, windowHeight, WEBGL);
        sketchFramebuffer = createFramebuffer({
          format: FLOAT,
        });
        fill(255, 0, 0, 50);
        fontSizeSlider = createSlider(5, 50, 50, 5);
        fontSizeSlider.position(10, 10);
        fontSizeSlider.size(80);

        //setupAsciify()
      }

      function setupAsciify() {
        p5asciify.fontSize(size);
        //p5asciify.renderers().get("brightness").invert(true);
        p5asciify.renderers().get("brightness").update({
          characters: "1234567890",
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
        scale(-300);
        model(obj);

        sketchFramebuffer.end();

        image(sketchFramebuffer, -windowWidth / 2, -windowHeight / 2);
      }

      //toggle ascii
      function keyPressed() {
        if (key === "A" || key === "a") {
          asciiEnabled = !asciiEnabled;
          if (asciiEnabled) {
            p5asciify.renderers().enable();
            //setupAsciify()
          } else {
            p5asciify.renderers().disable();
          }
        }
      }