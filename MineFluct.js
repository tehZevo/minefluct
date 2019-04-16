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
  .parse(process.argv);

var name = program.name;
var script = program.script;

var env = new MinecraftEnv(name, MAX_ENTS);
env.listen(0);

console.log(program.name)

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

env.bot.on("death", () =>
{
  //TODO: tell python process to save and then quit?
  //murder python process
  agent.kill("SIGINT");

  //quit
  process.exit(0);
})
