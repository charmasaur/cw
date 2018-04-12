from flask import Flask, redirect, request, render_template, url_for
from google.appengine.api import images, urlfetch
import google.oauth2.id_token
import google.auth.transport.requests
import base64
import datetime
import hashlib
import json
import requests_toolbelt.adapters.appengine

import image_cache

requests_toolbelt.adapters.appengine.monkeypatch()

app = Flask(__name__)

def get_ext_and_data(request):
    ext = None
    data = None
    if 'image_file' in request.files:
        file = request.files['image_file']
        ext = file.filename.split(".")[-1]
        data = file.read();
    if 'image_bdata' in request.form and 'image_ext' in request.form:
        data = base64.b64decode(request.form['image_bdata'])
        ext = request.form['image_ext']
    return ext, data

@app.route('/', methods=['GET'])
def home():
    recent_results = image_cache.get_recents(10)
    recents = []
    for date, cw_id in recent_results:
        recents.append({
            'date':(date - datetime.datetime(1970,1,1)).total_seconds(),
            'url':url_for('cw', cw_id=cw_id)
            })

    return render_template(
            "home.html",
            recents=recents)

@app.route('/cw', methods=['GET'])
def cw():
    args = request.args.to_dict()
    if not 'cw_id' in args:
        return "No ID specified"
    cw_id = args['cw_id']

    result = image_cache.get(cw_id)
    if not result:
        return "Not found"
    image_bdata, image_ext, cw_data, date_added = result

    # cache key used to decide whether or not to try to load user progress from local storage. this
    # should be a hash of bdata and data (that is, image data and semantic data), because we can't
    # be sure that if one is the same then the other is too.
    # TODO: Why can't we just use cw_id?
    cache_key = get_cache_key(image_bdata, cw_data)

    return render_template(
            "cw.html",
            image_data='data:image/' + image_ext + ';base64,' + image_bdata,
            cw_data=cw_data,
            cache_key=cache_key,
            cw_id=cw_id)

@app.route('/go', methods=['POST'])
def go():
    image_ext, image_data = get_ext_and_data(request)
    if not image_ext or not image_data:
        return redirect('/')

    image_bdata = base64.b64encode(image_data)

    urlfetch.set_default_fetch_deadline(20)
    cw_data = urlfetch.fetch(
            url="http://extractor.cw-mungo.appspot.com/extract",
            payload=image_bdata,
            method=urlfetch.POST).content

    msg = image_cache.put(image_bdata, image_ext, cw_data)
    return redirect('/cw?cw_id=' + msg)

@app.route('/preview', methods=['POST'])
def preview():
    image_ext, image_data = get_ext_and_data(request)
    if not image_ext or not image_data:
        return redirect('/')
    if not (image_ext == "jpg" or image_ext == "jpeg"):
        urlfetch.set_default_fetch_deadline(30)
        result = json.loads(urlfetch.fetch(
                url="http://converter.cw-mungo.appspot.com/convert",
                payload=base64.b64encode(image_data),
                method=urlfetch.POST).content)
        if not result or not "b64data" in result or not "ext" in result:
            return redirect('/')
        image_ext = result["ext"]
        image_data = base64.b64decode(result["b64data"])

    message = ""
    try:
        image_object = images.Image(image_data)
        image_object.resize(width=1000, height=1000)
        if 'rotate_cw' in request.form:
            image_object.rotate(90);
        if 'rotate_ccw' in request.form:
            image_object.rotate(-90);
        image_data = image_object.execute_transforms(output_encoding=images.JPEG)
    except:
        message = "Can't process image"

    image_bdata = base64.b64encode(image_data)

    return render_template(
            "preview.html",
            image_bdata=image_bdata,
            image_ext=image_ext,
            message=message)

@app.route('/delete', methods=['GET'])
def delete():
    args = request.args.to_dict()
    if not 'cw_id' in args:
        return "No ID specified"
    cw_id = args['cw_id']

    if not image_cache.delete(cw_id):
        msg = "Failed to delete " + cw_id
    else:
        msg = "Deleted " + cw_id
    return render_template(
            "delete.html",
            msg=msg)

@app.route('/get_uid', methods=['GET'])
def get_uid():
    id_token = request.headers['Authorization'].split(' ').pop()
    http_request = google.auth.transport.requests.Request()
    claims = google.oauth2.id_token.verify_firebase_token(id_token, http_request)
    if not claims:
        return "Unauthorized", 401
    return claims['sub']

def get_cache_key(bdata, data):
    m = hashlib.md5()
    m.update(bdata)
    m.update(data)
    return m.hexdigest()
