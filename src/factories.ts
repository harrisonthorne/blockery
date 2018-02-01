/* jshint esversion: 6 */

const COLOR_DISABLED_PURCHASE = 0x002caf;
const COLOR_DARK_GREEN = 0x009c3c;
const COLOR_DARK_ORANGE = 0xaf5500;

let globalBlockRateMultiplier = 1,
   globalPollutionMultiplier = 1,
   globalCapacityMultiplier = 1,
   globalEmptyRateMultiplier = 1,
   globalPriceMultiplier = 1;

const PRICE_INCREASE = 1.25; // 125%
const BASE_EMPTY_RATE = 100;

const PURCHASE_BUTTON_SIZE = Board.BLOCK_WIDTH * 3;
const STORAGE_BUTTON_HEIGHT = Board.BLOCK_WIDTH * 1.5;

let factoriesUnlocked = 0;
const FACTORIES_PER_PAGE = 3;
let currentFactoryPage = 0;
let factoriesMenuYOffset = 0;

class Factory {
   constructor(factoryCode, index, name, imgSrc, basePrice, blockRate, pollutionRate, capacity) {
      this.factoryCode = factoryCode;
      this.index = index;
      this.page = index / FACTORIES_PER_PAGE;
      this.name = name;
      this.imgSrc = imgSrc;
      this.basePrice = basePrice;
      this.baseProductionRate = blockRate;
      this.basePollutionRate = pollutionRate;
      this.baseCapacity = capacity;
      this.blocksHeld = 0;
      this.localBlockRateMultiplier = 1;
      this.localPollutionMultiplier = 1;
      this.localCapactiyMultiplier = 1;
      this.localPriceMultiplier = 1;
      this.amountOwned = 0;

      this.peek = false;
      this.available = false;

      this.totalPollutionProduced = 0;
      this.totalBlocksProduced = 0;

      this.progressButton = new ProgressButton(StatusBar.x, 0, StatusBar.width, STORAGE_BUTTON_HEIGHT, COLOR_GREEN, COLOR_DARK_GREEN, '', () => {
         this.queueForEmptying();
      });
      this.progressButton.typeface = 'Digital-7';

      this.imageButton = new ImageButton(StatusBar.x, 0, PURCHASE_BUTTON_SIZE, PURCHASE_BUTTON_SIZE, COLOR_BLUE, "img/unknown.png", () => {
         this.buy();
      });
      this.imageButton.disabledColor = COLOR_DISABLED_PURCHASE;

      this.wasHidden = true;
   }

   logic(delta) {
      this.produceBlocks(delta);
   }

   queueForEmptying() {
      this.queued = true;
   }

   empty() {
      this.emptying = true;
      this.queued = false;
   }

   emptyImmediately() {
      let emptiedBlocks = Math.floor(this.blocksHeld);
      Data.currentBlocks += emptiedBlocks;
      this.blocksHeld -= emptiedBlocks;
      this.emptying = false;
      this.queued = false;
   }

   produceBlocks(delta) {
      if (this.emptying) {

         let emptiedBlocks = Factory.EMPTY_RATE * delta;

         if (emptiedBlocks > this.blocksHeld) {
            // If we have emptied more blocks than this factory is holding,
            // set delta to the amount of time put into emptying nonexistent
            // blocks so that it can be used after this if statement to produce
            // blocks
            delta = (emptiedBlocks - Math.floor(this.blocksHeld)) / (Factory.EMPTY_RATE);
            Data.currentBlocks += Math.floor(this.blocksHeld);
            this.blocksHeld -= Math.floor(this.blocksHeld);
            this.emptying = false;
         } else {

            // Otherwise, just empty the blocks as expected and return from this
            // function so that we do not produce blocks while we empty
            this.blocksHeld -= emptiedBlocks;
            Data.currentBlocks += emptiedBlocks;
            return;
         }

      }


      if (!globalBlockProductionEnabled)
         return;

      // Produce blocks and pollution
      if (this.blocksHeld < this.totalCapacity) {

         let newBlocks = this.totalBlockRate * delta;
         this.totalBlocksProduced += newBlocks;
         this.blocksHeld += newBlocks;
         if (this.blocksHeld > this.totalCapacity)
            this.blocksHeld = this.totalCapacity;

         let newPollution = this.totalPollutionRate * delta;
         Data.currentPollution += newPollution;
         this.totalPollutionProduced += newPollution;
      }
   }

