/* jshint esversion: 6, devel: true, browser: true */

const Stats = {
   get lifetimeBlocksCollected() {
      return this.lifetimeBlocksProducedByFactories + Data.lifetimeBlocksByColor.red + Data.lifetimeBlocksByColor.orange + Data.lifetimeBlocksByColor.green + Data.lifetimeBlocksByColor.blue;
   },
   get lifetimeBlocksProducedByFactories() {
      let total = 0;
      for (let prop in factories) {
         total += factories[prop].totalBlocksProduced;
      }
      return total;
   },
   get favoriteColor() {
      let max = Math.max(Data.lifetimeBlocksByColor.red, Math.max(Data.lifetimeBlocksByColor.orange, Math.max(Data.lifetimeBlocksByColor.green, Math.max(Data.lifetimeBlocksByColor.blue, Math.max(Data.lifetimeBlocksByColor.toxic, Data.lifetimeBlocksByColor.golden)))));
      switch (max) {
         case Data.lifetimeBlocksByColor.red:
            return "Red";
         case Data.lifetimeBlocksByColor.orange:
            return "Orange";
         case Data.lifetimeBlocksByColor.green:
            return "Green";
         case Data.lifetimeBlocksByColor.blue:
            return "Blue";
         case Data.lifetimeBlocksByColor.toxic:
            return "Toxic blocks";
         case Data.lifetimeBlocksByColor.golden:
            return "Golden blocks";
      }
   }
};

/** Returns the y-coordinate where the next statistic can be rendered */
const renderBigStat = (statName, statValue, ctx2d, textY, maxWidth) => {
   ctx2d.fillStyle = 'black';
   ctx2d.textBaseline = 'top';
   ctx2d.textAlign = 'center';

   let bigFontSize = UI_SANS_TEXT_HEIGHT * 1.25;
   let bigSansSerif = toBrowserH(bigFontSize) + 'px sans-serif';
   ctx2d.font = bigSansSerif;
   ctx2d.fillText(statName, toBrowserX(VISIBLE_WIDTH / 2), toBrowserY(textY));

   textY += bigFontSize;
   ctx2d.font = toBrowserH(75) + 'px Digital-7';
   ctx2d.fillText(statValue, toBrowserX(VISIBLE_WIDTH / 2), toBrowserY(textY), maxWidth);

   return textY + 75 + UI_PADDING;
};

/** Returns the y-coordinate where the next statistic can be rendered */
const renderSmallStat = (statName, statValue, ctx2d, textY) => {
   ctx2d.fillStyle = "black";
   ctx2d.textBaseline = "alphabetic";

   ctx2d.textAlign = "left";
   ctx2d.fillText(statName, toBrowserX(UI_PADDING), toBrowserY(textY));

   ctx2d.textAlign = "right";
   ctx2d.fillText(statValue, toBrowserX(VISIBLE_WIDTH - UI_PADDING), toBrowserY(textY));

   ctx2d.beginPath();
   ctx2d.setLineDash([1, 3]);
   ctx2d.moveTo(toBrowserX(UI_PADDING + 5) + ctx2d.measureText(statName).width, toBrowserY(textY));
   ctx2d.lineTo(toBrowserX(VISIBLE_WIDTH - UI_PADDING - 5) - ctx2d.measureText(statValue).width, toBrowserY(textY));
   ctx2d.stroke();
   return textY + UI_SANS_TEXT_HEIGHT * 1.25;
};

const renderStats = (ctx2d, yOffset) => {
   let maxWidth = toBrowserW(VISIBLE_WIDTH - UI_PADDING * 2);
   let textY = getStatusBarHeight() + UI_PADDING + yOffset;

   textY = renderBigStat('Lifetime blocks produced or collected', Math.floor(Stats.lifetimeBlocksCollected).toLocaleString(), ctx2d, textY, maxWidth);
   // textY = renderBigStat('Lifetime pollutants produced', Math.floor(Data.lifetimePollution).toLocaleString(), ctx2d, textY, maxWidth);

   /* Render small stats */
   textY += UI_PADDING;

   let total = 0;
   for (let prop in Data.lifetimeBlocksByColor)
      total += Data.lifetimeBlocksByColor[prop];

   ctx2d.font = getSansFont();
   ctx2d.strokeStyle = "black";
   ctx2d.lineWidth = 1;

   // Block stats
   textY = renderSmallStat("Lifetime blocks collected by hand", total.toLocaleString(), ctx2d, textY);
   textY = renderSmallStat("Red blocks", Data.lifetimeBlocksByColor.red.toLocaleString(), ctx2d, textY);
   textY = renderSmallStat("Orange blocks", Data.lifetimeBlocksByColor.orange.toLocaleString(), ctx2d, textY);
   textY = renderSmallStat("Green blocks", Data.lifetimeBlocksByColor.green.toLocaleString(), ctx2d, textY);
   textY = renderSmallStat("Blue blocks", Data.lifetimeBlocksByColor.blue.toLocaleString(), ctx2d, textY);

   // Adds a gap
   textY += UI_SANS_TEXT_HEIGHT * 1.25;

   // Click stats
   textY = renderSmallStat("Successful block clicks", Data.lifetimeClicks.successful.toLocaleString(), ctx2d, textY);
   textY = renderSmallStat("Failed block clicks", Data.lifetimeClicks.failed.toLocaleString(), ctx2d, textY);

   // Adds a gap
   textY += UI_SANS_TEXT_HEIGHT * 1.25;

   // Factory stats
   let totalFactories = 0;
   for (let prop in factories)
      totalFactories += factories[prop].amountOwned;
   textY = renderSmallStat("Total factories owned", totalFactories, ctx2d, textY);
   textY = renderSmallStat("Lifetime blocks produced by factories", Math.floor(Stats.lifetimeBlocksProducedByFactories).toLocaleString(), ctx2d, textY);

};