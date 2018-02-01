/* jshint esversion: 6, browser: true, devel: true */
/* global BigNumber, invokeBlockCountListeners, Dialog, COLOR_POISON, mouseListeners, intToRGB, rgbToInt, toGLX, toGLY, COLOR_RED, COLOR_ORANGE, COLOR_GREEN, COLOR_BLUE, toScreenX, toScreenY, Block, VISIBLE_WIDTH, VISIBLE_HEIGHT, Data, CUBE_MESH */

let blinkTime = 0;
let blinkEnd = 0;
let blinkR = 0;
let blinkG = 0;
let blinkB = 0;
let defaultGray = 0.95;
let lightColor;

const Board = {
   // Board grid standard is 14 rows by 10 columns
   get ROWS() {
      return 14;
   },
   get COLUMNS() {
      return 10;
   },
   get SPACING() {
      return 15;
   },
   get BLOCK_WIDTH() {
      return 30;
   },
   get GRID_PADDING() {
      return this.BLOCK_WIDTH;
   },
   get FRAME_THICKNESS() {
      return this.BLOCK_WIDTH / 2;
   },

   boardCenter: {
      x: VISIBLE_WIDTH / 2,
      y: VISIBLE_HEIGHT / 2
   },
   yOffset: 0,

   fillRate: 2 * 100, // The rate at which cubes fill in units per second
   pendingFillTime: 0,
   dropQueue: function () {
      let boardFull = true;
      for (let i = 0; i < this.COLUMNS; i++)
         if (this.board[0][i] === null) {
            this.board[0][i] = this.queue[i];
            this.queue[i] = null;
            boardFull = false;
         }
      if (boardFull) this.pendingFillTime = 0;
   },
   fillQueue: function (delta) {
      if (!globalBlockProductionEnabled)
         return;

      this.pendingFillTime += delta;
      let shouldDrop = true;
      for (let i = 0; i < this.COLUMNS; i++) {

         if (!this.queue[i])
            this.queue[i] = new Block();
         let block = this.queue[i];

         if ((i === 0 || this.queue[i - 1].isFull()) && !block.isFull()) {
            let f = this.queue[i].fill;
            this.queue[i].fill += this.fillRate * this.pendingFillTime;
            this.pendingFillTime -= (this.queue[i].fill - f) / this.fillRate;
            shouldDrop = false;
         }
      }
      if (shouldDrop) {
         this.dropQueue();
      }
   },
   queue: [],
   board: [],
   getGridCode: function () {
      let code = "";
      for (let r = 0; r < this.ROWS; r++)
         for (let c = 0; c < this.COLUMNS; c++) {
            if (!this.board[r][c])
               code += "0";
            else
               switch (this.board[r][c].color) {
                  case COLOR_RED:
                     code += "r";
                     break;
                  case COLOR_ORANGE:
                     code += "o";
                     break;
                  case COLOR_GREEN:
                     code += "g";
                     break;
                  case COLOR_BLUE:
                     code += "b";
                     break;
               }
         }
      return code;
   },
   dumpBlocks: [],

   init: function (ctx2d, boardCode) {
      this.ctx2d = ctx2d;
      for (let r = 0; r < this.ROWS; r++) {
         this.board[r] = [];
         for (let c = 0; c < this.COLUMNS; c++) {
            let codeIndex = r * this.COLUMNS + c;
            let color;
            if (boardCode && (color = boardCode[codeIndex]) !== '0') {
               this.board[r][c] = new Block(color);
               continue;
            }
            this.board[r][c] = null;
         }
      }

      for (let i = 0; i < this.COLUMNS; i++)
         this.queue[i] = null;

      mouseListeners.push(this);
   },

   logic: function (delta) {

      let isBlinkColor = blinkR !== 0 || blinkG !== 0 || blinkB !== 0;
      if (isBlinkColor && (blinkTime < blinkEnd || blinkEnd === 0))
         blinkTime += delta * 10;
      else blinkTime = blinkEnd;

      let foo = Math.abs(Math.sin(blinkTime)) * 3 / 4;
      let r = foo * blinkR + (1 - foo) * defaultGray;
      let g = foo * blinkG + (1 - foo) * defaultGray;
      let b = foo * blinkB + (1 - foo) * defaultGray;
      lightColor = rgbToInt(r, g, b);

      // Do board logic
      // Start from the bottom row and move up
      for (let r = this.ROWS - 1; r >= 0; r--) {
         for (let c = 0; c < this.COLUMNS; c++) {
            let block = this.board[r][c];
            if (block !== null) {
               // If a block here exists, calculate physics on
               // this block
               block.blockLogic(delta, r, c);

               // If a poison block reaches the bottom, remove it
               // (and inflict punishment >:))
               if (r === this.ROWS - 1 && block.color === COLOR_TOXIC) {
                  this.pushBlockToDump(r, c);
               }
            } else if (r > 0) {
               // If this slot doesn't have a block and this
               // isn't the first row, then move the block
               // above this slot to this slot
               for (let i = r; i >= 0; i--) {
                  let blockAbove = this.board[i][c];
                  if (blockAbove !== null) {
                     this.board[r][c] = blockAbove;
                     this.board[i][c] = null;
                     break;
                  }
               }
            }
         }
      }

      // Queue logic
      this.fillQueue(delta);

      for (let i = 0; i < this.COLUMNS; i++)
         if (this.queue[i])
            this.queue[i].blockLogic(delta, -1, i);


      // Do trash block logic
      this.dumpBlocks.forEach((item, index, array) => {
         item.blockLogic(delta, item.row, item.col);
         if (item.y >= item.destY && !item.falling) {
            // (For poison blocks)
            // Make the block fall if it is at or past it's
            // destination y position
            item.fall();
         }
         if (item.gone)
            this.countBlock(this.dumpBlocks.splice(index, 1)[0]);
      });

   },

   render: function (gl, programInfo, yOffset) {
      this.yOffset = yOffset;
      this.renderBoardFrame(gl, programInfo, yOffset);
      this.renderGrid(gl, programInfo, yOffset);
      this.renderQueue(gl, programInfo, yOffset);
      this.renderDumpBlocks(gl, programInfo, yOffset);
   },
   renderQueue: function (gl, programInfo, yOffset) {
      // Render the queue
      for (let i = 0; i < this.COLUMNS; i++) {
         let block = this.queue[i];
         if (block !== null)
            block.renderBlock(gl, programInfo, yOffset);
      }
   },
   renderGrid: function (gl, programInfo, yOffset) {
      for (let r = 0; r < this.ROWS; r++) {
         for (let c = 0; c < this.COLUMNS; c++) {
            let block = this.board[r][c];
            if (block !== null)
               block.renderBlock(gl, programInfo, yOffset);
         }
      }
   },
   renderDumpBlocks: function (gl, programInfo, yOffset) {
      // Render any falling blocks
      this.dumpBlocks.forEach((item, index, array) => {
         item.renderBlock(gl, programInfo, yOffset);
      });
   },
   renderBoardFrame: function (gl, programInfo, yOffset) {
      // Declare a shorter name for frame thickness
      let t = this.FRAME_THICKNESS;

      CubeMesh.setColor(0xffffff, gl, programInfo);

      // Left side of frame
      let lw = t;
      let lh = Board.height + this.GRID_PADDING;
      let lx = this.boardCenter.x - this.width / 2 - this.GRID_PADDING - t;
      let ly = this.boardCenter.y - this.height / 2 + yOffset;
      CubeMesh.render(gl, lx, ly, 0, lw, lh, t);

      // Right side of frame
      let rw = lw;
      let rh = lh;
      let rx = this.boardCenter.x + this.width / 2 + this.GRID_PADDING;
      let ry = ly;
      CubeMesh.render(gl, rx, ry, 0, rw, rh, t);

      //  Bottom of the frame
      let bh = t;
      let bw = Board.width + t * 2 + this.GRID_PADDING * 2;
      let bx = lx;
      let by = this.boardCenter.y + this.height / 2 + this.GRID_PADDING + yOffset;
      CubeMesh.render(gl, bx, by, 0, bw, bh, t);

      // Lights
      CubeMesh.setColor(lightColor, gl, programInfo);
      CubeMesh.render(gl, lx, ly - t, 0, t, t, t);
      CubeMesh.render(gl, rx, ry - t, 0, t, t, t);
   },
   blinkLights(color, count = 2) {
      color = intToRGB(color);

      blinkR = color.r;
      blinkG = color.g;
      blinkB = color.b;

      blinkEnd = Math.PI * count;
      blinkTime = 0;
   },

   /************************************************
    * Transfers the block at the given row and
    * column to the array of falling (dump) blocks.
    ************************************************/
   pushBlockToDump: function (row, col) {
      this.dumpBlocks.push(this.board[row][col]);
      this.board[row][col] = null;
   },
   countBlock: function (block) {
      if (block.color === COLOR_TOXIC) {
         Data.lifetimeBlocksByColor.toxic++;
         return;
      }

      Data.currentBlocks++;
      switch (block.color) {
         case COLOR_RED:
            Data.lifetimeBlocksByColor.red++;
            break;
         case COLOR_ORANGE:
            Data.lifetimeBlocksByColor.orange++;
            break;
         case COLOR_GREEN:
            Data.lifetimeBlocksByColor.green++;
            break;
         case COLOR_BLUE:
            Data.lifetimeBlocksByColor.blue++;
            break;
      }
   },

   toGridX(col) {
      return this.boardCenter.x - this.width / 2 + (col * (this.BLOCK_WIDTH + this.SPACING));
   },
   toGridY(row) {
      let top = this.boardCenter.y - this.height / 2;
      if (row == -1) return top;
      return top +
         // Add a row and spacing to accomodate the queue
         (row + 1) * (this.BLOCK_WIDTH + this.SPACING) +
         this.SPACING;
   },

   get width() {
      return this.COLUMNS * (this.BLOCK_WIDTH + this.SPACING) - this.SPACING;
   },
   get height() {
      // Here we include the block queue at the top, which has
      // double the spacing below it.
      return (this.ROWS + 1) * (this.BLOCK_WIDTH + this.SPACING);
   },

   /************************************************
    * REMOVE IF MATCHING NEIGHBORS
    * Kicks a block and any matching neighbors out
    * of the board grid if said matching neighbor(s)
    * exist. Returns true if so, and false otherwise.
    ************************************************/
   removeIfMatchingNeighbors(row, col) {
      let block = this.board[row][col];
      if (!block)
         return false;

      let hadMatch = false;

      if (row > 0 && this.matchWithNeighbor(row, col, row - 1, col))
         hadMatch = true;
      if (row < this.ROWS - 1 && this.matchWithNeighbor(row, col, row + 1, col))
         hadMatch = true;

      if (col > 0 && this.matchWithNeighbor(row, col, row, col - 1))
         hadMatch = true;
      if (col < this.COLUMNS - 1 && this.matchWithNeighbor(row, col, row, col + 1))
         hadMatch = true;

      if (hadMatch) {
         this.pushBlockToDump(row, col);
         return true;
      }
      return false;
   },

   /************************************************
    * MATCH WITH NEIGHBOR
    * Matches two blocks together given their
    * rows and columns. If the blocks match, the
    * neighboring blocks will be checked for more
    * matching neighbors, and the function will
    * return true.
    ************************************************/
   matchWithNeighbor: function (blockToRemoveRow, blockToRemoveColumn, neighborRow, neighborColumn) {
      let blockToRemove = this.board[blockToRemoveRow][blockToRemoveColumn];
      let neighbor = this.board[neighborRow][neighborColumn];

      if (!blockToRemove || !neighbor) return false;

      if (neighbor.color === blockToRemove.color) {
         blockToRemove.fall();
         // If this block has already been kicked off the board, don't bother checking
         // it for more matching neighbors
         if (!neighbor.falling)
            this.removeIfMatchingNeighbors(neighborRow, neighborColumn);
         return true;
      }
      return false;
   },
   onClick: function (mx, my) {
      let slotSize = this.BLOCK_WIDTH + this.SPACING;
      let row = Math.floor((my - this.boardCenter.y - this.yOffset + (this.height / 2) - this.SPACING) / slotSize - 1);
      let col = Math.floor((mx - this.boardCenter.x + (this.width / 2)) / slotSize);

      if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLUMNS)
         if (this.removeIfMatchingNeighbors(row, col)) {
            Data.lifetimeClicks.successful++;
         } else {
            Data.lifetimeClicks.failed++;
         }
   }
};
