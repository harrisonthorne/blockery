/* jshint esversion: 6, browser: true, devel: true */

let dialogs = [];

const DIALOG_ANIMATE_DURATION = 0.25;

const DIALOG_TITLE_TEXT_HEIGHT = 35;
const DIALOG_TITLE_COLOR = "rgba(0, 0, 0, 1)";

const DIALOG_MESSAGE_COLOR = "rgba(0, 0, 0, 0.75)";
const DIALOG_MESSAGE_SPACING = 1.15;

const DIALOG_BUTTON_TEXT_HEIGHT = 25;
const DIALOG_BUTTON_HEIGHT = 50;

class Dialog {

   constructor(ctx2d, title, message) {
      this.titleWrap = '';
      this.messageWrap = '';
      this.ctx = ctx2d;
      this.title = title;
      this.message = message;

      this.backgroundColor = 'rgba(255, 255, 255,' + UI_MAX_ALPHA + ')';
      this.textColor = 'rgba(0, 0, 0, 1)';

      this.positiveButton = this.DEFAULT_BUTTON;
      this.negativeButton = null;
      this.neutralButton = null;

      this.positiveButtonBackground = this.negativeButtonBackground = this.neutralButtonBackground = 'rgba(255, 255, 255, 1)';
      this.positiveButtonTextColor = intToRGBText(COLOR_GREEN);
      this.negativeButtonTextColor = intToRGBText(COLOR_RED);
      this.neutralButtonTextColor = intToRGBText(COLOR_ORANGE);
   }

   get DEFAULT_BUTTON() {
      return new DialogButton(this, BUTTON_POSITIVE, "Dismiss", function (dialog) {
         dialog.dismiss();
      });
   }

   onClick(mx, my) {
      this.positiveButton.onClick(mx, my);
      if (this.negativeButton)
         this.negativeButton.onClick(mx, my);
      if (this.neutralButton)
         this.neutralButton.onClick(mx, my);
   }

   onMouseMove(mx, my) {
      this.positiveButton.onMouseMove(mx, my);
      if (this.negativeButton)
         this.negativeButton.onMouseMove(mx, my);
      if (this.neutralButton)
         this.neutralButton.onMouseMove(mx, my);
   }

   setButton(type, text, action) {
      let button = text && action ? new DialogButton(this, type, text, action) : null;
      switch (type) {
         case BUTTON_POSITIVE:
            if (!button)
               this.positiveButton = this.DEFAULT_BUTTON;
            else
               this.positiveButton = button;
            break;
         case BUTTON_NEGATIVE:
            this.negativeButton = button;
            break;
         case BUTTON_NEUTRAL:
            this.neutralButton = button;
            break;
      }
      return this;
   }

   get TITLE_FONT() {
      return toBrowserH(DIALOG_TITLE_TEXT_HEIGHT) + "px New Cicle Fina";
   }

   show() {
      this.ctx.font = this.TITLE_FONT;
      this.titleWrap = getWrappedLines(this.ctx, this.title, this.width - UI_PADDING * 2);

      this.ctx.font = getSansFont();
      this.messageWrap = getWrappedLines(this.ctx, this.message, this.width - UI_PADDING * 2);

      // Reset all mouse move listeners
      mouseListeners.forEach(function (listener) {
         if (listener.onMouseMove)
            listener.onMouseMove(NaN, NaN);
      });
      dialogs.push(this);
      this.enterInter = 0;
   }

   get height() {
      return UI_PADDING +
         (this.titleWrap ? this.titleWrap.length : 0) * DIALOG_TITLE_TEXT_HEIGHT +
         UI_PADDING +
         (this.messageWrap ? this.messageWrap.length : 0) * UI_SANS_TEXT_HEIGHT * DIALOG_MESSAGE_SPACING +
         UI_PADDING / 2 +
         DIALOG_BUTTON_HEIGHT +
         UI_PADDING;
   }

   get width() {
      return VISIBLE_WIDTH * 7 / 8;
   }

   dismiss() {
      dialogs.splice(dialogs.indexOf(this), 1);
   }

