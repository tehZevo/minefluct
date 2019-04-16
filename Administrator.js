var mineflayer = require('mineflayer');
var Vec3 = require("vec3");
var express = require("express");

var systemCalls = require("./systemCalls.js");

module.exports = class Administrator
{
  //TODO: express server?
  constructor(name="Quinella")
  {
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

}
