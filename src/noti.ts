/* jshint esversion: 6 */
/* global applyShadow, removeShadow, BOARD, getSansFont, UI_SHADOW, UI_MAX_ALPHA, quintEaseOut, StatusBar.x, StatusBar.Width, StatusBar.Height, toBrowserX, toBrowserY, toBrowserW, toBrowserH */

const NOTIFICATION_ANIMATE_DURATION = 0.5;
let notiMessage = '';
let notiDuration = 0;
let notiElapsedTime = 0;
const NOTIFICATION_HEIGHT = StatusBar.height * 3 / 4;
const renderNotifications = (delta, ctx2d) => {
   if (notiElapsedTime > notiDuration) return;
   notiElapsedTime += delta;

   let enter = quintEaseOut(notiElapsedTime / NOTIFICATION_ANIMATE_DURATION);
   enter = Math.min(1, enter);

   let exit = 1 - quintEaseOut((notiDuration - notiElapsedTime) / NOTIFICATION_ANIMATE_DURATION);
   exit = Math.max(0, exit);

   let x = toBrowserX(StatusBar.x);
   let y = toBrowserY(-(NOTIFICATION_HEIGHT + UI_SHADOW) * (1 - (enter - exit)));
   let w = toBrowserW(StatusBar.width);
   let h = toBrowserH(NOTIFICATION_HEIGHT);

   ctx2d.save();

   applyShadow(ctx2d);
   ctx2d.fillStyle = "rgba(255, 255, 255, " + UI_MAX_ALPHA + ")";
   ctx2d.fillRect(x, y, w, h);
   removeShadow(ctx2d);

   ctx2d.beginPath();
   ctx2d.rect(x, y, w, h);
   ctx2d.clip();

   // Render the message
   ctx2d.fillStyle = "black";
   ctx2d.font = getSansFont();
   ctx2d.textAlign = "center";
   ctx2d.textBaseline = "middle";
   let textY = (h / 2) + (enter >= 1 ? y : y / 2);
   ctx2d.fillText(notiMessage, x + w / 2, textY);

   ctx2d.restore();
};

const sendNotification = (message, duration) => {
   notiMessage = message;
   if (duration) notiDuration = duration;
   else notiDuration = NOTIFICATION_ANIMATE_DURATION * 2;
   notiElapsedTime = 0;
};
