/* jshint esversion: 6, devel: true, browser: true */

let resetButton;

const initSettings = () => {
   let w = StatusBar.width / 2;
   let h = StatusBar.height / 2;
   resetButton = new Button(VISIBLE_WIDTH / 2 - w / 2, VISIBLE_HEIGHT / 2 - h / 2, w, h, COLOR_RED, "Reset everything", function () {
      Data.reset();
   });
};

const renderSettings = (delta, gl, programInfo, ctx2d, yOffset) => {
   ctx2d.fillStyle = "white";
   ctx2d.textBaseline = "middle";
   ctx2d.textAlign = "center";
   ctx2d.font = toBrowserH(24) + "px New Cicle Fina";
   ctx2d.fillText("(Do not push)", toBrowserX(VISIBLE_WIDTH / 2), toBrowserY(VISIBLE_HEIGHT / 2 + resetButton.h + yOffset));
   resetButton.render(delta, gl, programInfo, ctx2d, yOffset);
};