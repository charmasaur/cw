from flask_sqlalchemy import SQLAlchemy

from app.app import db

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
