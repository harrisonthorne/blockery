/* jshint esversion: 6, browser: true, devel: true */
/* global globalYOffset, UI_PADDING, CAMERA_Z, debug, VISIBLE_WIDTH, VISIBLE_HEIGHT, cubicEaseIn, cubicEaseOut, rgbToInt, intToRGB, toBrowserX, toBrowserY, toBrowserW, toBrowserH, CUBE_MESH, Board, mouseListeners */

const BUTTON_DEFAULT_TEXT_HEIGHT = 25;
const BUTTON_DEPTH = Board.BLOCK_WIDTH;

let buttons = [];

const resetVisibleButtonFlags = () => {
   buttons.forEach(function (button) {
      button.visible = false;
   });
};

mouseListeners.push({
   onClick: function (mx, my) {
      buttons.forEach(function (button) {
         if (button.visible)
            button.onClick(mx, my);
      });
   },
   onMouseMove: function (mx, my) {
      buttons.forEach(function (button) {
         if (button.visible)
            button.onMouseMove(mx, my);
      });
   }
});


class Button {
   constructor(x, y, w, h, color, text, action) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.yOffset = 0;
      this.color = color;
      this.disabledColor = this.toGrayscale(color);
      this.text = text;
      this.action = action;
      this.typeface = "New Cicle Fina";
      this.fontSize = BUTTON_DEFAULT_TEXT_HEIGHT;
      this.enabled = true;

      this.hovering = false;
      this.pressInter = 0;
      this.pressInterVelocity = -1;
      this.liftInter = 0;

      // a flag to tell if the button has been rendered. it is
      // reset at the beginning of every render loop to false,
      // and set to true and the end of the button's
      // render() method
      this.visible = false;

      // add this button to the pile of buttons
      buttons.push(this);
   }

   onClick(mx, my) {
      if (!this.visible || !this.enabled)
         return;

      if (this.coordinateInBounds(mx, my)) {
         this.pressInterVelocity = 1;
         if (this.action) this.action();
      }
   }

   coordinateInBounds(x, y) {
      return x >= this.x && x <= this.x + this.w && y >= this.y + this.yOffset && y <= this.y+this.yOffset + this.h;
   }

   onMouseMove(mx, my) {
      if (!this.visible || !this.enabled) {
         this.hovering = false;
         return;
      }

      if (this.coordinateInBounds(mx, my)) {
         this.hovering = true;
      } else {
         this.hovering = false;
      }
   }

   toGrayscale(color) {
      let rgb = intToRGB(color);
      let gray = (rgb.r + rgb.g + rgb.b) / 3;

      return rgbToInt(gray, gray, gray);
   }

   addHighlightToColor(color) {
      let addHighlight = this.liftInter * 0.05;
      let rgb = intToRGB(color);

      rgb.r += addHighlight;
      if (rgb.r > 1) rgb.r = 1;

      rgb.g += addHighlight;
      if (rgb.g > 1) rgb.g = 1;

      rgb.b += addHighlight;
      if (rgb.b > 1) rgb.b = 1;

      return rgbToInt(rgb.r, rgb.g, rgb.b);
   }

   renderBody(gl, programInfo, z) {
      CubeMesh.setColor(this.enabled ? (this.addHighlightToColor(this.color)) : this.disabledColor, gl, programInfo);
      CubeMesh.render(gl, this.x, this.y + this.yOffset, z, this.w, this.h, BUTTON_DEPTH);
   }

   renderTopLayer(ctx2d, buttonCenterX2D, buttonCenterY2D, toNewDepth) {
      if (!this.text) return;
      ctx2d.fillStyle = "white";
      ctx2d.font = toBrowserH(toBrowserH(this.fontSize) * toNewDepth) + "px " + this.typeface;
      ctx2d.textAlign = "center";
      ctx2d.textBaseline = "middle";
      ctx2d.fillText(this.text, buttonCenterX2D, buttonCenterY2D);
   }

   render(delta, gl, programInfo, ctx2d, yOffset) {
      this.yOffset = yOffset||0;

      // Interpolation properties for animation //

      this.pressInter += this.pressInterVelocity * delta * 10;
      if (this.pressInter < 0)
         this.pressInter = 0;
      else if (this.pressInter > 1) {
         this.pressInterVelocity *= -1;
         this.pressInter = 1;
      }

      this.liftInter += (this.hovering ? 1 : -1) * delta * 2;
      if (this.liftInter < 0)
         this.liftInter = 0;
      else if (this.liftInter > 1)
         this.liftInter = 1;

      let maxPress = BUTTON_DEPTH * 3 / 4;
      let maxLift = -10;

      // 3D button rendering //

      // Get z offset of pressing the button
      let z = (this.pressInterVelocity > 0 ? cubicEaseOut(this.pressInter) : cubicEaseIn(this.pressInter)) * maxPress;
      // and displace further by the mouse-hover effect
      z += (this.hovering ? cubicEaseOut(this.liftInter) : cubicEaseIn(this.liftInter)) * maxLift;


      // Render the 3D button body
      this.renderBody(gl, programInfo, z);

      // 2D text rendering //

      // Get the proportionality constant (height on screen = k * (height of mesh / depth from viewer))
      // v can really be any number but 0
      let v = 300;
      let k = toBrowserH(v) * CAMERA_Z / v;
      let toNewDepth = (CAMERA_Z - z) / k;

      // Yes, the following lines of code convert to *gl space*
      // Calculate the new x coordinate in gl space
      let xDistanceFromCenter = toBrowserY(VISIBLE_WIDTH / 2 - (this.x + this.w / 2)) * toNewDepth;
      let buttonCenterX = VISIBLE_WIDTH / 2 - xDistanceFromCenter;

      // Calculate the new y coordinate in gl space
      let yDistanceFromCenter = toBrowserY(VISIBLE_HEIGHT / 2 - (this.y + this.yOffset + this.h / 2)) * toNewDepth;
      let buttonCenterY = VISIBLE_HEIGHT / 2 - yDistanceFromCenter;

      // Render the text!
      this.renderTopLayer(ctx2d, toBrowserX(buttonCenterX), toBrowserY(buttonCenterY), toNewDepth);

      this.visible = true;
   }
}

