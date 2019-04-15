const spawn = require("child_process").spawn;
const { species, parties, places } = require('fantastical')
var MineFluct = require("./MineFluct.js");

var Administrator = require("./Administrator.js");

var admin = new Administrator("Quinella");

var MONITOR_DELAY = 1000 * 1
var CREATE_DELAY = 1000 * 10;
var FLUCT_QUOTA = 10;

//TODO: disconnect handler
//TODO: memory management (remove listeners? idk if theres anything to do)
//TODO: put each minefluct in its own process

var flucts = [];

process.on("uncaughtException", (err) =>
{
  console.error(err);
});

setInterval(monitor, MONITOR_DELAY);
setInterval(create, CREATE_DELAY);

function monitor()
{
  console.log("flucts: " + flucts.length);

  for(var i = 0; i < flucts.length; i++)
  {
    var f = flucts[i];
    if(f.isDead)
    {
      //TODO: admin.bot.say
      console.log("fluct is dead, removing");
      admin.bot.chat("Fluct '" + f.name + "' is dead, removing.");
      //TODO: do something (clear inventory? idk. move that to minefluct)

      //TODO: delete user file (uuid?)
    }
  }

  flucts = flucts.filter((e) => !e.isDead);
}

function create()
{
  //TODO: generate new flucts?
  if(flucts.length < FLUCT_QUOTA)
  {
    //var name = "Bot-" + species.human({allowMultipleNames: false})
    var name = "Bot-" + (flucts.length + 1)

    var fluct = new MineFluct(name);

    flucts.push(fluct);
  }
}
