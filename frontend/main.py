from flask import Markup, Flask, redirect, request, render_template
from google.appengine.api import urlfetch
import base64
import hashlib
import json

import data_cache
import grid_getter_config

app = Flask(__name__)

@app.route('/', methods=['GET'])
def cw_mungo():
    return render_template("welcome.html")

@app.route('/go', methods=['POST'])
def go():
    if 'image_file' not in request.files:
        return redirect('/')
    file = request.files['image_file']
    ext = file.filename.split(".")[-1]

    url, auth = grid_getter_config.get()
    bdata = base64.b64encode(file.read())

    # if the data is already cached just use that, otherwise query the backend (caching the data if
    # the query succeeds)
    data = data_cache.get(bdata)
    # status message to show on the cw page. we just use this to tell the user whether or not
    # they're using a cached crossword.
    msg = ''
    # cache key used to decide whether or not to try to load user progress from cookies. this
    # should be a hash of bdata and data (that is, image data and semantic data), because we can't
    # be sure that if one is the same then the other is too.
    cache_key = ''
    if data:
        msg = 'Using cached result!'
    if not data:
        success, data = get_data_from_backend(bdata, url, auth)
        if success:
            data_cache.put(bdata, data)
    cache_key = get_cache_key(bdata, data)

    return render_template(
            "cw.html",
            image_data='data:image/' + ext + ';base64,' + bdata,
            cw_data=data,
            cache_key=cache_key,
            message=msg)

def get_cache_key(bdata, data):
    m = hashlib.md5()
    m.update(bdata)
    m.update(data)
    return m.hexdigest()

def get_data_from_backend(bdata, url, auth):
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
    data = data + get_clues(data)
    return (True, data)

def get_label(d):
    if d == 0:
        return "across"
    return "down"

def works(lines, r, c):
    return r >= 0 and r < len(lines) and c >= 0 and c < len(lines[0]) and lines[r][c] == " "

def is_start(lines, r, c, dr, dc):
    if not works(lines, r, c):
        return False
    nr = r + dr
    nc = c + dc
    if not works(lines, nr, nc):
        return False
    pr = r - dr
    pc = c - dc
    if works(lines, pr, pc):
        return False
    return True

def get_len(lines, r, c, dr, dc):
    len = 0
    while works(lines, r, c):
        len += 1
        r += dr
        c += dc
    return len

def get_clues(data):
    lines = data.split("\n")
    width = int(lines[0].split(" ")[0])
    height = int(lines[0].split(" ")[1])
    rlines = lines[1:height+1]

    clues = []
    found = 0
    for r in range(height):
        for c in range(width):
            did = False
            if is_start(rlines, r, c, 0, 1):
                clues.append((0, found + 1, r, c, get_len(rlines, r, c, 0, 1)))
                did = True
            if is_start(rlines, r, c, 1, 0):
                clues.append((1, found + 1, r, c, get_len(rlines, r, c, 1, 0)))
                did = True
            if did:
                found += 1
    ret = str(len(clues)) + "\n"
    for (d, n, r, c, l) in clues:
        ret += str(n) + " " + get_label(d) + ": (" + str(r) + ", " + str(c) + "), " + str(l) + "\n"
    return ret
