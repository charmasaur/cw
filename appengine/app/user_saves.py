from google.appengine.ext import ndb

class UserSavedCrosswordData(ndb.Model):
    uid = ndb.StringProperty()
    cw_key = ndb.StringProperty()
    data = ndb.StringProperty(indexed=False)
    date = ndb.DateTimeProperty(auto_now_add=True)

def _get_item(uid, cw_key):
    results = UserSavedCrosswordData.query(
            UserSavedCrosswordData.uid == uid,
            UserSavedCrosswordData.cw_key == cw_key).fetch()
    if len(results) > 1:
        raise Exception("Duplicate detected!")

    if len(results) == 1:
        return results[0]

    return None

# Does just about what you'd expect. cw_key has to uniquely identify the crossword (that is, it's
# just a dumb key, it's up to the caller to choose a useful type).
def put(uid, cw_key, data):
    item = _get_item(uid, cw_key)
    if not item:
        # Add a new item
        item = UserSavedCrosswordData(uid=uid, cw_key=cw_key, data=None)
    item.data = data
    item.put()

def get(uid, cw_key):
    item = _get_item(uid, cw_key)
    if not item:
        return None
    return item.data