   isAffordable(blocks) {
      return blocks >= this.price;
   }

   isBasePriceAffordable(blocks) {
      return blocks >= this.basePrice;
   }

   buy() {
      if (this.isAffordable(Data.currentBlocks)) {
         Data.currentBlocks -= this.price;
         this.amountOwned++;
         new Firework(this.imageButton.x + this.imageButton.w / 2, this.imageButton.y + this.imageButton.h / 2);
      }
   }

   get totalBlockRate() {
      return this.amountOwned * this.singularBlockRate;
   }

   get singularBlockRate() {
      return this.baseProductionRate * this.localBlockRateMultiplier * globalBlockRateMultiplier;
   }

   get totalCapacity() {
      return this.amountOwned * this.baseCapacity * this.localCapactiyMultiplier * globalCapacityMultiplier;
   }

   get totalPollutionRate() {
      return this.amountOwned * this.basePollutionRate * this.localPollutionMultiplier * globalPollutionMultiplier;
   }

   static get EMPTY_RATE() {
      return BASE_EMPTY_RATE * globalEmptyRateMultiplier;
   }

   get price() {
      return Math.floor(this.basePrice * Math.pow(PRICE_INCREASE, this.amountOwned) * this.localPriceMultiplier * globalPriceMultiplier);
   }

   /** Includes padding at the bottom. */
   static get infoCardHeight() {
      return PURCHASE_BUTTON_SIZE + STORAGE_BUTTON_HEIGHT + UI_PADDING * 2;
   }

   get visibleOnPage() {
      return Math.floor(this.index / FACTORIES_PER_PAGE) == currentFactoryPage;
   }

