/* jshint esversion: 6, browser:true, devel:true */
/* global BUTTON_POSITIVE, RedDialog, BUTTON_NEGATIVE, addError,invokeBlockCountListeners, factories, sendNotification, loadTextResource, BigNumber, Board, COLOR_GREEN, Dialog, localStorage */

const Data = {
   load: function (ctx2d) {
      let dbVersion = Number.parseInt(localStorage.getItem(KEY_DATABASE_VERSION)) || 0;
      if (!dbVersion) {
         console.log("No database found. No data will be loaded.");
         new Dialog(ctx2d, "Welcome to Blockery!", "Glad you're here! Blocks can be collected by selecting those that are the same color as the blocks they are touching. Once you save up enough blocks, you can purchase factories that will make more blocks for you. Each factory can only store a certain number of blocks and will need to be emptied once in a while. A factory that is storing too many blocks will stop producing any more! As you collect more and more blocks, different and various types of factories will be available. There are lots to be discovered here.").setButton(BUTTON_POSITIVE, "Let's go!", function (dialog) {
            dialog.dismiss();
         }).show();

         this.currentBlocks = 0;
         return;
      }

      // Alert the user of new updates :)
      let blockeryVersion = localStorage.getItem(KEY_BLOCKERY_VERSION);
      if (BLOCKERY_VERSION !== blockeryVersion) {
         loadTextResource("releaseLog.txt", function (error, result) {
            if (error)
               addError(error);
            else
               new Dialog(ctx2d, "Welcome to Blockery " + BLOCKERY_VERSION + "!", "Here's what's new: \n" + result).show();
         });
      }

      // Loading procedure for version 1 //
      this.currentBlocks = Number.parseInt(localStorage.getItem(KEY_CURRENT_BLOCKS)) || 0;

      this.boardCode = localStorage.getItem(KEY_GRID);

      this.lifetimeBlocksByColor.red = Number.parseInt(localStorage.getItem(KEY_LIFETIME_RED)) || 0;
      this.lifetimeBlocksByColor.orange = Number.parseInt(localStorage.getItem(KEY_LIFETIME_ORANGE)) || 0;
      this.lifetimeBlocksByColor.green = Number.parseInt(localStorage.getItem(KEY_LIFETIME_GREEN)) || 0;
      this.lifetimeBlocksByColor.blue = Number.parseInt(localStorage.getItem(KEY_LIFETIME_BLUE)) || 0;

      this.lifetimeClicks.successful = Number.parseInt(localStorage.getItem(KEY_SUCCESSFUL_CLICKS)) || 0;
      this.lifetimeClicks.failed = Number.parseInt(localStorage.getItem(KEY_FAILED_CLICKS)) || 0;

      factoriesUnlocked = Number.parseInt(localStorage.getItem(KEY_FACTORIES_UNLOCKED)) || 0;
      for (let prop in factories) {
         let val = localStorage.getItem(prop);
         if (!val)
            continue;
         factories[prop].applyCode(dbVersion, val);
      }
   },
   save: function () {
      localStorage.setItem(KEY_DATABASE_VERSION, DATABASE_VERSION);
      localStorage.setItem(KEY_BLOCKERY_VERSION, BLOCKERY_VERSION);

      // Saving procedure for version 1 //
      localStorage.setItem(KEY_CURRENT_BLOCKS, this.currentBlocks);
      localStorage.setItem(KEY_CURRENT_POLLUTION, this.currentPollution);

      // Save the board
      localStorage.setItem(KEY_GRID, Board.getGridCode());

      // Save user stats
      localStorage.setItem(KEY_LIFETIME_RED, this.lifetimeBlocksByColor.red);
      localStorage.setItem(KEY_LIFETIME_ORANGE, this.lifetimeBlocksByColor.orange);
      localStorage.setItem(KEY_LIFETIME_GREEN, this.lifetimeBlocksByColor.green);
      localStorage.setItem(KEY_LIFETIME_BLUE, this.lifetimeBlocksByColor.blue);
      localStorage.setItem(KEY_SUCCESSFUL_CLICKS, this.lifetimeClicks.successful);
      localStorage.setItem(KEY_FAILED_CLICKS, this.lifetimeClicks.failed);

      // Save factories
      localStorage.setItem(KEY_FACTORIES_UNLOCKED, factoriesUnlocked);
      for (let prop in factories) {
         localStorage.setItem(prop, factories[prop].saveCode);
      }

      Board.blinkLights(COLOR_GREEN, 1);
      sendNotification("Game saved!", 1.5);

   },
   reset: function () {
      saveOnBeforeUnload = false;
      new Dialog(window.ctx2d, "Reset everything?", "This action can't be undone! You will lose all of your blocks, factories, and everything you've put so much work into :(")
         .setButton(BUTTON_POSITIVE, "Sure", function (dialog) {
            dialog.dismiss();
            new RedDialog(window.ctx2d, "Final warning!", "Do you really want to reset everything? All of your blocks, factories, and data will be erased. Gone forever. You will not be able to recover them.")
               .setButton(BUTTON_POSITIVE, 'Go ahead', function (dialog) {
                  localStorage.clear();
                  window.location.reload(false);
               })
               .setButton(BUTTON_NEGATIVE, 'Never mind', function (dialog) {
                  dialog.dismiss();
               })
               .show();
         })
         .setButton(BUTTON_NEGATIVE, "Nope", function (dialog) {
            dialog.dismiss();
         })
         .show();
   },
   _currentBlocks: 0,
   set currentBlocks(val) {
      this._currentBlocks = val;
      Listeners.invokeBlockCountListeners(val);
   },
   get currentBlocks() {
      return this._currentBlocks;
   },
   currentPollution: 0,
   lifetimeBlocksByColor: {
      red: 0,
      orange: 0,
      green: 0,
      blue: 0,
      toxic: 0,
      golden: 0
   },
   get lifetimePollution() {
      let total = 0;
      for (let prop in factories) {
         total += factories[prop].totalPollutionProduced;
      }
      return total;
   },
   lifetimeClicks: {
      failed: 0,
      successful: 0
   },
   boardCode: undefined,

};
const KEY_DATABASE_VERSION = 'version';
const KEY_BLOCKERY_VERSION = 'blockeryversion';
const KEY_GRID = 'grid';
const KEY_CURRENT_BLOCKS = 'currentBlocks';
const KEY_CURRENT_POLLUTION = 'currentPollution';
const KEY_LIFETIME_RED = 'red';
const KEY_LIFETIME_ORANGE = 'orange';
const KEY_LIFETIME_GREEN = 'green';
const KEY_LIFETIME_BLUE = 'blue';
const KEY_SUCCESSFUL_CLICKS = 'successfulClicks';
const KEY_FAILED_CLICKS = 'failedClicks';
const KEY_FACTORIES_UNLOCKED = 'factoriesUnlocked';

const DATABASE_VERSION = 1;
const BLOCKERY_VERSION = '0.0.0-alpha2';
