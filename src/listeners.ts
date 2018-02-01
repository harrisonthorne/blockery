/* jshint esversion: 6, browser: true, devel: true */

const Listeners = {
   blockCountListeners: [],
   invokeBlockCountListeners: function (count) {
      this.blockCountListeners.forEach(listener => {
         listener.onBlockCount(count);
      });
   },

   factoryPurchaseListeners: [],
   invokeFactoryPurchaseListeners: function (factoryCode, count) {
      this.factoryPurchaseListeners.forEach(listener => {
         listener.onFactoryPurchase(factoryCode, count);
      });
   }
};
