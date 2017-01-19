from flask import Markup, Flask, redirect, request, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def cw_mungo():
    return render_template("welcome.html")

@app.route('/go', methods=['POST'])
def go():
    if 'image_file' not in request.files:
        return redirect('/')
    file = request.files['image_file']
    return file.filename
#http://flask.pocoo.org/docs/0.12/patterns/fileuploads/
