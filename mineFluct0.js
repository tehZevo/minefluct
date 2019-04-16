const spawn = require("child_process").spawn;

var program = require('commander');

var MinecraftEnv = require("./MinecraftEnv.js");

//TODO: use
var NAME_PREFIX = "Bot-";
var MODEL_DIR = "models";

//TODO: host/port of the minecraft server to connect to (default to localhost:25565)

program
  .option("-l, --load-name [loadName]", "Load a fluct as the starting point")
  .option("-n, --name [name]", "Fluctling name", "Bot")
  .option("-s, --script [script]", "Agent script type", "baselines")
  .option("-k, --no-kill", "Prevent exiting on death")
  .parse(process.argv);

var script = program.script;
var agent = null;
var isDead = false;

var env = new MinecraftEnv(program.name);
env.listen(0);

var port = env.server.address().port;
var url = "http://localhost:" + port;

process.on('SIGINT', function() {
  isDead = true;

  //quit
  setTimeout(() => env.bot.quit(), 100);
});

//normal behavior:
//  bot dies
//  disconnect bot
//  interrupt python script
//  wait for python script to end
//  exit(0)

//crash behavior:
//  bot disconnects
//  interrupt python script & wait
//  exit(1)

env.bot.on("death", () =>
{
  //end agent script on death
  if(!program.kill)
  {
    return;
  }

  isDead = true;

  //quit
  setTimeout(() => env.bot.quit(), 100);
});

//when bot disconnects
env.bot.on("end", () =>
{
  //if we set the dead flag (permadeath)
  if(isDead)
  {
    //interrupt python process, this should trigger a clean save and exit
    agent.kill("SIGINT");
    //quit
    process.exit(0);
  }

  //TODO: attempt to resurrect? idk

  //otherwise we likely dced due to an error
  process.exit(1);
});

//keras-rl
//TODO: update keras rl agent script to use similar params?
if(script == "keras")
{
  //TODO: load/save path
  var args = ["agents/keras-rl.py", "--url", url, "--name", program.name];
  agent = spawn('python', args);
}

//stable-baselines
else if(script == "baselines")
{
  //TODO: --load-path
  var args = ["agents/stable-baselines.py",
    "--url", url,
    "--save-path", MODEL_DIR + "/" + program.name,
    "--remove-on-end",
  ]

  console.log(args)

  //if we specified a fluct name to load
  if(program.loadName != null)
  {
    //set the load path
    args.push("--load-path", MODEL_DIR + "/" + program.loadName);
  }

  agent = spawn('python', args);
}

//TODO: tensorforce

agent.stdout.on('data', function(data) {
  console.log(data.toString());
});

agent.stderr.on('data', function(data) {
  //TODO: quit bot?
  console.log(data.toString());
});

agent.stdout.on("close", () =>
{
  //quit bot
  env.bot.quit();
})