class ImageButton extends Button {
   constructor(x, y, w, h, color, imgSrc, action) {
      super(x, y, w, h, color, null, action);
      this.img = new Image();
      if (imgSrc)
         this.imgSrc = imgSrc;
      this._enabled = true;
   }

   set enabled(val) {
      this._enabled = val;
      if (val) {

      }
   }

   get enabled() {
      return this._enabled;
   }

   set imgSrc(val) {
      this.img.src = val;
   }

   get imgSrc() {
      return this.img.src;
   }

   renderTopLayer(ctx2d, buttonCenterX2D, buttonCenterY2D, toNewDepth) {
      if (!this.imgSrc) return;
      let w = toBrowserW(toBrowserW(this.w - UI_PADDING) * toNewDepth);
      let h = toBrowserH(toBrowserH(this.h - UI_PADDING) * toNewDepth);
      ctx2d.drawImage(this.img, buttonCenterX2D - w / 2, buttonCenterY2D - h / 2, w, h);
      super.renderTopLayer(ctx2d, buttonCenterX2D, buttonCenterY2D, toNewDepth);
   }
}

class ProgressButton extends Button {
   constructor(x, y, w, h, colorFill, colorEmpty, text, action) {
      super(x, y, w, h, null, text, action);
      this.colorFill = colorFill;
      this.colorEmpty = colorEmpty;
      /** An indicator from 0 to 1 */
      this.progress = 0.75;
   }

   renderBody(gl, programInfo, z, yOffset) {
      this.yOffset = yOffset || 0;

      CubeMesh.setColor(this.addHighlightToColor(this.colorFill), gl, programInfo);
      CubeMesh.render(gl, this.x, this.y+this.yOffset, z, this.w * this.progress, this.h, BUTTON_DEPTH);

      CubeMesh.setColor(this.enabled ? this.addHighlightToColor(this.colorEmpty) : this.toGrayscale(this.colorEmpty), gl, programInfo);
      CubeMesh.render(gl, this.x + this.w * this.progress, this.y+this.yOffset, z, this.w * (1 - this.progress), this.h, BUTTON_DEPTH);
   }
}
