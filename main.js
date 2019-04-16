const fork = require("child_process").fork;
const { species, parties, places } = require('fantastical')

var Administrator = require("./Administrator.js");

var admin = new Administrator("Quinella");

var MONITOR_DELAY = 1000 * 1;
var CREATE_DELAY = 1000 * 4;
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

//create();
//monitor();

function monitor()
{
  for(var i = 0; i < flucts.length; i++)
  {
    var f = flucts[i];
    if(f.exited)
    {
      //TODO: admin.bot.say
      console.log("fluct is dead, removing");
      admin.bot.chat("Fluct '" + f.name + "' is dead, removing.");
      //TODO: do something (clear inventory? idk. move that to minefluct)

      //TODO: delete user file (uuid?)
    }
  }

  flucts = flucts.filter((e) => !e.exited);
}

//TODO: listen for fluct close/exit
function create()
{
  if(flucts.length < FLUCT_QUOTA)
  {
    var msg = `Fluct deficit detected (${flucts.length}/${FLUCT_QUOTA}), spawning.`;
    console.log(msg);
    admin.bot.chat(msg);
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
  o.exited = false;
  o.name = name;

  var header = `---${name}---`;
  var footer = new Array(header.length).fill("-").join("");
  fluct.stdout.on("data", (data) => console.log(`${header}\n` + data.toString() + `${footer}`));
  fluct.stderr.on("data", (data) => console.error(`${header}\n` + data.toString() + `${footer}`));

  fluct.once("exit", (code) =>
  {
    //TODO: if code is 0, its a death, else error (and relaunch?)
    o.exited = true;
  });

  return o;
}
