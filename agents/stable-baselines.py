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
#TODO: random seed?
#TODO: tensorboard logging
#TODO: learning rate (and other ppo2 args)
#TODO: model prefix based on params?
parser = argparse.ArgumentParser()
parser.add_argument("--load-path", type=str, default=None)
parser.add_argument("--save-path", type=str, default=None)
parser.add_argument('--url', type=str, default="http://localhost:8080")
parser.add_argument("--frame-stack", type=int, default=1)
parser.add_argument('--save-multiple', action='store_true')
parser.add_argument("--save-steps", type=int, default=1)
parser.add_argument("--log-steps", type=int, default=1)

args = parser.parse_args()

def signal_handler(sig, frame):
  save_model() #or not
  sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

#TODO: handle load path

#TODO: handle load and save path being the same with save-multiple enabled,
#  it should increment the steps number
#  basically if load path == save path, then iters = number at end of load path
#  (parseint from right of path, or split path on _, then select [-1])

#TODO: use warnings module
if args.save_path is None:
  print("Warning: no save_path provided. Model will not be saved.");

# multiprocess environment
n_cpu = 1 #gotta be 1 (controlling single minecraft agent..)
#env = SubprocVecEnv([lambda: gym.make('CartPole-v1') for i in range(n_cpu)])
env = VecFrameStack(DummyVecEnv([lambda: RemoteEnv(args.url) for i in range(n_cpu)]), args.frame_stack)

#model = PPO2(MlpLstmPolicy, env, verbose=0, nminibatches=1)#have to set minibatches to 1
model = PPO2(MlpPolicy, env, verbose=0)

def cb(locals, globals):
  global training_step_counter
  training_step_counter += 1

  if training_step_counter % args.log_steps == 0:
    print("Training step {} complete.".format(training_step_counter))

  if training_step_counter % args.save_steps == 0:
    save_model()

  sys.stdout.flush()

def save_model():
  #if save path is none, just bail
  if args.save_path is None:
    return

  path = "{}_{}".format(args.save_path, training_step_counter) if args.save_multiple else args.save_path
  print("Saving model to {}".format(path))
  model.save(path)

#some large number
fluct_life = 999999999999
training_step_counter = 0

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
