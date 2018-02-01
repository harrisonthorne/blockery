/* jshint esversion: 6, browser: true, devel: true */
/* global VISIBLE_HEIGHT, VISIBLE_WIDTH */

const intToRGB = (rgb) => {
   // 0xrrggbb
   let red = (rgb >> 16) / 255;
   let green = ((rgb >> 8) & 0xff) / 255;
   let blue = (rgb & 0xff) / 255;
   return {
      r: red,
      g: green,
      b: blue,
   };
};

const intToARGB = (argb) => {
   let color = intToRGB(argb);
   color.a = (argb >> 24) / 255;
   return color;
};

const intToARGBText = (argb) => {
   let color = intToARGB(argb);
   return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
};
const intToRGBText = (rgb) => {
   let color = intToRGB(rgb);
   return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`;
};

const rgbToInt = (r, g, b) => {
   r *= 255;
   g *= 255;
   b *= 255;
   return (r << 16) + (g << 8) + (b);
};

const windowWidth = () => window.innerWidth;
const windowHeight = () => window.innerHeight;

/************************************************
 * LOAD TEXT RESOURCE
 * Passes an error or, if no error, null and a 
 * result into callback.
 ************************************************/
function loadTextResource(url, callback) {
   let request = new XMLHttpRequest();
   request.open("GET", url, true);
   request.onload = function () {
      if (request.status < 200 || request.status > 299) {
         callback("Error: HTTP Status " + request.status + " on resource " + url);
      } else {
         callback(null, request.responseText);
      }
   };
   request.send();
}

/************************************************
 * TO GL X
 * Converts an x-coordinate in the browser window
 * to an x-coordinate usable in the WebGL matrix
 * space.
 ************************************************/
const toGLX = (clientX) => (VISIBLE_HEIGHT * (2 * clientX - windowWidth())) / (2 * windowHeight()) + VISIBLE_WIDTH / 2;

/************************************************
 * TO GL Y
 * Converts an y-coordinate in the browser window
 * to an y-coordinate usable in the WebGL matrix
 * space.
 ************************************************/
const toGLY = (clientY) => clientY * (VISIBLE_HEIGHT / windowHeight());

/************************************************
 * TO BROWSER X
 * Converts an x-coordinate in the WebGL matrix
 * space to an x-coordinate usable in the browser
 * window.
 ************************************************/
const toBrowserX = (glX) => (2 * windowHeight() * glX - windowHeight() * VISIBLE_WIDTH + windowWidth() * VISIBLE_HEIGHT) / (2 * VISIBLE_HEIGHT);

/************************************************
 * TO BROWSER Y
 * Converts an y-coordinate in the WebGL matrix
 * space to an y-coordinate usable in the browser
 * window.
 ************************************************/
const toBrowserY = (glY) => glY * windowHeight() / VISIBLE_HEIGHT;

/************************************************
 * TO BROWSER W
 * Converts a width dimension in the WebGL matrix
 * space to a width dimension usable in the browser
 * window.
 ************************************************/
const toBrowserW = (glW) => glW * windowHeight() / VISIBLE_HEIGHT;

/************************************************
 * TO BROWSER H
 * Converts a height dimension in the WebGL matrix
 * space to a height dimension usable in the browser
 * window.
 ************************************************/
const toBrowserH = (glH) => toBrowserY(glH);

const isMobile = () => {
   return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

const getWrappedLines = (ctx2d, text, maxWidth) => {
   if (!text) return;

   // Convert to browser window space
   maxWidth = toBrowserW(maxWidth);
   let result = [];
   let words = text.split(' ');
   let line = '';

   for (let i = 0; i < words.length; i++) {
      let test = line + words[i];

      if (ctx2d.measureText(test).width <= maxWidth) {
         line = test + ' ';
      } else {
         result.push(line);
         line = words[i] + ' ';
      }
   }

   if (line.length > 0) {
      result.push(line);
   }

   return result;
};

const cubicEaseIn = (t) => {
   return t * t * t;
};


const cubicEaseOut = (t) => {
   t--;
   return (t * t * t + 1);
};

const quintEaseIn = (t) => {
   return t * t * t * t * t;
};


const quintEaseOut = (t) => {
   t--;
   return (t * t * t * t * t + 1);
};
