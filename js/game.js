/* jshint esversion: 6, browser: true, devel: true */

let factoriesButton;
let statsButton;
let settingsButton;
let upgradesButton;
let achievementsButton;
const initGame = () => {
   let x = StatusBar.x;
   let y = 0;
   let w = StatusBar.width;
   let h = StatusBar.height;

   // Status bar buttons
   factoriesButton = new Button(x, y, w, h / 2, COLOR_ORANGE, 'Factories', function () {
      openUpperStage(StageMenu.FACTORIES);
   });
   statsButton = new Button(x, y + h / 2, w - h / 2, h / 2, COLOR_BLUE, 'Stats', function () {
      openUpperStage(StageMenu.STATS);
   });
   settingsButton = new Button(x + w - h / 2, y + h / 2, h / 2, h / 2, COLOR_GREEN, 'settings', function () {
      openLowerStage(StageMenu.SETTINGS);
   });
   settingsButton.typeface = "Material Icons";
   settingsButton.fontSize = 36;

   // Return buttons
   upperStageBackButton = new Button(x, VISIBLE_HEIGHT - h / 2, w, h / 2, COLOR_RED, 'keyboard_arrow_down', function () {
      goBackToBoard();
   });
   upperStageBackButton.typeface = "Material Icons";
   upperStageBackButton.fontSize = 36;

   lowerStageBackButton = new Button(x, 0, w, h / 2, COLOR_RED, 'keyboard_arrow_up', function () {
      goBackToBoard();
   });
   lowerStageBackButton.typeface = "Material Icons";
   lowerStageBackButton.fontSize = 36;
};

const gameLogic = (delta) => {
   factoriesLogic(delta);
   Board.logic(delta);
};

const renderGame = (delta, gl, programInfo, matrices, ctx2d) => {
   if (yInter < 1) {
      yInter += delta / yOffsetAnimateDuration;
      if (yInter > 1)
         yInter = 1;
      globalYOffset = yStart + quintEaseOut(yInter) * (yEnd - yStart);
   }
   // Main stage
   if (globalYOffset > -VISIBLE_HEIGHT && globalYOffset < VISIBLE_HEIGHT)
      renderMainStage(delta, gl, programInfo, ctx2d, globalYOffset);

   // Render upper stage
   if (globalYOffset > 0)
      renderUpperStage(currentUpperStageMenu, delta, gl, programInfo, ctx2d, globalYOffset - VISIBLE_HEIGHT);

   // Render lower stage
   if (globalYOffset < 0)
      renderLowerStage(currentLowerStageMenu, delta, gl, programInfo, ctx2d, globalYOffset + VISIBLE_HEIGHT);
};

const renderMainStage = (delta, gl, programInfo, ctx2d, yOffset) => {
   Board.render(gl, programInfo, yOffset);
   renderScoreboard(delta, gl, programInfo, ctx2d, yOffset);
   renderStatusBar(delta, gl, programInfo, ctx2d, yOffset);
};

const renderUpperStage = (stageMenu, delta, gl, programInfo, ctx2d, yOffset) => {
   ctx2d.font = toBrowserH(DIALOG_TITLE_TEXT_HEIGHT) + 'px New Cicle Fina';
   ctx2d.fillStyle = 'black';
   ctx2d.textBaseline = 'middle';
   ctx2d.textBaseline = 'center';
   ctx2d.fillText(stageMenu, toBrowserX(StatusBar.x + StatusBar.width / 2), toBrowserY(StatusBar.height / 2 + yOffset));
   switch (stageMenu) {
      case StageMenu.FACTORIES:
         renderFactoryMenu(delta, gl, programInfo, ctx2d, yOffset);
         break;
      case StageMenu.UPGRADES:
         break;
      case StageMenu.STATS:
         renderStats(ctx2d, yOffset);
         break;
      case StageMenu.ACHIEVEMENTS:
         break;
   }
   upperStageBackButton.render(delta, gl, programInfo, ctx2d, yOffset);
};

const renderLowerStage = (stageMenu, delta, gl, programInfo, ctx2d, yOffset) => {
   // switch (stageMenu) {
   //    case StageMenu.SETTINGS:
   renderSettings(delta, gl, programInfo, ctx2d, yOffset);
   //       break;
   // }
   lowerStageBackButton.render(delta, gl, programInfo, ctx2d, yOffset);
};

let scoreboardFadeInter = 0;
let scoreboardFadeDuration = 0.5;

