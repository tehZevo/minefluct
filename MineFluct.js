const spawn = require("child_process").spawn;
var MinecraftEnv = require("./MinecraftEnv.js");

//TODO: use
var NAME_PREFIX = "Bot-";

//links a bot to a python process
module.exports = class MineFluct
{
  //script should be either "baselines" or "keras"
  constructor(name, maxEnts=1, script="baselines")
  {
    this.env = new MinecraftEnv(name, maxEnts);

    this.env.listen(0);

    this.name = name;

    var port = this.env.server.address().port;
    var url = "http://localhost:" + port;

    //keras-rl
    if(script == "keras")
    {
      this.agent = spawn('python', ["agent-keras-rl.py",
        "--url", url, "--name", name]);
    }
    //stable-baselines
    else if(script == "baselines")
    {
      this.agent = spawn('python', ["agent-stable-baselines.py",
        "--url", url, "--name", name]);
    }
    //TODO: tensorforce

    this.agent.stdout.on('data', function(data) {
      console.log(data.toString());
    });
    this.agent.stderr.on('data', function(data) {
      console.log(data.toString());
    });

    this.isDead = false;

    //need to listen for this.agent on exit or whatever and set fluct to dead (close express server)

    this.env.bot.on("death", () =>
    {
      //murder python process
      this.agent.kill("SIGINT");
      //stop express server
      this.env.server.close();

      console.log("destroyed minefluct of '" + this.name + "'");

      this.isDead = true;
    })
  }
}
