#https://duongtrungnghia.wordpress.com/2017/03/28/install-mpi4py-on-windows-10/
import numpy as np
import gym
import argparse
import sys
import signal
import sys

from stable_baselines.common.policies import MlpPolicy, MlpLstmPolicy
from stable_baselines.common.vec_env import DummyVecEnv, VecFrameStack
from stable_baselines import PPO2

import matplotlib.pyplot as plt
import tensorflow as tf

from remote_env import RemoteEnv
from graph_stuff import graph_stuff

tf.logging.set_verbosity(tf.logging.ERROR)

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
parser.add_argument("--frame_stack", type=int, default=1)

args = parser.parse_args()

def signal_handler(sig, frame):
        print('You pressed Ctrl+C!')
        sys.exit(0)
signal.signal(signal.SIGINT, signal_handler)

name = args.name

# multiprocess environment
n_cpu = 1 #gotta be 1 (controlling single minecraft agent..)
#env = SubprocVecEnv([lambda: gym.make('CartPole-v1') for i in range(n_cpu)])
env = VecFrameStack(DummyVecEnv([lambda: RemoteEnv(args.url) for i in range(n_cpu)]), args.frame_stack)

#model = PPO2(MlpLstmPolicy, env, verbose=0, nminibatches=1)#have to set minibatches to 1
model = PPO2(MlpPolicy, env, verbose=0)

model_dir = "models"
model_prefix = "ppo2_minefluct"

def cb(locals, globals):
  #TODO: maybe only save one per name?

  global n_steps
  n_steps += 1

  if n_steps % log_steps == 0:
    print("Training step {} complete.".format(n_steps))

  if n_steps % save_steps == 0:
    fn = "{}/{}_{}_{}".format(model_dir, model_prefix, name, n_steps)
    print("Saving model to {}".format(fn))
    model.save(fn)

  sys.stdout.flush()

#some large number
fluct_life = 999999999999
n_steps = 0

log_steps = 1
save_steps = 10

#TODO: train on one episode???
while True:
  model.learn(fluct_life, cb)

#TODO: loading
del model # remove to demonstrate saving and loading

model = PPO2.load("models/ppo2_mcrl")

# Enjoy trained agent
obs = env.reset()
while True:
    action, _states = model.predict(obs)
    obs, rewards, dones, info = env.step(action)
    env.render()
