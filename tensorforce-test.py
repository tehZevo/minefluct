from tensorforce.agents import PPOAgent

# Instantiate a Tensorforce agent
agent = PPOAgent(
  states=dict(type='float', shape=(10,)),
  actions=dict(type='int', num_values=5),
  network=[
    dict(type='dense', size=64),
    dict(type='dense', size=64)
  ],
  step_optimizer=dict(type='adam', learning_rate=1e-4)
)

# Initialize the agent
agent.initialize()

# Retrieve the latest (observable) environment state
state = get_current_state()  # (float array of shape [10])

# Query the agent for its action decision
action = agent.act(states=state)  # (scalar between 0 and 4)

# Execute the decision and retrieve the current performance score
reward = execute_decision(action)  # (any scalar float)

# Pass feedback about performance (and termination) to the agent
agent.observe(reward=reward, terminal=False)