   renderOptions(delta, gl, programInfo, ctx2d, yOffset) {
      if (!this.visibleOnPage || this.index > factoriesUnlocked) {
         this.imageButton.enabled = false;
         this.progressButton.enabled = false;
         return;
      }

      let hidden = factoriesUnlocked === this.index;
      if (!hidden && this.wasHidden) {
         this.imageButton.imgSrc = this.imgSrc;
         this.wasHidden = hidden;
      }

      // Assign an easier variable for UI_PADDING
      let p = UI_PADDING;

      let statusBarHeight = StatusBar.height;
      let y = statusBarHeight + (getPageChangerButtonY() - statusBarHeight) / 2 - (Factory.infoCardHeight * FACTORIES_PER_PAGE - UI_PADDING * 2) / 2 + this.index % FACTORIES_PER_PAGE * Factory.infoCardHeight + yOffset;

      this.imageButton.enabled = Data.currentBlocks >= this.price && !hidden;
      this.imageButton.y = y;
      this.imageButton.text = (this.amountOwned > 0) ? this.amountOwned : 0;
      this.imageButton.render(delta, gl, programInfo, ctx2d);

      ctx2d.textAlign = 'left';
      ctx2d.textBaseline = 'top';
      ctx2d.fillStyle = 'black';

      // Header
      let textX = toBrowserX(this.imageButton.x + this.imageButton.w + UI_PADDING);
      let textY = toBrowserY(this.imageButton.y);
      ctx2d.font = toBrowserH(DIALOG_TITLE_TEXT_HEIGHT) + 'px New Cicle Fina';
      ctx2d.fillText(hidden ? 'Under Construction' : this.name, textX, textY);

      // Info //
      ctx2d.font = getSansFont();
      ctx2d.textBaseline = 'alphabetical';
      textY = toBrowserY(this.imageButton.y + DIALOG_TITLE_TEXT_HEIGHT * 1.15);

      ctx2d.fillText('Costs ' + this.price.toLocaleString() + ' for +' + this.singularBlockRate.toLocaleString() + ' bps', textX, textY);

      // If this factory is owned...
      if (this.amountOwned > 0) {
         // ...declare 'full' if its capacity has been reached...
         let fillStatusText;
         if (this.queued && !this.emptying) {
            fillStatusText = "Queued for emptying";
         } else if (this.blocksHeld === this.totalCapacity) {
            fillStatusText = 'Full';
            // ...or, display how much time it will take until it is full (if not emptying)
            // or empty (if emptying)
         } else {
            // Get the time remaining...
            let timeLeft;
            if (this.emptying)
               // ...until empty
               timeLeft = this.blocksHeld / Factory.EMPTY_RATE;
            else
               // ... until full
               timeLeft = (this.totalCapacity - this.blocksHeld) / this.totalBlockRate;

            // By default, time is measured in seconds but reduced to larger
            // time units if timeLeft is too large
            let timeUnit = 'seconds';

            if (timeLeft >= 3600 * 24 * 7) {
               timeLeft /= 3600 * 24 * 7;
               timeUnit = 'weeks';
            } else if (timeLeft >= 3600 * 24) {
               timeLeft /= 3600 * 24;
               timeUnit = 'days';
            } else if (timeLeft >= 3600) {
               timeLeft /= 3600;
               timeUnit = 'hours';
            } else if (timeLeft >= 60) {
               timeLeft /= 60;
               timeUnit = 'minutes';
            }

            if (timeUnit === 'seconds') {
               // round (up) to tenths of seconds
               timeLeft = (Math.ceil(timeLeft * 10) / 10).toFixed(1);
            } else {
               // or just ceiling everything else
               timeLeft = Math.ceil(timeLeft);
            }

            fillStatusText = (this.emptying ? 'Empty in ' : 'Full in ') + timeLeft + ' ' + timeUnit;
         }
         if (fillStatusText)
            ctx2d.fillText(fillStatusText, textX, textY + toBrowserH(UI_SANS_TEXT_HEIGHT) * 1.15);

         this.progressButton.colorFill = this.emptying ? COLOR_RED : (this.queued ? COLOR_ORANGE : COLOR_GREEN);
         this.progressButton.colorEmpty = this.queued ? COLOR_DARK_ORANGE : COLOR_DARK_GREEN;
         this.progressButton.enabled = !this.emptying;
         this.progressButton.progress = this.blocksHeld / this.totalCapacity;
         this.progressButton.text = Math.floor(this.blocksHeld) + ' / ' + this.totalCapacity;
         this.progressButton.y = y + this.imageButton.h;
         this.progressButton.render(delta, gl, programInfo, ctx2d);
      }
   }

   applyCode(version, code) {
      switch (version) {
         case 1:
            let split = code.split('|');
            this.amountOwned = Number.parseInt(split[0]);
            this.blocksHeld = Number.parseFloat(split[1]);
            this.totalBlocksProduced = Number.parseFloat(split[2]);
            this.totalPollutionProduced = Number.parseFloat(split[3]);
            break;
      }
   }

   get saveCode() {
      return `${this.amountOwned}|${this.blocksHeld}|${this.totalBlocksProduced}|${this.totalPollutionProduced}`;
   }
}

