from google.appengine.ext import ndb

class ImageDataItem(ndb.Model):
    bdata = ndb.StringProperty(indexed=False)
    ext = ndb.StringProperty()

def put(bdata, ext):
    item = ImageDataItem(bdata=bdata, ext=ext)
    return item.put().urlsafe()

def get(key):
    # TODO: Make my own keys, so I can do deduping stuff.. or alternatively
    # include an indexed token in the model, and search for that when adding
    # new entries
    item = ndb.Key(urlsafe=key).get()
    if not item:
        return None
    return item.bdata, item.ext
