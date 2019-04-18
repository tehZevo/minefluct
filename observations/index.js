module.exports = {
  //takes an array of observations and returns their total size
  //TODO: calculate low/high instead of size...
  getSize: (observations) => observations.reduce((acc, e) => acc + e.size, 0),

  Controls: require("./ControlsObs.js"),
  Cursor: require("./CursorObs.js"),
  NearbyBlock: require("./NearbyBlockObs.js"),
  NearbyEnts: require("./NearbyEntsObs.js"),
  SelfEnt: require("./SelfEntObs.js"),
  SelfEntSimple: require("./SelfEntSimpleObs.js"),
  HeldItem: require("./HeldItemObs.js"),
  Vitals: require("./VitalsObs.js"),
}
