import datetime

from flask_sqlalchemy import SQLAlchemy

from app.app import db


# TODO

class ImageDataItem(ndb.Model):
    key = ... something automatic
    bdata = db.Column(db.String)
    ext = db.Column(db.String)
    cw_data = db.Column(db.String)

def delete(key):
    item = ndb.Key(urlsafe=key).get()
    if not item:
        return False
    item.key.delete()
    return True

def put(bdata, ext, cw_data):
    item = ImageDataItem(bdata=bdata, ext=ext, cw_data=cw_data)
    return item.put().urlsafe()

def get(key):
    # TODO: Make my own keys, so I can do deduping stuff.. or alternatively
    # include an indexed token in the model, and search for that when adding
    # new entries
    item = ndb.Key(urlsafe=key).get()
    if not item:
        return None
    if not item.cw_data:
        # This is an old entry from before we added cw_data, remove it
        item.key.delete()
        return None
    return item.bdata, item.ext, item.cw_data, item.date

def get_recents(count):
    results = ImageDataItem.query().order(-ImageDataItem.date).fetch(count)
    return [(result.date, result.key.urlsafe()) for result in results]

class UserSavedCrosswordData(db.Model):
    uid = db.Column(db.String, primary_key=True)
    cw_key = db.Column(db.String, primary_key=True)
    data = db.Column(db.String)

def _get_item(uid, cw_key):
    return UserSavedCrosswordData.query.get(
        {"uid": uid, "cw_key": cw_key})

# Does just about what you'd expect. cw_key has to uniquely identify the crossword (that is, it's
# just a dumb key, it's up to the caller to choose a useful type).
def put(uid, cw_key, data):
    item = _get_item(uid, cw_key)
    if not item:
        # Add a new item
        item = UserSavedCrosswordData(uid=uid, cw_key=cw_key, data="")
        db.session.add(item)
    item.data = data
    db.session.commit()

def get(uid, cw_key):
    item = _get_item(uid, cw_key)
    if not item:
        return None
    return item.data