   render(delta, gl, programInfo) {
      if (this.enterInter < 1) {
         this.enterInter += delta / DIALOG_ANIMATE_DURATION;
         if (this.enterInter > 1) this.enterInter = 1;
      }

      let ctx = this.ctx;

      // Browser padding
      let p = toBrowserH(UI_PADDING);

      let w = this.width;
      let h = quintEaseOut(this.enterInter) * this.height;
      let x = VISIBLE_WIDTH / 2 - w / 2;
      let y = VISIBLE_HEIGHT / 2 - h / 2;

      // Convert to browser window space
      w = toBrowserW(w);
      x = toBrowserX(x);
      y = toBrowserY(y);
      h = toBrowserH(h);

      // Draw the dialog card
      ctx.fillStyle = this.backgroundColor;

      applyShadow(ctx);
      ctx.fillRect(x, y, w, h);
      removeShadow(ctx);

      // Clip the dialog space so that text is not rendered outside of it
      ctx.save();

      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = this.textColor;

      // Draw text! //

      // Start drawing text at this dialog's browser-based y plus padding
      let drawY = y + p;

      // Render the title of the dialog
      if (this.titleWrap) {
         ctx.font = this.TITLE_FONT;
         for (let i = 0; i < this.titleWrap.length; i++) {
            ctx.fillText(this.titleWrap[i], x + p, drawY);
            drawY += toBrowserH(DIALOG_TITLE_TEXT_HEIGHT);
         }
      }

      drawY += p;

      // Render the message of the dialog
      if (this.messageWrap) {
         ctx.font = getSansFont();
         for (let i = 0; i < this.messageWrap.length; i++) {
            ctx.fillText(this.messageWrap[i], x + p, drawY);
            drawY += toBrowserH(UI_SANS_TEXT_HEIGHT * DIALOG_MESSAGE_SPACING);
         }
      }
      // Reset clipping
      ctx.restore();

      let buttonX = x + w - p / 2 - this.positiveButton.width;
      let buttonY = y + h - p / 2 - toBrowserH(DIALOG_BUTTON_HEIGHT);
      this.positiveButton.render(buttonX, buttonY, this.positiveButtonBackground, this.positiveButtonTextColor);
      if (this.negativeButton) {
         buttonX -= this.negativeButton.width;
         this.negativeButton.render(buttonX, buttonY, this.negativeButtonBackground, this.negativeButtonTextColor);
      }
      if (this.neutralButton) {
         buttonX = x + p / 2;
         this.neutralButton.render(buttonX, buttonY, this.neutralButtonBackground, this.neutralButtonTextColor);
      }
   }
}

const BUTTON_POSITIVE = 0;
const BUTTON_NEGATIVE = 1;
const BUTTON_NEUTRAL = 2;

class DialogButton {
   constructor(dialog, type, text, action) {
      this.dialog = dialog;
      this.type = type;
      this.text = text;
      this.action = action;
      this.hovering = false;
   }

   coordinateInRange(mx, my) {
      return mx >= toGLX(this.x) && mx <= toGLX(this.x + this.width) && my >= toGLY(this.y) && my <= toGLY(this.y) + DIALOG_BUTTON_HEIGHT;
   }

   onMouseMove(mx, my) {
      this.hovering = this.coordinateInRange(mx, my);
   }

   onClick(mx, my) {
      if (this.coordinateInRange(mx, my)) {
         this.action(this.dialog);
      }
   }

   /** Returns a button width usable in browser window space. */
   get width() {
      let ctx = this.dialog.ctx;
      ctx.font = DialogButton.FONT;
      return toBrowserW(UI_PADDING * 2) + ctx.measureText(this.text.toUpperCase()).width;
   }

   static get FONT() {
      return toBrowserH(DIALOG_BUTTON_TEXT_HEIGHT) + "px New Cicle Fina";
   }

   render(browserX, browserY, backgroundColor, textColor) {
      let ctx = this.dialog.ctx;
      this.x = browserX;
      this.y = browserY;
      if (this.hovering) {
         ctx.fillStyle = backgroundColor;
         ctx.fillRect(browserX, browserY, this.width, toBrowserH(DIALOG_BUTTON_HEIGHT));
      }
      ctx.fillStyle = textColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(this.text.toUpperCase(), browserX + this.width / 2, browserY + toBrowserY(DIALOG_BUTTON_HEIGHT / 2));
   }
}

class RedDialog extends Dialog {
   constructor(ctx2d, title, message) {
      super(ctx2d, title, message);
      this.backgroundColor = intToRGBText(COLOR_RED);
      this.textColor = "white";

      this.negativeButtonTextColor = this.positiveButtonTextColor = "white";
      this.negativeButtonBackground = this.positiveButtonBackground = "rgba(0, 0, 0, 0.2)";
   }
}

let backgroundInter = 0;

const renderDialogs = (delta, gl, programInfo, ctx2d) => {
   ctx2d.fillStyle = "rgba(0, 0, 0," + cubicEaseOut(backgroundInter) * 0.5 + ")";
   ctx2d.fillRect(0, 0, window.innerWidth, window.innerHeight);

   if (dialogs[0]) {
      if (backgroundInter < 1) {
         backgroundInter += delta / 0.25;
         if (backgroundInter > 1) backgroundInter = 1;
      }

      dialogs[0].render(delta, gl, programInfo);
   } else {
      if (backgroundInter > 0) {
         backgroundInter -= delta / 0.25;
         if (backgroundInter < 0) backgroundInter = 0;
      }
   }
};
