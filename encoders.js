var Vec3 = require("vec3");
var hash = require("string-hash");

//shared settings
var HASH_BITS = 16;

//entity encode settings
var GLOBAL_POS_SCALE = 1;
var LOCAL_POS_SCALE = 1;
var VEL_SCALE = 1;
var ANG_SCALE = 1;
var INCLUDE_GLOBAL_POS = true;
var INCLIDE_LOCAL_POS = true;
var INCLUDE_VELOCITY = true;
var INCLUDE_ANGLE = true;

//item encode settings
var STACK_SCALE = 1/64;

//block encode settings
var LIGHT_SCALE = 1/16;

function block(bot, b, local=true)
{
  //TODO: metadata? diggable?

  var id = b == null ? new Array(HASH_BITS).fill(0) : worldsWorstStringEncoder(b.name);
  var pos = b == null ? new Vec3(0, 0, 0) :
    local ? b.position.minus(bot.entity.position) :
    b.position;
  var light = b == null ? 0 : b.light * LIGHT_SCALE;
  var skyLight = b == null ? 0 : b.skyLight * LIGHT_SCALE;

  var ret = b == null ? [0] : [1];
  ret.push(...id);
  ret.push(pos.x, pos.y, pos.z);
  ret.push(light);
  ret.push(skyLight);

  return ret;
}

function worldsWorstStringEncoder(name)
{
  return (hash(name) % Math.pow(2, HASH_BITS)).toString(2).padStart(HASH_BITS, "0").split("").map((e) => parseInt(e));
}

function item(bot, i)
{
  //TODO: nbt? ha.
  //TODO: metadata
  //id, count
  var id = i == null ? new Array(HASH_BITS).fill(0) : worldsWorstStringEncoder(i.name);
  var count = (i == null ? 0 : i.count) * STACK_SCALE;

  return [count, ...id];
}

function entity(bot, e, local=true)
{
  //pretty much everything but the bot itself should be local i guess.

  //TODO: type (mob/player)?, name?
  //exists, global position (x, y, z), local positon (x, y, z), velocity (x, y, z), yaw, pitch

  var p = e == null ? new Vec3(0, 0, 0) :
    local ? e.position.minus(bot.entity.position) :
    e.position;
  var v = e == null ? new Vec3(0, 0, 0) : e.velocity;
  var yaw = e == null ? 0 : (e.yaw || 0);
  var pitch = e == null ? 0 : (e.pitch || 0);

  var ret = e == null ? [0] : [1]; //exists

  var name = e == null ? "" : (e.username || e.displayName || e.type);

  ret.push(...worldsWorstStringEncoder(name));
  ret.push(...[p.x, p.y, p.z].map((e) => e * GLOBAL_POS_SCALE)); //position
  ret.push(...[v.x, v.y, v.z].map((e) => e * VEL_SCALE)); //velocity
  ret.push(...[yaw, pitch].map((e) => e * ANG_SCALE)); //angles (yaw/pitch)

  return ret;
}

function quickBar(bot)
{
  //TODO
}

module.exports = {
  entity, item, block,
  quickBar,
}
