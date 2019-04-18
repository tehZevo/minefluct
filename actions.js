var Vec3 = require("vec3");

var TURN_ANGLE = Math.PI * 2 / 30;

var CURSOR_STEP = 1;

//TODO: convert to multidiscrete and remove toggles?

//movement
var startForward = (env) => env.bot.setControlState("forward", true);
var startBack = (env) => env.bot.setControlState("back", true);
var startLeft = (env) => env.bot.setControlState("left", true);
var startRight = (env) => env.bot.setControlState("right", true);
var startSprint = (env) => env.bot.setControlState("sprint", true);
var startSneak = (env) => env.bot.setControlState("sneak", true);
var startJump = (env) => env.bot.setControlState("jump", true);
var stopForward = (env) => env.bot.setControlState("forward", false);
var stopBack = (env) => env.bot.setControlState("back", false);
var stopLeft = (env) => env.bot.setControlState("left", false);
var stopRight = (env) => env.bot.setControlState("right", false);
var stopSprint = (env) => env.bot.setControlState("sprint", false);
var stopSneak = (env) => env.bot.setControlState("sneak", false);
var stopJump = (env) => env.bot.setControlState("jump", false);
//pre-cursor turning
var turnLeft = (env) => env.bot.look(env.bot.entity.yaw - TURN_ANGLE, 0);
var turnRight = (env) => env.bot.look(env.bot.entity.yaw + TURN_ANGLE, 0);
//interaction
var attack = (env) => env.attackNearCursor();
var activateItem = (env) => env.bot.activateItem();
var dig = (env) => env.digNearCursor();
var placeBlock = (env) => env.placeBlockAtCursor();
var quickBarNext = (env) => env.bot.setQuickBarSlot((env.bot.quickBarSlot + 1) % 8);
//cursor movement
var cursorEast = (env) => env.moveCursor(CURSOR_STEP, 0, 0);
var cursorUp = (env) => env.moveCursor(0, CURSOR_STEP, 0);
var cursorSouth = (env) => env.moveCursor(0, 0, CURSOR_STEP);
var cursorWest = (env) => env.moveCursor(-CURSOR_STEP, 0, 0);
var cursorDown = (env) => env.moveCursor(0, -CURSOR_STEP, 0);
var cursorNorth = (env) => env.moveCursor(0, 0, -CURSOR_STEP);

//TODO: sprint
module.exports = {
  //primary movement
  startForward, startBack, startLeft, startRight,
  stopForward, stopBack, stopLeft, stopRight,

  //other movement options
  startJump, startSprint, startSneak,
  stopJump, stopSprint, stopSneak,

  //interactions
  attack, activateItem, //dig, placeBlock,

  //UI
  quickBarNext,

  //cursor control
  cursorEast, cursorUp, cursorSouth, cursorWest, cursorDown, cursorNorth,
};
