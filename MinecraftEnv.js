var mineflayer = require('mineflayer');
var Vec3 = require("vec3");

var encoders = require("./encoders.js");
var actions = require("./actions.js");

var EnvironmentServer = require("./EnvironmentServer.js");

var ATTACK_DIST = 2;
var MAX_RANGE = 1000;
var EXP_SCALE = 1/10;
var ANGLE = Math.PI * 2 / 30;

var CURSOR_BOX_SIZE = 1;
var CURSOR_FIND_SIZE = 1;
var CURSOR_OFFSET = new Vec3(0, 1, 0);

var DIRS = [new Vec3(0, 1, 0), new Vec3(1, 0, 0), new Vec3(0, 0, 1),
  new Vec3(-1, 0, 0), new Vec3(0, -1, 0), new Vec3(0, 0, -1)];

module.exports = class MinecraftEnv extends EnvironmentServer
{
  constructor(name="bot", maxEnts=1)
  {
    //TODO: fix low/high of box...
    super({
      type: "box",
      low: 0,
      high: 1,
      //player + held item + maxents + cursor + block near cursor
      //TODO: better way of handling state size
      shape: [encoders.block().length + 3 + encoders.item().length + (maxEnts + 1) * encoders.entity().length],
      dtype: "float32",
    }, {
      type: "discrete",
      n: actions.length,
    });

    this.lastExp = null;
    this.maxEnts = maxEnts;

    this.cursor = new Vec3(0, 0, 0);

    this.wait = 1000 / 10; //1 tick? //ms to delay responses

    //TODO: parameterize
    this.bot = mineflayer.createBot({
      host: "localhost", // optional
      port: 25565,       // optional
      username: name,
      //password: null,
    });

    this.spawned = false

    //spawn will be called after death.
    //its only immediately after login where it fails by default
    this.bot.on("spawn", () =>
    {
      //TODO: toggle for saying this only in admin managed mode?
      this.bot.chat("System call: Generate crystalline element, sword shape.");
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

  async step(action)
  {
    //reset movement and look
    this.bot.clearControlStates();

    this.bot.lookAt(this.cursorPosition());

    //perform action
    actions[action](this);

    //calculate reward
    var reward = 0;

    if(this.lastExp != null)
    {
      var dExp = this.bot.experience.points - this.lastExp;
      reward += dExp * EXP_SCALE;

      // if(dExp != 0)
      // {
      //   var plus = dExp >= 0 ? "+" : "";
      //   console.log(`${plus}${dExp} exp (${this.bot.experience.points} total)`);
      // }
    }

    this.lastExp = this.bot.experience.points;

    this.curSteps++;

    //var closest = this.getClosestEnt("mob");
    //reward += -this.bot.entity.position.distanceTo(closest ? closest.position : new Vec3(-231, 64, -40)) / 1000;
    //reward += -this.bot.entity.position.distanceTo(new Vec3(-232, 64, -40)) / 1000;
    //console.log(reward)

    //reward for performing last action (jump)
    //reward = action == actions.length - 1 ? 1 : 0;

    //reward for being near diamond ore
    var dDist = 5;
    var diamond = this.findNearestBlock("diamond_ore", dDist);
    if(diamond == null)
    {
      //console.log("no diamond?!?");
    }
    else
    {
      reward = (dDist - diamond.position.distanceTo(this.bot.entity.position)) / dDist;
    }

    var obs = this.getState();
    var done = false; //reset from agent.py //this.curSteps >= this.maxSteps;
    var info = null;

    await new Promise((res) => setTimeout(res, this.wait));

    return [obs, reward, done, info];
  }

  lookAtNearestMob()
  {
    var closest = this.getClosestEnt("mob");
    if(closest == null)
    {
      return;
    }

    this.bot.lookAt(closest.position);
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

  getClosestEnt(type)
  {
    var nearbyEnts = this.getNearbyEnts(MAX_RANGE);
    nearbyEnts = nearbyEnts.filter((e) => e.type == type);

    return nearbyEnts[0];
  }

  attackNearestMob()
  {
    var closest = this.getClosestEnt("mob");
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

  getNearbyEnts(distance)
  {
    var ents = Object.values(this.bot.entities);
    ents = ents.filter((e) => e.position.distanceTo(this.bot.entity.position) <= distance);
    ents.sort((a, b) => a.position.distanceTo(this.bot.entity.position) - b.position.distanceTo(this.bot.entity.position));
    return ents;
  }

  getState()
  {
    var state = [];

    //add self entity to state
    state.push(...encoders.entity(this.bot, this.bot.entity, false));

    //push cursor position
    var c = this.cursor;
    state.push(...[c.x, c.y, c.z]);

    //push block near cursor (local)
    var block = this.getBlockNearCursor();
    state.push(...encoders.block(this.bot, block, true));

    //add held item to state
    state.push(...encoders.item(this.bot, this.bot.entity.heldItem));

    //add nearby mobs to state
    var nearbyEnts = this.getNearbyEnts(MAX_RANGE);
    nearbyEnts = nearbyEnts.filter((e) => e.type == "mob");
    for(var i = 0; i < this.maxEnts; i++)
    {
      var e = nearbyEnts[i];

      //push encoded entity with local position
      state.push(...encoders.entity(this.bot, e, true));
    }

    return state;
  }

  async reset()
  {
    this.bot.clearControlStates();
    this.cursor = new Vec3(1, 0, 0);

    //TODO: have admin reset or something? idk

    this.lastExp = null;
    this.curSteps = 0;

    return this.getState();
  }

}
