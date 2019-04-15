#https://duongtrungnghia.wordpress.com/2017/03/28/install-mpi4py-on-windows-10/
import numpy as np
import gym
import argparse

from stable_baselines.common.policies import MlpPolicy, MlpLstmPolicy
from stable_baselines.common.vec_env import DummyVecEnv, VecFrameStack
from stable_baselines import PPO2

import matplotlib.pyplot as plt

import sys

from remote_env import RemoteEnv
from graph_stuff import graph_stuff

#TODO: policy type
#TODO: support framestack
#TODO: checkpointing (interval?)
#TODO: random seed?
#TODO: reset_num_timesteps for resetting log step numbers
#TODO: tensorboard logging
#TODO: learning rate (and other ppo2 args)
parser = argparse.ArgumentParser()
parser.add_argument('--name', type=str, default="bot")
parser.add_argument('--url', type=str, default="http://localhost:8080")
parser.add_argument("--interval_steps", type=int, default=300)
parser.add_argument("--frame_stack", type=int, default=1)

args = parser.parse_args()
name = args.name

# multiprocess environment
n_cpu = 1 #gotta be 1 (controlling single minecraft agent..)
#env = SubprocVecEnv([lambda: gym.make('CartPole-v1') for i in range(n_cpu)])
env = VecFrameStack(DummyVecEnv([lambda: RemoteEnv(args.url) for i in range(n_cpu)]), args.frame_stack)

model = PPO2(MlpPolicy, env, verbose=0)
#model = PPO2(MlpLstmPolicy, env, verbose=1, nminibatches=1)#have to set minibatches to 1
#model = A2C(MlpPolicy, env, verbose=1)

iters = 0

while True:
  print("Iteration {} (steps)".format(iters + 1))
  model.learn(args.interval_steps)

  iters += 1
  model.save("models/ppo2_mcrl_{}_{}".format(name, iters))


#TODO: checkpointing/loading
del model # remove to demonstrate saving and loading

model = PPO2.load("models/ppo2_mcrl")

# Enjoy trained agent
obs = env.reset()
while True:
    action, _states = model.predict(obs)
    obs, rewards, dones, info = env.step(action)
    env.render()
