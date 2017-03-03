from flask import Flask, redirect, request, render_template, url_for
from google.appengine.api import images, urlfetch
import base64
import hashlib

import image_cache

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
def welcome():
    recent_results = image_cache.get_recents(10)
    recents = []
    for date, cw_id in recent_results:
        recents.append({'date':date.strftime("%H:%M:%S %d %b UTC"), 'url':url_for('cw', cw_id=cw_id)})

    return render_template(
            "welcome.html",
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
            cache_key=cache_key)

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

    message = ""
    try:
        image_data = images.resize(image_data, 1000, 1000)
        if 'rotate_cw' in request.form:
            image_data = images.rotate(image_data, 90);
        if 'rotate_ccw' in request.form:
            image_data = images.rotate(image_data, -90);
    except:
        message = "Can't process image"

    image_bdata = base64.b64encode(image_data)

    return render_template(
            "preview.html",
            image_bdata=image_bdata,
            image_ext=image_ext,
            message=message)

def get_cache_key(bdata, data):
    m = hashlib.md5()
    m.update(bdata)
    m.update(data)
    return m.hexdigest()