const renderScoreboard = (delta, gl, programInfo, ctx2d, yOffset) => {
   // Render the block
   CubeMesh.setColor(COLOR_BLUE, gl, programInfo);
   let x = Board.boardCenter.x - Board.width / 2 - Board.GRID_PADDING - Board.FRAME_THICKNESS;
   let y = Board.boardCenter.y + Board.height / 2 + Board.GRID_PADDING + Board.FRAME_THICKNESS * 2;
   let w = Board.width + Board.FRAME_THICKNESS * 2 + Board.GRID_PADDING * 2;
   let h = VISIBLE_HEIGHT - y;
   CubeMesh.render(gl, x, y + yOffset, 0, w, h, Board.BLOCK_WIDTH);

   // Set the text color //
   // If there are falling blocks from the board
   if (Board.dumpBlocks[0]) {
      if (scoreboardFadeInter < 1) {
         scoreboardFadeInter += delta / scoreboardFadeDuration;
         if (scoreboardFadeInter > 1) scoreboardFadeInter = 1;
      }
   } else {
      if (scoreboardFadeInter > 0) {
         scoreboardFadeInter -= delta / scoreboardFadeDuration;
         if (scoreboardFadeInter < 0) scoreboardFadeInter = 0;
      }
   }
   ctx2d.fillStyle = 'rgba(255, 255, 255,' + (1 - cubicEaseIn(scoreboardFadeInter) * 0.5) + ')';

   // Get fonts
   let textHeight = 50;
   let monospaceFont = toBrowserY(72) + 'px Digital-7';
   let cicleFont = toBrowserY(35) + 'px New Cicle Fina';

   let blocksTextX = toBrowserX(x + w - Board.FRAME_THICKNESS);
   let textY = toBrowserH(y + h / 2 + textHeight / 2 + yOffset);

   ctx2d.textBaseline = 'alphabetic';
   ctx2d.textAlign = 'right';

   ctx2d.font = cicleFont;
   ctx2d.fillText('blocks', blocksTextX, textY);

   let blocksTextWidth = ctx2d.measureText(' blocks').width;

   let amountText = Math.floor(Data.currentBlocks);
   ctx2d.font = monospaceFont;
   ctx2d.fillText(amountText, blocksTextX - blocksTextWidth, textY);
};

const StatusBar = {
   get x() {
      if (!this._x) this._x = VISIBLE_WIDTH / 2 - this.width / 2;
      return this._x;
   },
   get width() {
      if (!this._width) this._width = Board.width + Board.FRAME_THICKNESS * 2 + Board.GRID_PADDING * 2;
      return this._width;
   },
   get height() {
      if (!this._height) this._height = Board.boardCenter.y - Board.height / 2 - Board.FRAME_THICKNESS * 3;
      return this._height;
   },
   get y() {
      return 0;
   }
};

let globalYOffset = 0;

const Stage = {
   UPPER: 3,
   MAIN: 2,
   LOWER: 1
};

const StageMenu = {
   FACTORIES: 'Factories',
   UPGRADES: 'Upgrades',
   STATS: 'Statistics',
   ACHIEVEMENTS: 'Achievements',
   SETTINGS: 'Settings'
};

let currentStage = Stage.MAIN;
let currentUpperStageMenu, currentLowerStageMenu;

const openUpperStage = (menu) => {
   currentStage = Stage.UPPER;

   currentUpperStageMenu = menu;
   yStart = globalYOffset;
   yEnd = VISIBLE_HEIGHT;
   yInter = 0;
};

const openLowerStage = menu => {
   currentStage = Stage.LOWER;

   currentLowerStageMenu = menu;
   yStart = globalYOffset;
   yEnd = -VISIBLE_HEIGHT;
   yInter = 0;
};

const goBackToBoard = () => {
   currentStage = Stage.MAIN;

   yStart = globalYOffset;
   yEnd = 0;
   yInter = 0;
};

let yStart = 0;
let yEnd = 0;
let yInter = 1;
let yOffsetAnimateDuration = 0.5;



const renderStatusBar = (delta, gl, programInfo, ctx2d, yOffset) => {
   factoriesButton.render(delta, gl, programInfo, ctx2d, yOffset);
   statsButton.render(delta, gl, programInfo, ctx2d, yOffset);
   settingsButton.render(delta, gl, programInfo, ctx2d, yOffset);
};