from nengo_gui.client import ExposedToClient, FastClientConnection
from nengo_gui.exceptions import NotAttachedError


class Position(object):
    __slots__ = ("left", "top", "width", "height")

    def __init__(self, left=0, top=0, width=100, height=100):
        self.left = left
        self.top = top
        self.width = width
        self.height = height

    def to_json(self):
        return {"left": self.left,
                "top": self.top,
                "width": self.width,
                "height": self.height}

    def __repr__(self):
        return "Position(left={!r}, top={!r}, width={!r}, height={!r})".format(
            self.left, self.top, self.width, self.height)


class Component(ExposedToClient):
    """Abstract handler for a particular Component of the user interface.

    Each part of the user interface has part of the code on the server-side
    (in Python) and a part on the client-side (in Javascript).  These two sides
    communicate via WebSockets, and the server-side is always a subclass of
    Component.

    Each Component can be configured via the nengo.Config system.  Components
    can add required nengo objects into the model to allow them to gather
    required data or input overriding data (in the case of Pointer and Slider)
    to/from the running model.  Communication from server to
    client is done via ``Component.update_client()``, which is called regularly
    by the ``Server.ws_viz_component`` handler.  Communication from client to
    server is via ``Component.message()``.
    """

    def __init__(self, client, obj, uid, pos=None, label_visible=True):
        super(Component, self).__init__(client)
        self.obj = obj
        self._uid = uid
        self.pos = pos
        self.label_visible = label_visible

    @property
    def label(self):
        """Return a readable label for an object.

        An important difference between a label and a name is that a label
        does not have to be unique in a namespace.

        If the object has a .label set, this will be used. Otherwise, it
        uses names, which thanks to the NameFinder will be legal
        Python code for referring to the object given the current locals()
        dictionary ("model.ensembles[1]" or "ens" or "model.buffer.state").
        If it has to use names, it will only use the last part of the
        label (after the last "."). This avoids redundancy in nested displays.
        """
        label = self.obj.label
        if label is None:
            label = self.uid
            if '.' in label:
                label = label.rsplit('.', 1)[1]
        return label

    @property
    def uid(self):
        return self._uid

    # TODO: rename
    def add_nengo_objects(self, network):
        """Add or modify the nengo model before build.

        Components may need to modify the underlying nengo.Network by adding
        Nodes and Connections or modifying the structure in other ways.
        This method will be called for all Components just before the build
        phase.
        """
        pass

    def create(self):
        """Instruct the client to create this object."""
        raise NotImplementedError("Components must implement `create`")

    def delete(self):
        """Instruct the client to delete this object."""
        raise NotImplementedError("Components must implement `delete`")

    def dumps(self, names):
        """Important to do correctly, as it's used in the config file."""
        raise NotImplementedError("Components must implement `dumps`")

     # TODO: rename
    def remove_nengo_objects(self, network):
        """Undo the effects of add_nengo_objects.

        After the build is complete, remove the changes to the nengo.Network
        so that it is all set to be built again in the future.
        """
        pass

    def similar(self, other):
        """Determine whether this component is similar to another component.

        Similar, in this case, means that the `.diff` method can be used to
        mutate the other component to be the same as this component.
        """
        return self.uid == other.uid and type(self) == type(other)

    def to_json(self):
        d = self.__dict__.copy()
        d["cls"] = type(self).__name__
        return d

    def update(self, other):
        """Update the client based on another version of this component."""
        if self.label != other.label:
            self.client.send("%s.label" % self.uid, label=self.label)

    # def javascript_config(self, cfg):
    #     """Convert the nengo.Config information into javascript.

    #     This is needed so we can send that config information to the client.
    #     """
    #     for attr in self.config._clsparams.params:
    #         if attr in cfg:
    #             raise AttributeError("Value for %s is already set in the "
    #                                  "config of this component. Do not try to "
    #                                  "modify it via this function. Instead "
    #                                  "modify the config directly." % (attr))
    #         else:
    #             cfg[attr] = getattr(self.config, attr)
    #     return json.dumps(cfg)

    # def code_python(self, uids):
    #     """Generate Python code for this Component.

    #     This is used in the .cfg file to generate a valid Python expression
    #     that re-creates this Component.

    #     The input uids is a dictionary from Python objects to strings that
    #     refer to those Python objects (the reverse of the locals() dictionary)
    #     """
    #     args = self.code_python_args(uids)
    #     name = self.__class__.__name__
    #     return 'nengo_gui.components.%s(%s)' % (name, ','.join(args))

    # def code_python_args(self, uids):
    #     """Return a list of strings giving the constructor arguments.

    #     This is used by code_python to re-create the Python string that
    #     generated this Component, so it can be saved in the .cfg file.

    #     The input uids is a dictionary from Python objects to strings that
    #     refer to those Python objects (the reverse of the locals() dictionary)
    #     """
    #     return []


class Widget(Component):

    def __getattr__(self, name):
        # NB: This method will only be called is `name` is not an attribute
        if name == "fast_client":
            raise NotAttachedError("This Widget is not yet attached.")
        raise AttributeError("%r object has no attribute %r"
                             % (type(self).__name__, name))

    def attach(self, fast_client):
        self.fast_client = fast_client
