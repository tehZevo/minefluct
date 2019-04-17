var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

//shows entities near to the player
module.exports = class NearbyEntsObs extends Observation
{
  constructor(count, maxRange)
  {
    super(count * encoders.entity().length);

    this.count = count;
    this.maxRange = maxRange;
  }

  getValues(env)
  {
    var values = [];
    var nearbyEnts = env.findEnts(env.bot.entity.position, this.maxRange,
      //TODO: parameterize entity types?
      ["mob", "player"], [env.bot.entity])

    for(var i = 0; i < this.count; i++)
    {
      var e = nearbyEnts[i];

      //push encoded entity with local position
      values.push(...encoders.entity(env.bot, e, true));
    }

    return values;
  }
}
