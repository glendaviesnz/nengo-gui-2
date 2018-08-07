import nengo
import numpy as np

model = nengo.Network()
with model:
    stim = nengo.Node(np.sin)
    a = nengo.Ensemble(n_neurons=50, dimensions=1)
    nengo.Connection(stim, a)