// Excuse this mess
let factories = {
   smit: new Factory("smit", 0, 'Blocksmith', 'img/smit.png', 500, 0.5, 0.1, 50),
   cott: new Factory("cott", 1, 'Cottage Factory', 'img/cott.png', 500 * 15, 0.5 * 4, 0.1 * 5, 50 * 6),
   mine: new Factory("mine", 2, 'Block Mine', 'img/mine.png', 500 * 15 * 15, 0.5 * 4 * 8, 0.1 * 5 * 10, 50 * 6 * 12),
   powh: new Factory("powh", 3, 'Powerhouse', 'img/powh.png', 500 * 15 * 15 * 15, 0.5 * 4 * 8 * 12, 0.1 * 5 * 10 * 15, 50 * 6 * 12 * 18),
   clmk: new Factory("clmk", 4, 'Cloudmaker', 'img/clmk.png', 500 * 15 * 15 * 15 * 15, 0.5 * 4 * 8 * 12 * 16, 0.1 * 5 * 10 * 15 * 20, 50 * 6 * 12 * 18 * 24),
   volc: new Factory("volc", 5, 'Block Volcano', 'img/volc.png', 500 * 15 * 15 * 15 * 15 * 15, 0.5 * 4 * 8 * 12 * 16 * 20, 0.1 * 5 * 10 * 15 * 20 * 25, 50 * 6 * 12 * 18 * 24 * 30),
   mnfm: new Factory("mnfm", 6, 'Moon Block Farm', 'img/mnfm.png', 500 * 15 * 15 * 15 * 15 * 15 * 15, 0.5 * 4 * 8 * 12 * 16 * 20 * 24, 0.1 * 5 * 10 * 15 * 20 * 25 * 30, 50 * 6 * 12 * 18 * 24 * 30 * 36),
   plsm: new Factory("plsm", 7, 'Planetary Block Storm', 'img/plsm.png', 500 * 15 * 15 * 15 * 15 * 15 * 15 * 15, 0.5 * 4 * 8 * 12 * 16 * 20 * 24 * 28, 0.1 * 5 * 10 * 15 * 20 * 25 * 30 * 35, 50 * 6 * 12 * 18 * 24 * 30 * 36 * 42),
   star: new Factory("star", 8, 'Star Reactor', 'img/star.png', 500 * 15 * 15 * 15 * 15 * 15 * 15 * 15 * 15, 0.5 * 4 * 8 * 12 * 16 * 20 * 24 * 28 * 32, 0.1 * 5 * 10 * 15 * 20 * 25 * 30 * 35 * 40, 50 * 6 * 12 * 18 * 24 * 30 * 36 * 42 * 48),
   dmgt: new Factory("dmgt", 9, 'Interdimensional Gateway', 'img/dmgt.png', 500 * 15 * 15 * 15 * 15 * 15 * 15 * 15 * 15 * 15, 0.5 * 4 * 8 * 12 * 16 * 20 * 24 * 28 * 32 * 36, 0.1 * 5 * 10 * 15 * 20 * 25 * 30 * 35 * 40 * 45, 50 * 6 * 12 * 18 * 24 * 30 * 36 * 42 * 48 * 54)
   // The Everything Dimension?
};

const factoriesLogic = delta => {
   // figure out if some factory is emptying and queue factories accordingly
   let someFactoryEmptying = false;
   for (let prop in factories) {
      let factory = factories[prop];

      if (factory.emptying) {
         someFactoryEmptying = true;
         break;
      }
   }

   for (let prop in factories) {
      let factory = factories[prop];
      if (!someFactoryEmptying && factory.queued && !factory.emptying) {
         someFactoryEmptying = true;
         factory.empty();
      }
      factory.logic(delta);
   }
};

let upperStageBackButton;
let nextPageButton, previousPageButton;
const PAGE_CHANGER_BUTTON_WIDTH = 150;
const PAGE_CHANGER_BUTTON_HEIGHT = 50;

const getPageChangerButtonY = () => {
   return VISIBLE_HEIGHT - StatusBar.height * 1.5 - UI_PADDING - PAGE_CHANGER_BUTTON_HEIGHT;
};

const getMaxPage = () => {
   return Math.floor(factoriesUnlocked / FACTORIES_PER_PAGE);
};

const renderFactoryMenu = (delta, gl, programInfo, ctx2d, yOffset) => {
   for (let prop in factories) {
      factories[prop].renderOptions(delta, gl, programInfo, ctx2d, yOffset);
   }
   if (previousPageButton)
      previousPageButton.render(delta, gl, programInfo, ctx2d, yOffset);

   if (nextPageButton)
      nextPageButton.render(delta, gl, programInfo, ctx2d, yOffset);


   ctx2d.font = toBrowserH(UI_SANS_TEXT_HEIGHT * 1.5) + "px New Cicle Fina";
   ctx2d.fillStyle = "black";
   ctx2d.textBaseline = "middle";
   ctx2d.textAlign = "center";
   ctx2d.fillText((currentFactoryPage + 1) + " / " + (getMaxPage() + 1), toBrowserX(VISIBLE_WIDTH / 2), toBrowserY(getPageChangerButtonY() + PAGE_CHANGER_BUTTON_HEIGHT / 2 + yOffset));

   renderFactoryMenuScoreboard(gl, programInfo, ctx2d, yOffset);
};

