*********
Nengo GUI
*********

Nengo GUI is an HTML5-based interactive visualizer for
large-scale neural models created with
`Nengo <https://github.com/nengo/nengo>`_.
The GUI lets you see the structure of a Nengo model,
plots spiking activity and decoded representations,
and enables you to alter inputs
in real time while the model is running.

Requirements
============

- Python
- Nengo
- npm and node.js

Installation
============

Developers should install Nengo GUI like so:

.. code:: shell

   git clone https://github.com/nengo/nengo-gui-2
   cd nengo-gui-2
   yarn

You can then run the debug interface with

.. code:: shell

    npm run debug

And then point your browser towards ``localhost:8080``. Someday, we should be able to actually do ``npm run build``.

Running unit tests
------------------

Testing is done with `tape` and can be run with:

.. code:: shell

    npm run test

Objectives
==========

- Eliminate dependency on jQuery
- Minimize use of D3.js
- Make the interface more easily testable by seperating server
  and front-end functionality
- Replace CSS with PostCSS
- Seperation of model, control and view
- Leverage the Virtual DOM
