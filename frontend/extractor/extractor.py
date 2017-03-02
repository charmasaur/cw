from flask import Flask, redirect, request, render_template
from google.appengine.api import urlfetch
import json

import data_cache
import grid_getter_config
import clue_getter

app = Flask(__name__)

@app.route('/extract', methods=['POST'])
def extract():
    image_bdata = request.get_data()

    # if the data are already cached just use that, otherwise query the backend (caching the data
    # if the query succeeds)
    cw_data = data_cache.get(image_bdata)
    if not cw_data:
        success, cw_data = get_data_from_backend(image_bdata)
        if success:
            data_cache.put(image_bdata, cw_data)

    return cw_data

@app.route('/admin', methods=['GET'])
def admin():
    url, auth = grid_getter_config.get()
    return render_template("admin.html", url=url, auth=auth)

@app.route('/admin/set_backend_info', methods=['POST'])
def set_backend_info():
    grid_getter_config.update(request.form['url'], request.form['auth'])
    data_cache.invalidate()
    return redirect('/admin')

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
