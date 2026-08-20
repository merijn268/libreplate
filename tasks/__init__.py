from invoke import Collection

from . import data, deploy, dev, docs

ns = Collection()

ns.add_collection(Collection.from_module(data))
ns.add_collection(Collection.from_module(docs))
ns.add_collection(Collection.from_module(deploy))
ns.add_collection(Collection.from_module(dev))

ns.configure(
    {
        "cli": {
            "verbose": False,
            "force": False,
        },
    }
)
