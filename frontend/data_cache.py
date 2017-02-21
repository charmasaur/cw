from google.appengine.ext import ndb
import hashlib

class DataCache(ndb.Model):
    data = ndb.StringProperty()

def hash(key):
    m = hashlib.md5()
    m.update(key)
    return m.hexdigest()

def get_item(key):
    hsh = hash(key)
    item = ndb.Key(DataCache, hsh).get()
    if not item:
        item = DataCache(id=hsh)
    return item

def put(key, data):
    item = get_item(key)
    item.data = data
    item.put()

def get(key):
    item = get_item(key)
    return item.data
