const fork = require("child_process").fork;
const { species, parties, places } = require('fantastical')

var Administrator = require("./Administrator.js");

var admin = new Administrator("Quinella");

var MONITOR_DELAY = 1000 * 1;
var CREATE_DELAY = 1000 * 4;
var FLUCT_QUOTA = 10;

//TODO: disconnect handler
//TODO: generate fluct command
//TODO: multiplex minecraft envs so we can have multiple players controlled with 1 fluct...?
//  what happens when they die...???

//TODO: survival of the fittest sorta?
//  while bot is alive, other bots can spawn with a copy of their minefluct
//  but when bot dies, their minefluct dies too

var flucts = [];

process.on("uncaughtException", (err) =>
{
  console.error(err);
});

setInterval(monitor, MONITOR_DELAY);
setInterval(create, CREATE_DELAY);

//create();
//monitor();

//TODO: add delta health/armor/hunger as reward?
//TODO: add loading

function monitor()
{
  for(var i = 0; i < flucts.length; i++)
  {
    var f = flucts[i];
    if(f.exited)
    {
      //console.log("fluct is dead, removing");
      //admin.bot.chat("Fluct '" + f.name + "' is dead, removing.");
      //TODO: do something (clear inventory? idk. move that to minefluct)

      //TODO: delete user file (uuid?)
    }
  }

  flucts = flucts.filter((e) => !e.exited);
}

function create()
{
  if(flucts.length < FLUCT_QUOTA)
  {
    var msg = `Fluct deficit detected (${flucts.length}/${FLUCT_QUOTA}), spawning.`;
    //console.log(msg);
    //admin.bot.chat(msg);
    var fluct = spawnFluct();
    flucts.push(fluct);

    if(flucts.length >= FLUCT_QUOTA)
    {
      msg = `Fluct quota (${FLUCT_QUOTA}) reached.`;
      console.log(msg);
      admin.bot.chat(msg);
    }
  }
}

//TODO: system command for generating a fluct (move this to administrator)
function spawnFluct()
{
  var name = "Bot-" + species.human({allowMultipleNames: false})
  //var name = "Bot-" + (flucts.length + 1)

  var fluct = fork("mineFluct.js", ["--name", name], {silent: true});

  var o = {};
  o.process = fluct;
  o.status = "alive";
  o.name = name;

  var header = `---${name}---`;
  var footer = new Array(header.length).fill("-").join("");
  fluct.stdout.on("data", (data) => console.log(`${header}\n` + data.toString() + `${footer}`));
  fluct.stderr.on("data", (data) => console.error(`${header}\n` + data.toString() + `${footer}`));

  fluct.once("exit", (code) =>
  {
    //if code is not 0, assume crash and reload the fluct later
    if(code != 0)
    {
      console.log(`${o.name} exited with code ${code}, setting status to 'crashed'.`);
      o.status = "crashed";

      return;
    }
    //otherwise, it was a normal exit due to player death
    o.status = "dead";
  });

  return o;
}
