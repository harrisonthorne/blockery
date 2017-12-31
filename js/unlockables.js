/* jshint esversion: 6, browser: true, devel: true */

const LISTENER_BLOCK_COUNT_FLAG = 0x00000001;
const LISTENER_FACTORY_PURCHASE_FLAG = 0x00000002;

class Unlockable {
   constructor(bit, name, listenerFlags, onUnlockFunction, conditionFunction) {
      this.bit = bit;
      this.name = name;
      this.unlocked = false;
      let metConditionFlags = 0x0;

      // this is a function
      const checkForUnlock = function (flag, ...args) {
         // if we've already unlocked this object then don't
         // check again lol
         if (this.unlocked)
            return;
         if (conditionFunction(flag, args)) {
            // set a condition according to the listener if the condition
            // has been met
            metConditionFlags |= flag;
            // if all conditions have been met, unlock
            if ((listenerFlags & metConditionFlags) === listenerFlags) {
               unlock();
            }
         } else {
            // remove the flag from the met conditions if the listener
            // condition is not met
            metConditionFlags &= ~flag;
         }
      };

      if (listenerFlags & LISTENER_BLOCK_COUNT_FLAG) {
         this.blockCountListener = {
            onBlockCount: function (count) {
               checkForUnlock(LISTENER_BLOCK_COUNT_FLAG, count);
            }
         };
         Listeners.blockCountListeners.push(blockCountListener);
      }

      if (listenerFlags & LISTENER_FACTORY_PURCHASE_FLAG) {
         this.factoryPurchaseListener = {
            onFactoryPurchase: function (factoryCode, count) {
               checkForUnlock(LISTENER_FACTORY_PURCHASE_FLAG, factoryCode, count);
            }
         };
         Listeners.factoryPurchaseListeners.push(factoryPurchaseListener);
      }
   }

   unlock() {
      onUnlockFunction();
      this.unlocked = true;

      // remove the listeners so that they're not invoked anymore
      if (this.blockCountListener)
         Listeners.blockCountListeners.splice(Listeners.blockCountListeners.indexOf(this.blockCountListener), 1);
      if (this.factoryPurchaseListener)
         Listeners.factoryPurchaseListeners.splice(Listeners.factoryPurchaseListeners.indexOf(this.factoryPurchaseListener), 1);
   }
}

class Achievement extends Unlockable {
   constructor() {

   }
}

class Upgrade extends Unlockable {
   constructor() {
      
   }
}