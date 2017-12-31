/* jshint esversion: 6 */
/* global toBrowserH */

const UI_SHADOW = 10;
const UI_PADDING = 25;

const UI_SANS_TEXT_HEIGHT = 20;

/* The maximum alpha for 2D dialogs, notifications */
const UI_MAX_ALPHA = 0.95;

const getSansFont = () => {
   return toBrowserH(UI_SANS_TEXT_HEIGHT) + "px sans-serif";
};

const applyShadow = (ctx) => {
   ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
   ctx.shadowBlur = toBrowserH(UI_SHADOW);
   ctx.shadowOffsetY = toBrowserH(UI_SHADOW);
};

const removeShadow = (ctx) => {
   ctx.shadowBlur = 0;
   ctx.shadowOffsetY = 0;
};

const Theme = {
   background: {
      r: 0.9,
      g: 0.9,
      b: 0.9
   },
   settings: {
      background: {
         r: 0.1,
         g: 0.1,
         b: 0.2
      }
   }
};