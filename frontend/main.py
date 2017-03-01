from flask import Markup, Flask, redirect, request, render_template
from google.appengine.api import images, urlfetch
import base64
import hashlib
import json

import data_cache
import grid_getter_config
import clue_getter

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
def cw_mungo():
    return render_template("welcome.html")

@app.route('/go', methods=['POST'])
def go():
    image_ext, image_data = get_ext_and_data(request)
    if not image_ext or not image_data:
        return redirect('/')

    image_bdata = base64.b64encode(image_data)

    # if the data is already cached just use that, otherwise query the backend (caching the data if
    # the query succeeds)
    cw_data = data_cache.get(image_bdata)
    # status message to show on the cw page. we just use this to tell the user whether or not
    # they're using a cached crossword.
    msg = ''
    # cache key used to decide whether or not to try to load user progress from cookies. this
    # should be a hash of bdata and data (that is, image data and semantic data), because we can't
    # be sure that if one is the same then the other is too.
    cache_key = ''
    if cw_data:
        msg = 'Using cached result!'
    if not cw_data:
        success, cw_data = get_data_from_backend(image_bdata)
        if success:
            data_cache.put(image_bdata, cw_data)
    cache_key = get_cache_key(bdata, data)

    return render_template(
            "cw.html",
            image_data='data:image/' + image_ext + ';base64,' + image_bdata,
            cw_data=cw_data,
            cache_key=cache_key,
            message=msg)

@app.route('/preview', methods=['POST'])
def preview():
    if 'image_file' not in request.files:
        return redirect('/')
    file = request.files['image_file']
    ext = file.filename.split(".")[-1]

    resized = images.resize(file.read(), 1000, 1000)
    bdata = base64.b64encode(resized)

    return render_template(
            "preview.html",
            image_data='data:image/' + ext + ';base64,' + bdata)

def get_cache_key(bdata, data):
    m = hashlib.md5()
    m.update(bdata)
    m.update(data)
    return m.hexdigest()

def get_data_from_backend(bdata):
    urlfetch.set_default_fetch_deadline(15)
    url, auth = grid_getter_config.get()
    response = json.loads(urlfetch.fetch(
            url=url,
            payload='{"b64data":"' + bdata + '"}',
            method=urlfetch.POST,
            headers={'Content-Type': 'application/json', 'Authorization': auth}).content)

    if not "result" in response:
        return (False, "Backend request failed: " + json.dumps(response))

    data = response["result"]
    data = data.replace("|","\n")
    data = data + "\n"
    data = data + clue_getter.get_clues(data)
    return (True, data)
