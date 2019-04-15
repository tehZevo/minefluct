
var callTree = { "system call": {
  "generate": {
    "cyrstalline element": {
      "sword shape": (admin, user) => admin.bot.chat(`/give ${user} diamond_sword`),
    }
  }
}};

var calls = {};

function buildCallList(tree=callTree, prefix="")
{
  for(var key in tree)
  {
    if(typeof tree[key] == "function")
    {
      return calls[prefix + " " + key] = tree[key];
    }

    buildCallList(tree[key], prefix + " " + key);
  }

}

buildCallList();

module.exports = calls;