const renderFactoryMenuScoreboard = (gl, programInfo, ctx2d, yOffset) => {
   // Render the block
   CubeMesh.setColor(COLOR_BLUE, gl, programInfo);
   let h = StatusBar.height;
   let w = StatusBar.width;
   let x = StatusBar.x;
   let y = VISIBLE_HEIGHT - h * 1.5 + yOffset;
   CubeMesh.render(gl, x, y, 0, w, h, Board.BLOCK_WIDTH);

   // Set the text color
   ctx2d.fillStyle = 'white';

   // Get fonts
   let textHeight = 50;
   let monospaceFont = toBrowserH(textHeight) + 'px Digital-7';
   let cicleFont = toBrowserH(textHeight / 2) + 'px New Cicle Fina';

   let blocksTextX = toBrowserX(x + w - Board.FRAME_THICKNESS);
   let textY = toBrowserY(y + h / 2 + textHeight / 2);

   ctx2d.font = cicleFont;
   let rightIndent = Math.max(ctx2d.measureText(' blocks').width, ctx2d.measureText(' stored').width);
   ctx2d.textBaseline = 'center';

   ctx2d.textAlign = 'left';
   ctx2d.fillText(' blocks', blocksTextX - rightIndent, toBrowserY(y + h / 3));
   ctx2d.fillStyle = "rgba(255, 255, 255, 0.75)";
   ctx2d.fillText(' stored', blocksTextX - rightIndent, toBrowserY(y + h * 2 / 3));

   ctx2d.textAlign = 'right';
   let amountText = Math.floor(Data.currentBlocks);
   let totalStoredBlocks = 0;
   for (let prop in factories)
      totalStoredBlocks += factories[prop].blocksHeld;
   ctx2d.font = monospaceFont;
   ctx2d.fillText('+' + Math.floor(totalStoredBlocks), blocksTextX - rightIndent, toBrowserY(y + (h * 2 / 3)));
   ctx2d.fillStyle = "white";
   ctx2d.fillText(amountText, blocksTextX - rightIndent, toBrowserY(y + (h / 3)));
};

const checkPageButtons = () => {
   if (!nextPageButton) {
      nextPageButton = new Button(StatusBar.x + StatusBar.width - PAGE_CHANGER_BUTTON_HEIGHT, getPageChangerButtonY(), PAGE_CHANGER_BUTTON_HEIGHT, PAGE_CHANGER_BUTTON_HEIGHT, COLOR_ORANGE, "keyboard_arrow_right", function () {
         if (currentFactoryPage < getMaxPage())
            currentFactoryPage++;
         checkPageButtons();
      });
      nextPageButton.typeface = "Material Icons";
      nextPageButton.fontSize = 36;
   }

   if (!previousPageButton) {
      previousPageButton = new Button(StatusBar.x, getPageChangerButtonY(), PAGE_CHANGER_BUTTON_HEIGHT, PAGE_CHANGER_BUTTON_HEIGHT, COLOR_ORANGE, "keyboard_arrow_left", function () {
         if (currentFactoryPage > 0)
            currentFactoryPage--;
         checkPageButtons();
      });
      previousPageButton.typeface = "Material Icons";
      previousPageButton.fontSize = 36;
   }

   nextPageButton.enabled = currentFactoryPage < getMaxPage();
   previousPageButton.enabled = currentFactoryPage > 0;
};

// Check to see if new pages have become available as blocks are collected
Listeners.blockCountListeners.push({
   onBlockCount: function (blocks) {
      let numFactories = Object.keys(factories).length;
      if (factoriesUnlocked < numFactories) {
         let factory;
         let factoryIsAffordable;
         do {
            factory = factories[Object.keys(factories)[factoriesUnlocked]];
            if (!factory)
               return;
            factoryIsAffordable = factory.isBasePriceAffordable(blocks);
            if (factoryIsAffordable)
               factoriesUnlocked++;
         } while (factoryIsAffordable && numFactories);
      }
      checkPageButtons();
   }
});
