from flask import Markup, Flask, redirect, request, render_template
from google.appengine.api import urlfetch
import base64

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

    # TODO: Talk to the actual server
    data = urlfetch.fetch(
            #url="http://cw-mungo.appspot.com/tmpdata",
            url="http://localhost:8080/tmpdata",
            payload="hello there!",
            method=urlfetch.POST,
            headers={'Content-Type': 'text/html'}).content

    return render_template(
            "cw.html",
            image_data='data:image/' + ext + ';base64,' + base64.b64encode(file.read()),
            cw_data=data)

@app.route('/tmpdata', methods=['POST'])
def tmp_data():
    return render_template("data.txt")
