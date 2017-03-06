from google.appengine.ext import ndb

class ConverterConfig(ndb.Model):
    url = ndb.StringProperty()
    auth = ndb.StringProperty()

def _get():
    cfg = ndb.Key(ConverterConfig, "config").get()
    if not cfg:
        cfg = ConverterConfig(id="config")
    return cfg

def get():
    config = _get()
    return config.url, config.auth

def update(url, auth):
    config = _get()
    config.url = url
    config.auth = auth
    config.put()
