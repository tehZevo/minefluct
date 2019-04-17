const fork = require("child_process").fork;

var express = require("express");
var mineflayer = require('mineflayer');
var Vec3 = require("vec3");
const { species, parties, places } = require('fantastical')

var systemCalls = require("./systemCalls.js");

//needs to be slow enough to not timeout bots on start (from cpu usage?)
var MONITOR_INTERVAL = 1000 * 3;
var FLUCT_QUOTA = 10;

module.exports = class Administrator
{
  //TODO: express server?
  constructor(name="Quinella")
  {
    this.flucts = [];

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

    this.monitor();
    setInterval(() => this.monitor(), MONITOR_INTERVAL);
  }

  monitor()
  {
    //create new flucts to hit quota
    if(this.flucts.length < FLUCT_QUOTA)
    {
      var msg = `Fluct deficit detected (${this.flucts.length}/${FLUCT_QUOTA}), spawning.`;
      //console.log(msg);
      //this.bot.chat(msg);
      var fluct = this.spawnFluct();
      this.flucts.push(fluct);

      if(this.flucts.length >= FLUCT_QUOTA)
      {
        msg = `Fluct quota (${FLUCT_QUOTA}) reached.`;
        console.log(msg);
        this.bot.chat(msg);
      }
    }

    for(var i = 0; i < this.flucts.length; i++)
    {
      var f = this.flucts[i];
      if(f.status != "alive")
      {
        //console.log("fluct is dead, removing");
        //this.bot.chat("Fluct '" + f.name + "' is dead, removing.");
        //TODO: do something (clear inventory? idk. move that to minefluct)

        //TODO: delete user file (uuid?)
      }
    }

    console.log(this.flucts.length);

    //TODO: flucts arent getting removed...?
    //TODO: remove dead flucts, "hibernate" crashed flucts (especially if server is closed)
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

  spawnFluct()
  {
    var name = "Bot-" + species.human({allowMultipleNames: false})
    //var name = "Bot-" + (this.flucts.length + 1)

    //TODO: load name from living fluct
    var args = ["--name", name, "--exit-on-death"];
    var fluct = fork("mineFluct.js", args, {silent: true});

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

}
