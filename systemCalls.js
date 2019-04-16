
var callTree = { "system call": {
  "generate": {
    "crystalline element": {
      "sword shape": (admin, user) => admin.bot.chat(`/give ${user} diamond_sword`),
    }
  }
}};

var calls = {};

function buildCallList(tree=callTree, prefix)
{
  for(var key in tree)
  {
    var subKey = prefix == null ? key : prefix + " " + key;

    if(typeof tree[key] == "function")
    {
      return calls[subKey] = tree[key];
    }

    buildCallList(tree[key], subKey);
  }

}

buildCallList();

module.exports = calls;
