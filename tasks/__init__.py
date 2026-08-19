from invoke import Collection

from . import data, deploy, dev, docs, setup

ns = Collection()

ns.add_collection(Collection.from_module(data))
ns.add_collection(Collection.from_module(dev))
ns.add_collection(Collection.from_module(docs))
ns.add_collection(Collection.from_module(deploy))
ns.add_collection(Collection.from_module(setup))
