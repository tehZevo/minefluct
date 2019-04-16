const spawn = require("child_process").spawn;

var program = require('commander');

var MinecraftEnv = require("./MinecraftEnv.js");

//TODO: use
var NAME_PREFIX = "Bot-";
//TODO: parameterize
var MAX_ENTS = 1;

//TODO: host/port of the minecraft server to connect to (default to localhost:25565)

program
  .option("-n, --name [name]", "Fluctling name", "Bot")
  .option("-s, --script [script]", "Agent script type", "baselines")
  .option("-k, --no-kill", "Prevent exiting on death")
  .parse(process.argv);

var name = program.name;
var script = program.script;

var env = new MinecraftEnv(name, MAX_ENTS);
env.listen(0);

var port = env.server.address().port;
var url = "http://localhost:" + port;

var agent = null;

//keras-rl
if(script == "keras")
{
  agent = spawn('python', ["agents/keras-rl.py",
    "--url", url, "--name", name]);
}
//stable-baselines
else if(script == "baselines")
{
  agent = spawn('python', ["agents/stable-baselines.py",
    "--url", url, "--name", name]);
}
//TODO: tensorforce

agent.stdout.on('data', function(data) {
  console.log(data.toString());
});

agent.stderr.on('data', function(data) {
  console.log(data.toString());
});

env.bot.on("end", () =>
{
  //quit
  process.exit(0);
});

env.bot.on("death", () =>
{
  if(!program.kill)
  {
    return;
  }

  //TODO: tell python process to save and then quit?
  //murder python process
  agent.kill("SIGINT");

  setTimeout(() => env.bot.quit(), 100);
})
