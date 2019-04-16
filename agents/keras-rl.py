import numpy as np
import gym
import argparse

from keras.models import Sequential
from keras.layers import Dense, Activation, Flatten, Input, Reshape, BatchNormalization
from keras.optimizers import Adam

from rl.agents.dqn import DQNAgent
from rl.policy import BoltzmannQPolicy, EpsGreedyQPolicy
from rl.memory import SequentialMemory

import matplotlib.pyplot as plt

import sys

from remote_env import RemoteEnv
from graph_stuff import graph_stuff

#TODO: get_neighbor(config) should return a config that is close to the original
#   either here or in js.. idk

parser = argparse.ArgumentParser()
parser.add_argument('--name', type=str, default="bot")
parser.add_argument('--url', type=str, default="http://localhost:8080")
parser.add_argument('--layers', type=int, nargs="+", default=[64, 32])
parser.add_argument("--activation", type=str, default="tanh")
parser.add_argument("--learning_rate", type=float, default=1e-3)
parser.add_argument("--episode_steps", type=int, default=300)
parser.add_argument("--memory_size", type=int, default=10000)
parser.add_argument("--window_length", type=int, default=1)
parser.add_argument("--batch_norm", type=bool, default=True)
#TODO: does the memory reset on fit?
#TODO: "name" of model?

args = parser.parse_args()

name = args.name

env = RemoteEnv(args.url)

nb_actions = env.action_space.n

#print(env.observation_space.shape)
# Next, we build a very simple model.
model = Sequential()
model.add(Reshape((np.product((args.window_length,) + env.observation_space.shape),), input_shape=(args.window_length,) + env.observation_space.shape))
#model.add(Flatten(input_shape=(1,) + env.observation_space.shape))
for i, layer_size in enumerate(args.layers):
  if args.batch_norm:
    model.add(BatchNormalization())
  model.add(Dense(layer_size, activation=args.activation))
if args.batch_norm:
  model.add(BatchNormalization())
model.add(Dense(nb_actions, activation="linear"))

#print(model.summary())

# Finally, we configure and compile our agent. You can use every built-in Keras optimizer and
# even the metrics!
memory = SequentialMemory(limit=args.memory_size, window_length=args.window_length)
#policy = BoltzmannQPolicy() #TODO: parameterize
policy = EpsGreedyQPolicy(0.1)
dqn = DQNAgent(model=model, nb_actions=nb_actions, memory=memory, nb_steps_warmup=10,
               target_model_update=1e-2, policy=policy)
dqn.compile(Adam(lr=args.learning_rate), metrics=['mae'])

eps_per_iter = 1
iters = 0
#TODO: save
rewards = []
while True:
  print("Iteration {}".format(iters + 1))
  print("Training...")

  #TODO: hardcoded
  hist = dqn.fit(env, nb_steps=args.episode_steps * eps_per_iter, visualize=False, verbose=2,
    nb_max_episode_steps=args.episode_steps)#args.episode_steps)

  sys.stdout.flush()
  rewards += hist.history["episode_reward"]

  print("Graphing...")
  graph_stuff(rewards)
  plt.savefig("{}.png".format(name))

  plt.clf()

  iters += 1

  print("Saving...")
  dqn.save_weights('models/dqn_{}_{}_weights.h5f'.format(name, iters), overwrite=True)
  #dqn.save_weights('models/dqn_{}_{}_weights.h5f'.format(name, 1), overwrite=True)
