module.exports = class Observation
{
  constructor(size)
  {
    this.size = size;
  }

  //override me
  getValues()
  {
    return null;
  }
}
