var mineflayer = require('mineflayer');
var Vec3 = require("vec3");

var actions = require("./actions.js");
var O = require("./observations");
var EnvironmentServer = require("./EnvironmentServer.js");

var ATTACK_DIST = 4;
var MAX_RANGE = 10;
var EXP_SCALE = 1/7;
var HEALTH_SCALE = 1/5;
var FOOD_SCALE = 1/5;
var ARMOR_SCALE = 1/5;
var ANGLE = Math.PI * 2 / 30;

var NUM_NEARBY_ENTS = 4;

var CURSOR_BOX_SIZE = 2;
var CURSOR_FIND_SIZE = 2;
var CURSOR_OFFSET = new Vec3(0, 1, 0);

var CONTROL_STATE_KEYS = [
  "forward", "back", "left", "right",
  "jump", "sprint", "sneak"
];

var DIRS = [new Vec3(0, 1, 0), new Vec3(1, 0, 0), new Vec3(0, 0, 1),
  new Vec3(-1, 0, 0), new Vec3(0, -1, 0), new Vec3(0, 0, -1)];

//TODO: subclass this for versions of mineflucts
//  (for when observation/action spaces change)
//  these subclasses should provide availableActions, override getState, and getReward
//  getReward overriding will require tracking resource (exp/health/food) deltas
module.exports = class MinecraftEnv extends EnvironmentServer
{
  constructor(name="bot", availableActions=Object.keys(actions))
  {
    var obs = [
      //new O.SelfEnt(),
      new O.SelfEntSimple(),
      //new O.Vitals(),
      //new O.Controls(),
      //new O.Cursor(),
      //new O.NearbyBlock(),
      //new O.HeldItem(),
      //new O.NearbyEnts(NUM_NEARBY_ENTS, MAX_RANGE),
    ];

    availableActions = ["startForward", "startBack", "startLeft", "startRight",
      "stopForward", "stopBack", "stopLeft", "stopRight"
    ];

    //TODO: fix low/high of box... (pass low/high as arrays instead of shape)
    super({
      type: "box",
      low: 0,
      high: 1,
      shape: [O.getSize(obs)],
      dtype: "float32",
    }, {
      type: "discrete",
      n: availableActions.length,
    });

    this.obs = obs;
    this.resetControlState = false;
    this.lastExp = null;
    this.lastHealth = null;
    this.lastArmor = null; //TODO: how to armor?
    this.lastFood = null;
    this.availableActions = availableActions;
    this.cursor = new Vec3(0, 0, 0);

    //this.wait = 1000 / 10; //1 tick? //ms to delay responses
    this.wait = 1000 / 100;
    //this.wait = 1000 / 4;

    //TODO: parameterize
    this.bot = mineflayer.createBot({
      host: "localhost", // optional
      port: 25565,       // optional
      username: name,
      //password: null,
      //version: "1.12.2", //TODO: specify version?
    });

    this.spawned = false

    //spawn will be called after death.
    //its only immediately after login where it fails by default
    this.bot.on("spawn", () =>
    {
      //TODO: toggle for saying this only in admin managed mode?
      //this.bot.chat("System call: Generate crystalline element, sword shape.");
      this.bot.whisper("Quinella", "System call: Generate crystalline element, sword shape.");
    })

    //hopefully this will suffice as a spawn replacement for now
    //see https://github.com/PrismarineJS/mineflayer/issues/783
    this.bot.on("health", () =>
    {
      if(!this.spawned)
      {
        this.bot.emit("spawn");
        this.spawned = true;
      }
    });
  }

  //calculate reward based on changes in exp/health/food (TODO: armor)
  calcResourceReward()
  {
    var reward = 0;

    if(this.lastExp != null)
    {
      var dExp = this.bot.experience.points - this.lastExp;
      reward += dExp * EXP_SCALE;
    }

    if(this.lastHealth != null)
    {
      var dHealth = this.bot.health - this.lastHealth;
      reward += dHealth * HEALTH_SCALE;
    }

    if(this.lastFood != null)
    {
      var dFood = this.bot.food - this.lastFood;
      reward += dFood * FOOD_SCALE;
    }

    return reward;
  }

  calcDistanceReward(v, dist)
  {
    var p = this.bot.entity.position;
    if(p == null)
    {
      return 0;
    }

    return (dist - p.distanceTo(v)) / dist;
  }

  async step(action)
  {
    //reset movement and look
    if(this.resetControlState)
    {
      this.bot.clearControlStates();
    }

    this.bot.lookAt(this.cursorPosition());

    //perform action
    var actionName = this.availableActions[action];
    actions[actionName](this);

    //calculate reward
    var reward = 0;
    reward += this.calcResourceReward();
    reward += this.calcDistanceReward(new Vec3(-232, 64, -37), 10);

    this.lastExp = this.bot.experience.points;
    this.lastHealth = this.bot.health;
    this.lastFood = this.bot.food;
    //this.lastArmor = ??

    this.curSteps++;

    //console.log(reward)
    //TODO: this doesnt belong here... but itll do for now
    //TODO: send action names separately, and just send the number here...
    if(process.send)
    {
      process.send({
        //action: actionName,
        reward: reward,
      });
    }

    var obs = this.getState();
    var done = false; //never never stop no never
    var info = null;

    await new Promise((res) => setTimeout(res, this.wait));

    return [obs, reward, done, info];
  }

  //calcs offset direction from a towards b
  calcOffset(a, b)
  {
    var offset = b.minus(a);
    var abs = offset.abs();

    if(abs.y >= abs.x && abs.y >= abs.z)
    {
      return new Vec3(0, Math.sign(offset.y), 0);
    }
    if(abs.x >= abs.y && abs.x >= abs.z)
    {
      return new Vec3(Math.sign(offset.x), 0, 0);
    }
    if(abs.z >= abs.x && abs.z >= abs.y)
    {
      return new Vec3(0, 0, Math.sign(offset.z));
    }

    return offset;
  }

  isBlockAir(block)
  {
    return block.name == "air" || block.name == "cave_air" || block.name == "void_air";
  }

  attackNearCursor()
  {
    //find near cursor, ignore self filter only mobs and player i guess
    var closest = this.findEnts(this.cursorPosition(), CURSOR_FIND_SIZE,
      ["mob", "player"], [this.bot.entity])[0]

    if(closest == null)
    {
      return false;
    }

    if(closest.position.distanceTo(this.bot.entity.position) > ATTACK_DIST)
    {
      return false;
    }

    this.bot.attack(closest);

    return true;
  }

  placeBlockAtCursor()
  {
    var cursor = this.cursorPosition();
    cursor = cursor.floor();

    var block = this.bot.blockAt(cursor);
    if(block != null && !this.isBlockAir(block))
    {
      //tried to place block where theres already a block
      return;
    }

    for(var dir of DIRS)
    {
      var block = this.bot.blockAt(cursor.plus(dir));
      if(block == null || this.isBlockAir(block))
      {
        continue;
      }

      var offset = dir.scaled(-1);

      this.bot.chat("placing block at " + block.position.plus(offset));
      this.bot.placeBlock(block, offset);
      return;
    }

    this.bot.chat("couldnt place a block at " + cursor);
  }

  digNearCursor()
  {
    //console.log(this.cursorPosition(), CURSOR_FIND_SIZE);

    var block = this.getBlockNearCursor();

    //TODO: canseeblock
    if(block != null && this.bot.canSeeBlock(block) && this.bot.canDigBlock(block))
    {
      this.bot.dig(block);
    }
  }

  getBlockNearCursor(includeAir=false)
  {
    return this.bot.findBlock({
      point: this.cursorPosition(),
      matching: (b) => b == null ? false : includeAir ? true : !this.isBlockAir(b),
      maxDistance: CURSOR_FIND_SIZE,
    });
  }

  findNearestBlock(type, distance)
  {
    distance = distance || 2;
    return this.bot.findBlock({
      point: this.bot.entity.position,
      matching: (b) => b == null ? false : b.name == type,
      maxDistance: distance,
    });
  }

  cursorPosition()
  {
    return this.bot.entity.position.plus(this.cursor.plus(CURSOR_OFFSET));
  }

  moveCursor(dx, dy, dz)
  {
    //moves cursor and looks
    this.cursor = this.cursor.offset(dx, dy, dz);

    //clamp
    this.cursor.x = Math.max(-CURSOR_BOX_SIZE, Math.min(this.cursor.x, CURSOR_BOX_SIZE));
    this.cursor.y = Math.max(-CURSOR_BOX_SIZE, Math.min(this.cursor.y, CURSOR_BOX_SIZE));
    this.cursor.z = Math.max(-CURSOR_BOX_SIZE, Math.min(this.cursor.z, CURSOR_BOX_SIZE));

    //look
    //this.bot.lookAt(this.cursorPosition());
  }

  findEnts(pos, distance, types=[], ignore=[])
  {
    var ents = Object.values(this.bot.entities);

    ents = ents.filter((e) => types.includes(e.type));
    ents = ents.filter((e) => !ignore.includes(e));
    ents = ents.filter((e) => e.position.distanceTo(pos) <= distance);

    ents.sort((a, b) => a.position.distanceTo(pos) - b.position.distanceTo(pos));

    return ents;
  }

  getState()
  {
    var state = [];
    for(var observation of this.obs)
    {
      state.push(...observation.getValues(this));
    }

    return state;
  }

  async reset()
  {
    this.bot.clearControlStates();
    this.cursor = new Vec3(1, 0, 0);

    //TODO: have admin reset or something? idk

    this.lastExp = null;
    this.lastFood = null;
    this.lastArmor = null;
    this.lastHealth = null;

    this.curSteps = 0;

    return this.getState();
  }

}
