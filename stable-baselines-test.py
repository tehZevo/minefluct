#https://duongtrungnghia.wordpress.com/2017/03/28/install-mpi4py-on-windows-10/
import gym

from stable_baselines.common.policies import MlpPolicy, MlpLstmPolicy
from stable_baselines.common.vec_env import DummyVecEnv, SubprocVecEnv, VecFrameStack
from stable_baselines import PPO1, PPO2, A2C, ACER

# multiprocess environment
n_cpu = 1
#env = SubprocVecEnv([lambda: gym.make('CartPole-v1') for i in range(n_cpu)])
env = VecFrameStack(DummyVecEnv([lambda: gym.make('CartPole-v1') for i in range(n_cpu)]), 4)

model = PPO2(MlpPolicy, env, verbose=1)
#model = PPO2(MlpLstmPolicy, env, verbose=1, nminibatches=1)#have to set minibatches to 1
#model = A2C(MlpPolicy, env, verbose=1)
model.learn(total_timesteps=25000)
model.save("ppo2_cartpole")

del model # remove to demonstrate saving and loading

model = PPO2.load("ppo2_cartpole")

# Enjoy trained agent
obs = env.reset()
while True:
    action, _states = model.predict(obs)
    obs, rewards, dones, info = env.step(action)
    env.render()
