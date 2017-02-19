from google.appengine.ext import ndb

class GridGetterConfig(ndb.Model):
    url = ndb.StringProperty()
    auth = ndb.StringProperty()

def get():
    cfg = ndb.Key(GridGetterConfig, "config").get()
    if not cfg:
        cfg = GridGetterConfig(id="config")
    return cfg
