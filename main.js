var Administrator = require("./Administrator.js");

//make sure server is running already lol
var admin = new Administrator("Quinella");

//TODO: disconnect handler
//TODO: multiplex minecraft envs so we can have multiple players controlled with 1 fluct...?
//  what happens when they die...???

//TODO: system command for generating a fluct
//TODO: a tree of fluct copy history
//TODO: system command for changing fluct quota
//TODO: add loading

process.on("uncaughtException", (err) =>
{
  console.error(err);
});
