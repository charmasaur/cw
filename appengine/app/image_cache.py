import datetime

from flask_sqlalchemy import SQLAlchemy

from app.app import db


class ImageDataItem(db.Model):
    key = db.Column(db.Integer, primary_key=True)
    bdata = db.Column(db.String)
    ext = db.Column(db.String)
    cw_data = db.Column(db.String)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)

def delete(key):
    query = ImageDataItem.query.filter_by(key=int(key))
    if not query.count():
        return False
    query.delete()
    db.session.commit()
    return True

def put(bdata, ext, cw_data):
    item = ImageDataItem(bdata=bdata, ext=ext, cw_data=cw_data)
    db.session.add(item)
    db.session.commit()
    return str(item.key)

def get(key):
    # TODO: Make my own keys, so I can do deduping stuff.. or alternatively
    # include an indexed token in the model, and search for that when adding
    # new entries
    item = ImageDataItem.query.get(int(key))
    if not item:
        return None
    return item.bdata, item.ext, item.cw_data, item.date

def get_recents(count):
    results = ImageDataItem.query.order_by(ImageDataItem.date.desc()).limit(count)
    return [(result.date, str(result.key)) for result in results]
