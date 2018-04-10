from google.appengine.ext import ndb
import hashlib

class DataItem(ndb.Model):
    data = ndb.StringProperty(indexed=False)

def hash(key):
    m = hashlib.md5()
    m.update(key)
    return m.hexdigest()

def get_item(key):
    hsh = hash(key)
    item = ndb.Key(DataItem, hsh).get()
    if not item:
        item = DataItem(id=hsh)
    return item

def put(key, data):
    item = get_item(key)
    item.data = data
    item.put()

def get(key):
    item = get_item(key)
    return item.data

def invalidate():
    for item in DataItem.query().fetch():
        item.key.delete()
