const fork = require("child_process").fork;

var express = require("express");
var mineflayer = require('mineflayer');
var Vec3 = require("vec3");
const { species, parties, places } = require('fantastical')

var systemCalls = require("./systemCalls.js");

//needs to be slow enough to not timeout bots on start (from cpu usage?)
var MONITOR_INTERVAL = 1000 * 4;
var DEFAULT_FLUCT_QUOTA = 10;
//TODO: come up with a better system of tracking/spawning independent flucts..
//if #of living fluts is < this number, spawn a random fluct instead of copying
var INDEPENDENT_FLUCT_QUOTA = 5;

var ANCESTRY_LENGTH = 10;

//TODO: get initial list of flucts from models folder
//TODO: spawn using load-name and name being the same

module.exports = class Administrator
{
  //TODO: express server?
  constructor(name="Quinella")
  {
    this.flucts = [];
    this.fluctQuota = DEFAULT_FLUCT_QUOTA;

    //TODO: parameterize
    this.bot = mineflayer.createBot({
      host: "localhost", // optional
      port: 25565,       // optional
      username: name,
      //password: null,
    });

    //TODO: reset on death?
    this.bot.on("chat", (username, msg) =>
    {
      if(username == null)
      {
        return;
      }

      if(username == this.bot.username)
      {
        return;
      }

      //this.bot.chat(msg);

      var m = msg.trim().toLowerCase();
      if(m.startsWith("system call"))
      {
        this.systemCall(username, m);
      }
    });

    this.app = express();
    this.app.use(express.static('public'));

    var api = express.Router();
    api.get("/ancestry", (req, res) =>
    {
      res.json(this.flucts.map((e) => e.ancestry));
    });

    this.app.use("/api", api);

    //TODO: parameterize
    var port = 3000;
    this.app.listen(port, () => console.log(`Example app listening on port ${port}!`))

    //this.monitor(); //TODO: wait till login...
    setInterval(() => this.monitor(), MONITOR_INTERVAL);
  }

  monitor()
  {
    //create new flucts to hit quota
    if(this.flucts.length < this.fluctQuota)
    {
      var msg = `Fluct deficit detected (${this.flucts.length}/${this.fluctQuota}), spawning.`;
      //console.log(msg);
      //this.bot.chat(msg);
      //choose a random name from the list of current flucts
      var copyFrom = null;
      //if we still need to spawn more independent (random) flucts
      if(this.flucts.length < INDEPENDENT_FLUCT_QUOTA)
      {
        //TODO: code clean
        copyFrom = null;
      }
      //otherwise if we have already spawned at least one fluct
      else if(this.flucts.length > 0)
      {
        //copy a random fluct
        copyFrom = this.flucts[Math.floor(Math.random() * this.flucts.length)];
      }

      var fluct = this.spawnFluct(copyFrom);

      this.flucts.push(fluct);

      if(this.flucts.length >= this.fluctQuota)
      {
        msg = `Fluct quota (${this.fluctQuota}) reached.`;
        console.log(msg);
        //this.bot.chat(msg);
      }
    }

    for(var i = 0; i < this.flucts.length; i++)
    {
      var f = this.flucts[i];
      //TODO: check if status==crashed, and "hibernate" fluct
      if(f.status != "alive")
      {
        //TODO: remove fluct from model folder
        //  (after a delay of 1-2 seconds, to hopefully avoid deleting the file
        //  before its loaded by the fluct process)
        //console.log("fluct is dead, removing");
        //this.bot.chat("Fluct '" + f.name + "' is dead, removing.");
        //TODO: clear inventory / delete user file (by uuid)?
      }
    }

    //remove references to dead fluct processes
    this.flucts = this.flucts.filter((e) => e.status == "alive");
  }

  systemCall(user, call)
  {
    call = call.replace(/[^a-zA-Z\d\s]/g, "");
    call = call.split(/\s+/g).join(" ");

    if(call in systemCalls)
    {
      //this.bot.chat("Executing system call...")
      systemCalls[call](this, user);
    }
  }

  spawnFluct(copyFrom)
  {

    //generate a random name
    var name = "Bot-" + species.human({allowMultipleNames: false})
    //var name = "Bot-" + (this.flucts.length + 1)

    var msg = `Creating fluct ${name}`;
    msg += copyFrom != null ? ` (copy of ${copyFrom.name})` : "";
    console.log(msg);
    //this.bot.chat(msg);

    //create fluct subprocess
    var args = ["--name", name, "--exit-on-death"];
    if(copyFrom != null)
    {
      args.push("--load-name", copyFrom.name);
    }

    var fluct = fork("mineFluct.js", args, {silent: true});

    var o = {};
    o.process = fluct;
    o.status = "alive";
    o.name = name;
    //copy ancestry list and append self name
    o.ancestry = copyFrom == null ? [] : copyFrom.ancestry.slice();
    o.ancestry.push(name);
    while(o.ancestry.length > ANCESTRY_LENGTH)
    {
      o.shift();
    }

    var header = `[${name}]`;
    var footer = new Array(header.length).fill("-").join("");
    //TODO: prefix each line with header instead of using header-footer system
    fluct.stdout.on("data", (data) =>
    {
      data = data.toString().trim().split("\n");
      data.forEach((e) => console.log(`[${name}] ${e}`));
    });
    fluct.stderr.on("data", (data) =>
    {
      data = data.toString().trim().split("\n");
      data.forEach((e) => console.error(`[${name}] ${e}`));
    });

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

}
