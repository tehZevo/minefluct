var Administrator = require("./Administrator.js");

//make sure server is running already lol
var admin = new Administrator("Quinella");

//TODO: disconnect handler
//TODO: generate fluct command
//TODO: multiplex minecraft envs so we can have multiple players controlled with 1 fluct...?
//  what happens when they die...???

//TODO: survival of the fittest sorta?
//  while bot is alive, other bots can spawn with a copy of their minefluct
//  but when bot dies, their minefluct dies too
//TODO: system command for generating a fluct
//TODO: a tree of fluct copy history
//TODO: system command for changing fluct quota
//TODO: subclass?????

process.on("uncaughtException", (err) =>
{
  console.error(err);
});

//TODO: add delta health/armor/hunger as reward?
//TODO: add loading
