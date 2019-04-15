const spawn = require("child_process").spawn;
const { species, parties, places } = require('fantastical')
var MinecraftEnv = require("./MinecraftEnv.js");

var Administrator = require("./Administrator.js");

var admin = new Administrator("Quinella");

var NUM_BOTS = 1;
var LAUNCH_DELAY = 1000 * 3;

//TODO: disconnect handler

process.on("uncaughtException", (err) =>
{
  console.error(err);
});

(async () =>
{
  for(var i = 0; i < NUM_BOTS; i++)
  {
    //var name = "Bot-" + species.human({allowMultipleNames: false})
    var name = "Bot" + (i+1);

    var env = new MinecraftEnv(name);
    env.listen(0);

    var port = env.server.address().port;
    var url = "http://localhost:" + port;

    //keras-rl
    //const agent = spawn('python', ["agent-keras-rl.py", "--url", url, "--name", name]);
    //stable-baselines
    const agent = spawn('python', ["agent-stable-baselines.py", "--url", url, "--name", name]);
    console.log(url)

    agent.stdout.on('data', function(data) {
      console.log(data.toString());
    })
    agent.stderr.on('data', function(data) {
      console.log(data.toString());
    })

    await new Promise((res) => setTimeout(res, LAUNCH_DELAY));
  }
})();
