from flask import Flask, redirect, request, render_template
from google.appengine.api import urlfetch
import json

import data_cache
import converter_config

app = Flask(__name__)

@app.route('/convert', methods=['POST'])
def convert():
    image_bdata = request.get_data()

    # if the data are already cached just use that, otherwise query the backend (caching the data
    # if the query succeeds)
    result = data_cache.get(image_bdata)
    if not result:
        success, result = get_data_from_backend(image_bdata)
        if success:
            data_cache.put(image_bdata, result)

    return result

@app.route('/admin', methods=['GET'])
def admin():
    url, auth = converter_config.get()
    return render_template("admin.html", url=url, auth=auth)

@app.route('/admin/set_backend_info', methods=['POST'])
def set_backend_info():
    converter_config.update(request.form['url'], request.form['auth'])
    data_cache.invalidate()
    return redirect('/admin')

def get_data_from_backend(bdata):
    urlfetch.set_default_fetch_deadline(15)
    url, auth = converter_config.get()
    response = json.loads(urlfetch.fetch(
            url=url,
            payload='{"b64data":"' + bdata + '"}',
            method=urlfetch.POST,
            headers={'Content-Type': 'application/json', 'Authorization': auth}).content)

    if not "result" in response:
        return (False, "Backend request failed: " + json.dumps(response))

    response_inner = response["result"]
    if not "b64data" in response_inner or not "ext" in response_inner:
        return (False, "Backend request had malformed response: " + response_inner)

    return (True, json.dumps({"b64data":response_inner["b64data"], "ext":response_inner["ext"]}))
