var Vec3 = require("vec3");

var TURN_ANGLE = Math.PI * 2 / 30;

var CURSOR_STEP = 1;

//movement
var forward = (env) => env.bot.setControlState("forward", true);
var back = (env) => env.bot.setControlState("back", true);
var left = (env) => env.bot.setControlState("left", true);
var right = (env) => env.bot.setControlState("right", true);
var sprint = (env) => env.bot.setControlState("sprint", true);
var sneak = (env) => env.bot.setControlState("sneak", true);
var jump = (env) => env.bot.setControlState("jump", true);
//outdated movement
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
module.exports = [
  //primary movement
  forward, back, left, right,

  //other movement options
  jump, // sprint, sneak,

  //interactions
  attack, // activateItem, dig, placeBlock,

  //UI
  //quickBarNext,

  //cursor control
  cursorEast, cursorUp, cursorSouth, cursorWest, cursorDown, cursorNorth,
];
