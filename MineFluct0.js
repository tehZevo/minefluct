const spawn = require("child_process").spawn;
var MinecraftEnv = require("./MinecraftEnv.js");

//TODO: use
var NAME_PREFIX = "Bot-";

//links a bot to a python process
module.exports = class MineFluct extends MinecraftEnv
{
  //script should be either "baselines" or "keras"
  constructor(name, maxEnts=1, script="baselines")
  {
    super(name, maxEnts);

    this.listen(0);

    this.port = this.server.address().port;
    this.url = "http://localhost:" + this.port;

    //keras-rl
    if(script == "keras")
    {
      this.agent = spawn('python', ["agent-keras-rl.py",
        "--url", this.url, "--name", this.name]);
    }
    //stable-baselines
    else if(script == "baselines")
    {
      this.agent = spawn('python', ["agent-stable-baselines.py",
        "--url", this.url, "--name", this.name]);
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

    this.bot.on("death", () =>
    {
      //murder python process
      this.agent.kill("SIGINT");
      //stop express server
      this.server.close();

      console.log("destroyed minefluct of '" + name + "'");

      this.isDead = true;
    })
  }
}
