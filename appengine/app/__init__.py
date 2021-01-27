import app.main

from .app import app, db

# Now that all the models have been imported, create the tables.
db.create_all()
