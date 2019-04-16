from gym import spaces
import gym
import requests

class RemoteEnv(gym.Env):
  def __init__(self, base_url):
    self.__version__ = "0.1.0"

    self.curr_step = -1

    #load config from server
    r = requests.get(base_url + "/config")
    r.raise_for_status()
    config = r.json()

    self.base_url = base_url

    #build observation/action spaces from config
    os = config["observation_space"]
    if os["type"] == "discrete":
      self.observation_space = spaces.Discrete(os["n"])
    elif os["type"] == "box":
      self.observation_space = spaces.Box(os["low"], os["high"], os["shape"], dtype=os["dtype"])
    else:
      raise "Unknown/unimplemented observation space type '{}'".format(os["type"])

    os = config["action_space"]
    if os["type"] == "discrete":
      self.action_space = spaces.Discrete(os["n"])
    elif os["type"] == "box":
      self.action_space = spaces.Box(os["low"], os["high"], os["shape"], dtype=os["dtype"])
    else:
      raise "Unknown/unimplemented action space type '{}'".format(os["type"])

    #print(self.observation_space, self.action_space)

  def step(self, action):
    r = requests.post(self.base_url + "/step", data={"action": action})
    r.raise_for_status()
    r = r.json()
    obs, reward, done, info = (r[0], r[1], r[2], r[3])

    info = {} if info is None else info

    return obs, reward, done, info

  def reset(self):
    r = requests.get(self.base_url + "/reset")
    r.raise_for_status()
    r = r.json()

    return r
