/* jshint esversion: 6, devel: true, browser: true */

// The radius of a firework
const FIREWORK_SIZE = 100;
// The size of each firework particle
const PARTICLE_SIZE = 10;
// THe duration of a firework in seconds
const FIREWORK_DURATION = 1;
// The number of particles in a firework
const NUM_FIREWORK_PARTICLES = 16;

let fireworkManager = [];

class Firework {
   constructor(x, y) {
      this.x = x;
      this.y = y;
      this.interpolation = 0;
      switch (Math.floor(Math.random() * 4)) {
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
      fireworkManager.push(this);
   }

   isGone() {
      return this.interpolation >= 1;
   }

   render(delta, ctx2d) {
      // interpolate cuz we're cool
      if (this.interpolation < 1) {
         this.interpolation += delta / FIREWORK_DURATION;
         if (this.interpolation > 1)
            this.interpolation = 1;
      }

      // get the quintic value of the animation interpolation
      let t = quintEaseOut(this.interpolation);
      // the calculated particle size (in browser space)
      let s = toBrowserH((1 - t * t * t) * PARTICLE_SIZE);
      // distance of a particle from the center of the firework
      let d = t * FIREWORK_SIZE;

      // draw all the particles yay
      ctx2d.fillStyle = intToRGBText(this.color);
      for (let i = 0; i < NUM_FIREWORK_PARTICLES; i++) {
         let angle = 2 * Math.PI * i / NUM_FIREWORK_PARTICLES;
         let particleX = this.x + Math.sin(angle) * d;
         let particleY = this.y + Math.cos(angle) * d;
         ctx2d.fillRect(toBrowserX(particleX - s / 2), toBrowserY(particleY - s / 2), s, s);
      }
   }
}

const renderSpecialEffects = (delta, ctx2d) => {
   // render fireworks
   fireworkManager.forEach(function (firework) {
      firework.render(delta, ctx2d);
      if (firework.isGone())
         fireworkManager.splice(fireworkManager.indexOf(firework), 1);
   });
};