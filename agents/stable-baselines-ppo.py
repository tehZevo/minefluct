#https://duongtrungnghia.wordpress.com/2017/03/28/install-mpi4py-on-windows-10/
import numpy as np
import gym
import argparse
import sys
import signal
import sys
import os

from stable_baselines.common.policies import MlpPolicy, MlpLstmPolicy, MlpLnLstmPolicy
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
parser.add_argument("--remove-on-end", action="store_true")
parser.add_argument("--save-steps", type=int, default=1)
parser.add_argument("--log-steps", type=int, default=1)

args = parser.parse_args()

def signal_handler(sig, frame):
  if args.remove_on_end:
    delete_model()
  else:
    save_model()

  sys.exit(0)

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

  sys.stdout.flush()

def delete_model():
  if args.save_path is None:
    return

  file = "{}.pkl".format(args.save_path)

  if os.path.isfile(file):
    #TODO: handle deleting all model_step files
    print("Removing model '{}'".format(args.save_path))
    os.remove(file)

  sys.stdout.flush()

signal.signal(signal.SIGINT, signal_handler)

#TODO: handle load path

#TODO: handle load and save path being the same with save-multiple enabled,
#  it should increment the steps number
#  basically if load path == save path, then iters = number at end of load path
#  (parseint from right of path, or split path on _, then select [-1])

#create environment
n_cpu = 1 #gotta be 1 (controlling single minecraft agent..)
#env = SubprocVecEnv([lambda: gym.make('CartPole-v1') for i in range(n_cpu)])
env = VecFrameStack(DummyVecEnv([lambda: RemoteEnv(args.url) for i in range(n_cpu)]), args.frame_stack)

#TODO: use warnings module
if args.save_path is None:
  print("Warning: no save_path provided. Model will not be saved.");

if args.load_path is not None:
  #load model
  print("Loading '{}'...".format(args.load_path))
  model = PPO2.load(args.load_path, env, verbose=0)
else:
  #create new model
  #model = PPO2(MlpLstmPolicy, env, verbose=0, nminibatches=1)#have to set minibatches to 1
  #model = PPO2(MlpLnLstmPolicy, env, verbose=0, nminibatches=1)
  model = PPO2(MlpPolicy, env, verbose=0)
  #and immediately save
  save_model()

sys.stdout.flush()

#some large number
fluct_life = 999999999999
training_step_counter = 0

#assume we're continuing where we left off
if args.save_path == args.load_path:
  #TODO: training_step_counter = something
  pass

#TODO: train on one episode???
while True:
  model.learn(fluct_life, cb)

if args.remove_on_end:
  delete_model();
