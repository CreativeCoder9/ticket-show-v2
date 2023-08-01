import os, random, requests
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, roles_required, auth_required, hash_password, permissions_required
from flask_security.models import fsqla_v3 as fsqla


app = Flask(__name__,
            static_folder='static'  # Name of directory for static files
            )

# Variables & Data
error_msg = "Unexpected error occurred!"
success_msg = "Process completed successfully!"

# Custom unauthorized handler
def unauthorized_handler():
    return jsonify({'error': 'Unauthorized access'}), 403

# Upload Directory
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

# App config
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ticketshow.db'
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'pf9Wkove4IKEAXvy-cQkeDPhv9Cb3Ag-wyJILbq_dFw')
app.config['DEBUG'] = True
app.config['SECURITY_PASSWORD_SALT'] = os.environ.get("SECURITY_PASSWORD_SALT", '146585145368132386173505678016728509634')

#initializing Database
db = SQLAlchemy(app)

# Define models
fsqla.FsModels.set_db_info(db)

# Database Moddels
class User(db.Model,  fsqla.FsUserMixin):
  user_name = db.Column(db.String(50), nullable=False)
  email = db.Column(db.String(50), unique=True, nullable=False)
  password = db.Column(db.String, nullable=False)
  booking = db.relationship('Bookings', backref='user', cascade='all')
  fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False)
  confirmed_at = db.Column(db.DateTime())
  active = db.Column(db.Boolean)

# Roles
class Role(db.Model, fsqla.FsRoleMixin):
  pass


class Theatre(db.Model):
  theatre_id = db.Column(db.Integer,
                       primary_key=True,
                       nullable=False,
                       autoincrement=True)
  theatre_name = db.Column(db.String(50))
  theatre_location = db.Column(db.String(50))
  theatre_capacity = db.Column(db.Integer, nullable=False)
  theatre_img = db.Column(db.String(50))
  shows = db.relationship('Show', backref='theatre', cascade='all')


class Show(db.Model):
  show_id = db.Column(db.Integer,
                      primary_key=True,
                      nullable=False,
                      autoincrement=True)
  show_name = db.Column(db.String(50))
  show_rating = db.Column(db.Float, nullable=True)
  show_price = db.Column(db.Integer, nullable=False)
  show_starting_time = db.Column(db.String(50))
  show_ending_time = db.Column(db.String(50))
  show_tags = db.Column(db.String(100))
  show_img = db.Column(db.String(50))
  show_theatre = db.Column(db.Integer,
                         db.ForeignKey('theatre.theatre_id'),
                         nullable=False)
  bookings = db.relationship('Bookings', backref='show', cascade='all')


class Bookings(db.Model):
  booking_id = db.Column(db.Integer,
                         primary_key=True,
                         nullable=False,
                         autoincrement=True)
  booking_user_id = db.Column(db.Integer,
                              db.ForeignKey('user.id'),
                              nullable=False)
  num_bookings = db.Column(db.Integer, nullable=False)
  booking_show_id = db.Column(db.Integer,
                              db.ForeignKey('show.show_id'),
                              nullable=False)
  


# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
app.security = Security(app, user_datastore)


# Creating the database
with app.app_context():
  db.create_all()

#Creating Roles
with app.app_context():
  if not user_datastore.find_role("admin"):
    user_datastore.create_role(name='admin', description='Administrator',  permissions={"user-read", "user-write"})
    db.session.commit()
  if not user_datastore.find_role("admin"):  
    user_datastore.create_role(name='customer', description='Costomer',  permissions={"user-read", "user-write"})
    db.session.commit()

#Creating Admin User
with app.app_context():
  if not user_datastore.find_user(email="admin@ticketshow.in"):
    user_datastore.create_user(id=1, user_name='admin',email="admin@ticketshow.in", password=hash_password("admin"))
    db.session.commit()

# Allowed file types
def allowed_file(filename):
  return '.' in filename and \
         filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
# @roles_required('admin')
# @permissions_required('user-read')
def hello_world():
    return 'Hello World!'

if __name__ == '__main__':
   app.run()