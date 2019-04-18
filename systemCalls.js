
var callTree = {"system call": {
  "generate": {
    "crystalline element": {
      "sword shape": (admin, user) => admin.bot.chat(`/give ${user} diamond_sword`),
    }
  },
  "increase fluct quota": (admin, user) =>
  {
    admin.fluctQuota++;
    admin.bot.chat(`Fluct quota increased to ${admin.fluctQuota}`);
  },
  "decrease fluct quota": (admin, user) =>
  {
    admin.fluctQuota--;
    admin.bot.chat(`Fluct quota decreased to ${admin.fluctQuota}`);
  },
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
