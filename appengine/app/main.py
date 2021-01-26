from flask import Flask, redirect, request, render_template, url_for
import google.oauth2.id_token
import google.auth.transport.requests
import base64
import datetime
import hashlib
import json
import wand.image as wi

import app.image_cache as image_cache
import app.user_saves as user_saves
import app.extractor as extractor


from app.app import app

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

    cw_data = extractor.extract(image_bdata)

    msg = image_cache.put(image_bdata, image_ext, cw_data)
    return redirect('/cw?cw_id=' + msg)

@app.route('/preview', methods=['POST'])
def preview():
    image_ext, image_data = get_ext_and_data(request)
    if not image_ext or not image_data:
        return redirect('/')

    message = ""
    output_image_ext = 'jpg'
    try:
        image_object = wi.Image(blob=image_data)
        image_object.transform("1000x1000")
        if 'rotate_cw' in request.form:
            image_object.rotate(90);
        if 'rotate_ccw' in request.form:
            image_object.rotate(-90);
        output_image_data = image_object.convert(output_image_ext).make_blob()
    except:
        message = "Can't process image"

    output_image_bdata = base64.b64encode(output_image_data)

    return render_template(
            "preview.html",
            image_bdata=output_image_bdata,
            image_ext=output_image_ext,
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

@app.route('/get_cw_data', methods=['GET'])
def get_cw_data():
    args = request.args.to_dict()
    if not 'cw_id' in args:
        return "No ID specified", 400
    cw_id = args['cw_id']

    uid = _get_uid(request.headers['Authorization'].split(' ').pop())
    if not uid:
        return "Unauthorized", 401
    data = user_saves.get(uid, cw_id)
    if not data:
        return ""
    print(data)
    return data

@app.route('/set_cw_data', methods=['POST'])
def set_cw_data():
    args = request.args.to_dict()
    if not 'cw_id' in args:
        return "No ID specified", 400
    cw_id = args['cw_id']
    cw_data = request.data
    if not cw_data:
        return "No data specified", 400

    print(cw_data)

    uid = _get_uid(request.headers['Authorization'].split(' ').pop())
    if not uid:
        return "Unauthorized", 401

    user_saves.put(uid, cw_id, cw_data)
    return ""

# TODO: This could probably take a request object instead, and pull the info out of the header
# itself
def _get_uid(id_token):
    http_request = google.auth.transport.requests.Request()
    claims = google.oauth2.id_token.verify_firebase_token(id_token, http_request)
    if not claims:
        return None
    return claims['sub']

def get_cache_key(bdata, data):
    m = hashlib.md5()
    m.update(bdata)
    m.update(data)
    return m.hexdigest()
