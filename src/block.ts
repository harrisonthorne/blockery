/* jshint esversion: 6, browser: true, devel: true */

const COLOR_RED = 0xff004c;
const COLOR_ORANGE = 0xffa530;
const COLOR_GREEN = 0x50ec8c;
const COLOR_BLUE = 0x117cff;
const COLOR_TOXIC = 0x000000;
const BOUNCE_FACTOR = 0.25;
const GRAVITY = 1500;

class Block {
   constructor(initColor) {
      if (!initColor) {
         let r = Math.random();
         let c = Math.floor(r * 4);
         switch (c) {
            case 0:
               this.color = COLOR_RED;
               break;
            case 1:
               this.color = COLOR_ORANGE;
               break;
            case 2:
               this.color = COLOR_GREEN;
               break;
            case 3:
               this.color = COLOR_BLUE;
               break;
         }
      } else {
         switch (initColor) {
            case 'r':
               this.color = COLOR_RED;
               break;
            case 'o':
               this.color = COLOR_ORANGE;
               break;
            case 'g':
               this.color = COLOR_GREEN;
               break;
            case 'b':
               this.color = COLOR_BLUE;
               break;
         }
      }
      this._fill = 0; // 0 - 100
      this.x = 0;
      this.y = -75;
      this.yv = 0;
      this.z = 0;
      this.zv = Math.random() * 1000;
      this.falling = false;
      this.pit = 0;
      this.yaw = 0;
      this.rol = 0;
      this.pitV = (Math.random() - 0.5) * 360 * 2;
      this.yawV = (Math.random() - 0.5) * 360 * 2;
      this.rolV = (Math.random() - 0.5) * 360 * 2;
   }

   fall() {
      this.falling = true;
      this.yv = -500 * Math.random();
   }

   get destY() {
      return Board.toGridY(this.row) + (this.row >= 0 && this.color == COLOR_TOXIC ? Board.SPACING : 0);
   }

   blockLogic(delta, row, col) {
      this.row = row;
      this.col = col;
      this.x = Board.toGridX(this.col);

      if (this.row == -1 && !this.falling) {
         this.y = this.destY + 10 *
            (Math.sin(performance.now() / 1000 + (this.col * -Math.PI / Board.COLUMNS)) - 1);
      } else {
         this._fill = 100;
         if (delta > 2) {
            this.y = this.destY;
            this.yv = 0;
         } else
            while (delta > 0) {
               let spu = 1 / UPDATES_PER_SECOND; // Seconds per update
               let timeSlice = delta < spu ? delta : spu;

               this.yv += GRAVITY * timeSlice;
               this.y += this.yv * timeSlice;

               if (!this.falling && this.y >= this.destY) {
                  this.yv *= -BOUNCE_FACTOR;
                  this.y = this.destY;
               } else if (this.falling) {
                  this.pit += this.pitV * timeSlice;
                  this.yaw += this.yawV * timeSlice;
                  this.rol += this.rolV * timeSlice;
                  this.z += this.zv * timeSlice;
               }
               delta -= timeSlice;
            }
      }
   }

   set fill(val) {
      this._fill = val > 100 ? 100 : val;
   }

   get fill() {
      return this._fill;
   }

   isFull() {
      return this._fill >= 100;
   }

   get gone() {
      return this.y > toGLY(window.innerHeight - toBrowserY(globalYOffset)) * 1.3;
   }

   renderBlock(gl, programInfo, yOffset) {
      let f = this._fill / 100;
      // Re-assign the fill variable for a cool cubic-easing animation effect ;)
      f--;
      f = (f * f * f + 1);
      let bw = Board.BLOCK_WIDTH;
      let w = Board.BLOCK_WIDTH * ((f * 5 > 1) ? 1 : (f * 5));
      let h = bw * f;

      CubeMesh.setColor(this.color, gl, programInfo);
      CubeMesh.render(gl, this.x + (bw - w) / 2, this.y + bw - h + yOffset, this.z, w, h, w, this.pit, this.yaw, this.rol);
   }
}
