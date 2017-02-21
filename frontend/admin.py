from flask import Flask, redirect, request, render_template
import grid_getter_config

app = Flask(__name__)

@app.route('/admin', methods=['GET'])
def admin():
    config = grid_getter_config.get()
    return render_template("admin.html", url=config.url, auth=config.auth)

@app.route('/admin/set_backend_info', methods=['POST'])
def set_backend_info():
    grid_getter_config.update(request.form['url'], request.form['auth'])
    return redirect('/admin')
