import os, random, requests, shutil
import pandas as pd
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, roles_required, auth_required, hash_password, permissions_required, current_user
from flask_security.models import fsqla_v3 as fsqla
from flask_caching import Cache
from flask_mail import Mail, Message
from celery import Celery
import pytz
from celery.schedules import crontab

# Initiazation guide
# python3 -m venv .venv
# source .venv/bin/activate
# pip install -r requirements.txt
# run celery -A app.celery beat --max-interval 1 -l info to initiate the scheduler
# celery -A app.celery worker -l info to run the worker



app = Flask(__name__)

# Variables & Data
error_msg = "Unexpected error occurred!"
success_msg = "Process completed successfully!"
trending_queries = []
ist_timezone = pytz.timezone('Asia/Kolkata')
ind_time = datetime.now(ist_timezone).strftime('%Y-%m-%d %H:%M:%S.%f')


# Custom unauthorized handler
def unauthorized_handler():
    return jsonify({'error': 'Unauthorized access'}), 403

#Custom unauthenticated handler
def unauthenticated_handler():
    return jsonify({'error': 'Unauthenticated access'}), 401

# Upload Directory
STATIC_FOLDER = os.path.join(app.root_path, 'static')
UPLOAD_FOLDER = os.path.join(app.root_path, 'static/uploads')

# Custom cache key
def custom_cache_key():
    method = request.method
    if method != 'GET':
       # Don't cache POST, PUT, DELETE requests
       method = str(datetime.now())
    auth_token = request.headers.get('Authorization')
    path = request.path
    query_string = request.query_string.decode('utf-8')
    return str(f'{method}:{auth_token}:{path}?{query_string}')

# App config
app.config['STATIC_FOLDER'] = STATIC_FOLDER
app.config['TEMPLATES_FOLDER'] = 'templates'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ticketshow.db'
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'pf9Wkove4IKEAXvy-cQkeDPhv9Cb3Ag-wyJILbq_dFw')
app.config['DEBUG'] = True
app.config['SECURITY_PASSWORD_SALT'] = os.environ.get("SECURITY_PASSWORD_SALT", '146585145368132386173505678016728509634')
app.config['CACHE_TYPE'] = "RedisCache"
app.config['CACHE_DEFAULT_TIMEOUT'] = 10
app.config['CACHE_REDIS_HOST'] = "redis-17471.c212.ap-south-1-1.ec2.cloud.redislabs.com"
app.config['CACHE_REDIS_PORT'] = 17471
app.config['CACHE_REDIS_PASSWORD'] ="KfA6bc7JwHLWwirIiGDGb6rsz5hbg8oC"
app.config['WTF_CSRF_ENABLED'] = False
app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authorization'
# app.config['SECURITY_TOKEN_MAX_AGE'] = 86400
app.config['SECURITY_URL_PREFIX'] = '/auth'
app.config['CACHE_KEY_PREFIX'] = str(custom_cache_key)
# app.config['REMEMBER_COOKIE_DURATION'] = timedelta(seconds=0)
#set seession expire in 1 second
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(seconds=1)
# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.freesmtpservers.com'
app.config['MAIL_PORT'] = 25
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_DEBUG'] = True
#celery config
app.config['CELERY_BROKER_URL'] = 'redis://:KfA6bc7JwHLWwirIiGDGb6rsz5hbg8oC@redis-17471.c212.ap-south-1-1.ec2.cloud.redislabs.com:17471'
app.config['CELERY_RESULT_BACKEND'] = 'redis://:KfA6bc7JwHLWwirIiGDGb6rsz5hbg8oC@redis-17471.c212.ap-south-1-1.ec2.cloud.redislabs.com:17471'

#https://www.wpoven.com/tools/free-smtp-server-for-testing
# app.config['MAIL_USERNAME'] = 'your_email@example.com'
# app.config['MAIL_PASSWORD'] = 'your_email_password'

#celery workers & configurations
celery = Celery("app")
celery = celery
celery.conf.update(
  broker_url=app.config['CELERY_BROKER_URL'],
  result_backend=app.config['CELERY_RESULT_BACKEND']
)

# creating subclass of task with application context
class ContextTask(celery.Task):
  def __call__(self, *args, **kwargs):
    with app.app_context():
      return self.run(*args, **kwargs)
    
celery.Task = ContextTask

#initializing Database, Caching, mail & task queue
db = SQLAlchemy(app)
cache = Cache(app)
mail = Mail(app)


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
  booked_at = db.Column(db.TIMESTAMP, default=datetime.now(ist_timezone), nullable=False)

  


# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
app.security = Security(app, user_datastore, unauthorized_handler=unauthorized_handler, unauthenticated_handler=unauthenticated_handler)


# Creating the database
with app.app_context():
  db.create_all()

#Creating Roles & Admin User
with app.app_context():
  try:
    if not user_datastore.find_role("admin"):
      user_datastore.create_role(name='admin', description='Administrator',  permissions={"user-read", "user-write"})
      admin_user = user_datastore.create_user(user_name='admin', email="admin@ticketshow.in", password=hash_password("admin"))
      admin_role=user_datastore.find_role("admin")
      user_datastore.add_role_to_user(admin_user, admin_role)

    if not user_datastore.find_role("customer"):  
      admin_role = user_datastore.create_role(name='customer', description='Costomer',  permissions={"user-read", "user-write"})
    
    db.session.commit()
  except Exception as e:
    print(e)
    db.session.rollback()
  

# Default error handler for 405 - Method Not Allowed
@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

#Default error handler for 404 - Not Found
@app.errorhandler(404)
def page_not_found(error):
    return jsonify({"error": "Not Found"}), 404

#Get link to the uploaded file utility api.
@app.route('/api/uploads/geturl', methods=['GET','POST'])
def upload_and_geturl():
  if request.method == 'POST':
    file = request.files['file']
    print(file)
    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    file_url = url_for('static', filename=f'uploads/{filename}', _external=True)
    return jsonify({'status': 'success', 'message': 'File uploaded successfully!', 'file_url':file_url }), 200
  
  if request.method == 'GET':
    return jsonify({'status': 'success', 'message': 'Send a POST request with file to upload!'}), 200
  

# Celery tasks
@celery.task()
def task_add(x, y):
    print(x+y)
    return x + y

#asynchronously send an html email containing the weekly report to the admin
@celery.task()
def task_admin_report(data):
  msg = Message('Weekly report for admin!', sender='admin@ticketshow.in', recipients=['admin@ticketshow.in'])
  msg.html = render_template('admin_report_template.html', stats=data, date=datetime.now())
  mail.send(msg)
  return 'report Sent'

# asynchronously generate report for each user send it to them
@celery.task()
def task_entertainment_report(data):
  recipients = []
  recipients.append(data['user_email'])
  msg = Message('Weekly entertainment report for you!',  sender='admin@ticketshow.in', recipients=recipients)
  msg.html = render_template('user_report_template.html', stats=data, date=datetime.now())
  mail.send(msg)
  return 'report Sent'

# asynchronously generate report for each user send it to them
@celery.task()
def task_monthly_entertainment_report():
  users = User.query.all()
  for user in users:
    user_name = user.user_name
    user_email = user.email
    user_id = user.id

    #Total tickets booked last week
    total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).scalar() or 0
    total_money_spent = db.session.query(db.func.sum(Show.show_price * Bookings.num_bookings)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).scalar() or 0

    if total_tickets_booked == 0:
      total_tickets_booked = 0
      total_money_spent = 0
      favourite_theatre = None
      money_spent_on_favourite_theatre = 0
      top_booked_show_name = None
      top_booked_show_bookings = 0
      top_booked_show_total_tickets_booked = 0

    else:

      #Theatre with highest money spent
      theatre_revenue = db.session.query(Show.show_theatre, db.func.sum(Show.show_price)).filter(Bookings.booking_user_id == user_id).group_by(Show.show_theatre).all()
      print(theatre_revenue)
      top_revenue_theatre = Theatre.query.get_or_404(theatre_revenue[0][0])
      favourite_theatre = top_revenue_theatre.theatre_name
      money_spent_on_favourite_theatre = theatre_revenue[0][1]

      #Highest booked show last week
      show_bookings = db.session.query(Bookings.booking_show_id, db.func.count(Bookings.booking_show_id)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).group_by(Bookings.booking_show_id).all()
      print(show_bookings)
      top_booked_show = Show.query.get_or_404(show_bookings[0][0])
      top_booked_show_id = top_booked_show.show_id
      top_booked_show_name = top_booked_show.show_name
      top_booked_show_bookings = show_bookings[0][1]
      top_booked_show_total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booking_show_id == top_booked_show_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).scalar() or 0
      
    data = {'user_name': user_name, 'user_email': user_email, 'total_tickets_booked': total_tickets_booked, 'total_money_spent': total_money_spent, 'favourite_theatre': favourite_theatre, 'money_spent_on_favourite_theatre': money_spent_on_favourite_theatre, 'top_booked_show_name': top_booked_show_name, 'top_booked_show_bookings': top_booked_show_bookings, 'top_booked_show_total_tickets_booked': top_booked_show_total_tickets_booked}

    recipients = []
    recipients.append(data['user_email'])
    msg = Message('Weekly entertainment report for you!',  sender='admin@ticketshow.in', recipients=recipients)
    msg.html = render_template('user_report_template.html', stats=data, date=datetime.now())
    mail.send(msg)
  return 'monthly report Sent'

# asynchronously Generate theatre CSV
@celery.task()
def task_generate_csv(theatre_id, request_url_root):
    with app.app_context():
      try:
          # Retrieve theatre details from the database
          theatre = Theatre.query.get_or_404(theatre_id)
          shows = Show.query.filter_by(show_theatre=theatre_id).all()
          shows_list = []
          for show in shows:
              shows_list.append({'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre})

          # Create a dictionary for theatre details
          theatre_details = {
              'theatre_id': theatre.theatre_id,
              'theatre_name': theatre.theatre_name,
              'theatre_location': theatre.theatre_location,
              'theatre_capacity': theatre.theatre_capacity,
              'theatre_img': theatre.theatre_img,
              'shows': shows_list
          }

          # dataframe
          df = pd.DataFrame([theatre_details])

          # file path
          report_filename = f'{theatre_id}_report.csv'
          save_path = os.path.join('static', 'reports', report_filename)

          # DataFrame to CSv
          df.to_csv(save_path, index=False)

          report_url = os.path.join(request_url_root, 'static', 'reports', report_filename)

          print(report_url)
          
          return {'report_url': report_url}
      except Exception as e:
          # Log the error for debugging purposes
          print(e)
          return None

#schedule monthly report to users
@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
  sender.add_periodic_task(
    crontab(hour=0, minute=0, day_of_month=1),
    task_monthly_entertainment_report.s(),
    name='monthly report'
  )

@celery.task()
#reminder task to send email to users who haven't booked any tickets in the last 7 days
def booking_reminder():
  try:
    users = User.query.all()
    for user in users:
      user_id = user.id
      user_email = user.email
      user_name = user.user_name
      #Total tickets booked last week
      total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=7))).scalar() or 0
      if total_tickets_booked == 0:
        recipients = []
        recipients.append(user_email)
        msg = Message('Hey, no bookings:(!',recipients=recipients)
        msg.html = render_template('reminder_template.html', user_name=user_name, date=datetime.now())
        mail.send(msg)
      return 'Reminder sent'
  except Exception as e:
    print(e)
    return e
  
#check each day in the evening if the user has booked any tickets in the last week and if not send them a mail.
@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
  sender.add_periodic_task(
    crontab(hour=18, minute=0),
    booking_reminder.s(),
    name='daily report'
  )


#print hello world every 2 seconds
# @celery.on_after_finalize.connect
# def setup_periodic_tasks(sender, **kwargs):
#   sender.add_periodic_task(
#     2.0,
#     task_add.s(1, 2), 
#     name='add every 2'
#   )



@app.route('/', methods=['GET','POST'])
@cache.cached(timeout=60)
# @auth_required("token")
# @cache.memoize(timeout=60)
# @roles_required('admin')
# @permissions_required('user-read')
def home():
  return render_template('index.html')
  # job = task_add.delay(1,2)
  # return jsonify({'status': 'success', 'message': 'Job created successfully!', 'job_id': job.id}), 200


# User Registration
@app.route('/auth/register', methods=['GET','POST'])
@cache.cached(timeout=5)
def register():
  if request.method == 'GET':
    #explanation of how to use the api.
    return jsonify({'status': 'success', 'message': 'Send a POST reqest with email & Password to register!'}), 200
  try:
    response = request.get_json()
    user_name = response['email']
    email = response['email']
    password = response['password']
    user = user_datastore.create_user(user_name=user_name, email=email, password=hash_password(password))
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'User created successfully!'}), 200
  except Exception as e:
    print(e)
    return jsonify({'status': 'error', 'message': "User registration failed!"}, 500)

#login is provided by flask seurity & Logout process has to be done on the client side as only token based authentication is used.


# Creating and Getting all theatres
@app.route('/api/theatres', methods=['GET','POST'])
@cache.cached(timeout=5)
def create_theatre():
    if request.method == 'GET':
      try:
        theatres = Theatre.query.all()
        theatres_list = []
        for theatre in theatres:
          shows = theatre.shows
          shows_list = []
          for show in shows:
            shows_list.append({'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre})
          theatres_list.append({'theatre_id': theatre.theatre_id, 'theatre_name': theatre.theatre_name, 'theatre_location': theatre.theatre_location, 'theatre_capacity': theatre.theatre_capacity, 'theatre_img': theatre.theatre_img, 'shows': shows_list})
        return jsonify({'status': 'success', 'message': 'Theatres fetched successfully!', 'theatres': theatres_list}), 200
      except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': str(e)}), 500
    #Creates a new theatre
    if request.method == 'POST' and current_user.is_authenticated:
      try:
        response = request.get_json()
        theatre_name = response['theatre_name']
        theatre_location = response['theatre_location']
        theatre_capacity = response['theatre_capacity']
        theatre_img = response['theatre_img']
        theatre = Theatre(theatre_name=theatre_name, theatre_location=theatre_location, theatre_capacity=theatre_capacity, theatre_img=theatre_img)
        db.session.add(theatre)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Theatre created successfully!'}), 200
      except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
      return jsonify({'status': 'error', 'message': 'You are not authorized to access this resource!'}), 403
  
  #sample request for creating a theatre
  # {"theatre_name": "PVR", "theatre_location": "Bangalore", "theatre_capacity": 100, "theatre_img": "https://www.pvrcinemas.com/images/pvr-logo.png"}

#update & delete theatre
@app.route('/api/theatres/<int:theatre_id>', methods=['GET','PUT','DELETE'])
@auth_required("token")
@cache.cached(timeout=5)
def update_theatre(theatre_id):

  #returns a theatre with shows list
  if request.method == 'GET':
    try:
      theatre = Theatre.query.filter_by(theatre_id=theatre_id).first()
      shows = Show.query.filter_by(show_theatre=theatre_id).all()
      #serialize shows
      shows_list = []
      for show in shows:
        shows_list.append({'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre})
      return jsonify({'status': 'success', 'message': 'Theatre fetched successfully!', 'theatre': {'theatre_id': theatre.theatre_id, 'theatre_name': theatre.theatre_name, 'theatre_location': theatre.theatre_location, 'theatre_capacity': theatre.theatre_capacity, 'theatre_img': theatre.theatre_img, 'shows': shows_list}}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': 'Theatre doesnot exist!'}), 500
  
    
  #Updates a theatre
  if request.method == 'PUT':
    try:
      response = request.get_json()
      theatre_name = response['theatre_name']
      theatre_location = response['theatre_location']
      theatre_capacity = response['theatre_capacity']
      theatre_img = response['theatre_img']
      theatre = Theatre.query.filter_by(theatre_id=theatre_id).first()
      theatre.theatre_name = theatre_name
      theatre.theatre_location = theatre_location
      theatre.theatre_capacity = theatre_capacity
      if theatre_img !='':
        theatre.theatre_img = theatre_img
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Theatre updated successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}, 500)
    
  #Deletes a theatre
  if request.method == 'DELETE':
    try:
      theatre = Theatre.query.filter_by(theatre_id=theatre_id).first()
      db.session.delete(theatre)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Theatre deleted successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
  
#Get all shows & Create a show
@app.route('/api/shows', methods=['GET','POST'])
@cache.cached(timeout=5)
def show():
  if request.method == 'GET':
    #returns all the shows
    try:
      shows = Show.query.all()
      shows_list = []
      for show in shows:
        shows_list.append({'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre})
      return jsonify({'status': 'success', 'message': 'Shows fetched successfully!', 'shows': shows_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

  #Creates a new show
  elif request.method == 'POST':
    try:
      response = request.get_json()
      show_name = response['show_name']
      show_rating = response['show_rating']
      show_price = response['show_price']
      show_starting_time = response['show_starting_time']
      show_ending_time = response['show_ending_time']
      show_tags = response['show_tags']
      show_img = response['show_img']
      show_theatre = response['show_theatre']
      #check if theatre exists
      try:
        theatre = Theatre.query.get_or_404(show_theatre)
      except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': 'Theatre does not exist!'}), 400
      show = Show(show_name=show_name, show_rating=show_rating, show_price=show_price, show_starting_time=show_starting_time, show_ending_time=show_ending_time, show_tags=show_tags, show_img=show_img, show_theatre=show_theatre)
      db.session.add(show)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Show created successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
  else:
    return jsonify({'status': 'error', 'message': 'You are not authorized to access this resource!'}), 403
  
#sample request for creating a show
# {"show_name": "Avengers", "show_rating": 4.5, "show_price": 500, "show_starting_time": "10:00 AM", "show_ending_time": "12:00 PM", "show_tags": "Action, Adventure", "show_img": "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_End" }

#Get, update & delete a show
@app.route('/api/shows/<int:show_id>', methods=['GET','PUT','DELETE'])
@auth_required("token")
@cache.cached(timeout=60)
def update_show(show_id):
  #returns a show
  if request.method == 'GET':
    try:
      show = Show.query.filter_by(show_id=show_id).first()
      return jsonify({'status': 'success', 'message': 'Show fetched successfully!', 'show': {'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre}}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
    
  #Updates a show
  if request.method == 'PUT':
    try:
      response = request.get_json()
      show_name = response['show_name']
      show_rating = response['show_rating']
      show_price = response['show_price']
      show_starting_time = response['show_starting_time']
      show_ending_time = response['show_ending_time']
      show_tags = response['show_tags']
      show_img = response['show_img']
      show_theatre = response['show_theatre']
      show = Show.query.filter_by(show_id=show_id).first()
      show.show_name = show_name
      show.show_rating = show_rating
      show.show_price = show_price
      show.show_starting_time = show_starting_time
      show.show_ending_time = show_ending_time
      show.show_tags = show_tags
      if show_img !='':
        show.show_img = show_img
      show.show_theatre = show_theatre
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Show updated successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}, 500)
    
  #Deletes a show
  if request.method == 'DELETE':
    try:
      show = Show.query.filter_by(show_id=show_id).first()
      db.session.delete(show)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Show deleted successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
  
#Get all bookings & Create a booking
@app.route('/api/bookings', methods=['GET','POST'])
@auth_required("token")
@cache.cached(timeout=5)
def booking():
  if request.method == 'GET':
    try:
      bookings = Bookings.query.all()
      bookings_list = []
      for booking in bookings:
        if current_user.id != booking.booking_user_id:
          continue
        show = Show.query.get_or_404(booking.booking_show_id)
        theatre = Theatre.query.get_or_404(show.show_theatre)
        bookings_list.append({'booking_id': booking.booking_id,'booked_at':booking.booked_at.strftime("%a, %d %b %Y %H:%M:%S %Z"), 'booking_user_id': booking.booking_user_id, 'num_bookings': booking.num_bookings, 'booking_show_id': booking.booking_show_id, 'show_name':show.show_name, 'theatre_name': theatre.theatre_name, 'theatre_location': theatre.theatre_location})
      return jsonify({'status': 'success', 'message': 'Bookings fetched successfully!', 'bookings': bookings_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

  #Creates a new booking
  if request.method == 'POST':
    try:
      response = request.get_json()
      booking_user_id = current_user.id
      num_bookings = int(response['num_bookings'])
      booking_show_id = response['booking_show_id']
      show = Show.query.get_or_404(booking_show_id)
      theatre = Theatre.query.get_or_404(show.show_theatre)
      capacity = theatre.theatre_capacity
      num_shows = len(theatre.shows)
      seats = capacity // num_shows
      total_bookings = db.session.query(db.func.sum(Bookings.num_bookings)).\
                filter(Bookings.booking_show_id == booking_show_id).scalar() or 0
      available_seats = int(seats) - total_bookings - num_bookings

      if num_bookings < 1:
        return jsonify({'status': 'error', 'message': 'Invalid number of bookings!'}), 400
      
      #Show Housefull
      if available_seats < 0:
        return jsonify({'status': 'error', 'message': 'No seats available!'}), 400
      ticket_price = show.show_price

      total_bookings = total_bookings + int(num_bookings)

      #Dynamic Pricing
      if total_bookings > seats // 2:
        ticket_price = ticket_price + 50
      elif total_bookings > seats * 0.85:
        ticket_price = ticket_price + 100
      else:
        ticket_price = ticket_price

      #Update the show price
      show.show_price = ticket_price

      booking = Bookings(booking_user_id=booking_user_id, num_bookings=num_bookings, booking_show_id=booking_show_id)
      db.session.add(booking)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Booking created successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
  
#sample request for creating a booking
# {"booking_user_id": 1, "num_bookings": 2, "booking_show_id": 1}

#Get current logged in user details
@app.route('/api/user', methods=['GET','POST'])
@auth_required("token")
@cache.cached(timeout=60)
def user_details():
  if request.method == 'GET' and current_user.is_authenticated:
    try:
      user = User.query.filter_by(id=current_user.id).first()
      return jsonify({'status': 'success', 'message': 'User fetched successfully!', 'user': {'id': user.id, 'user_name': user.user_name}}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}, 500)
  else:
    return jsonify({'status': 'error', 'message': 'You are not authorized to access this resource!'}), 403


#Get, update & delete bookings by user
@app.route('/api/bookings/user/<int:user_id>', methods=['GET','DELETE'])
@auth_required("token")
@cache.cached()
def update_booking(user_id):

  #returns a user's bookings
  if request.method == 'GET':
    if current_user.id != user_id:
      return jsonify({'status': 'error', 'message': 'You are not authorized to access this resource!'}), 403
    try:
      bookings = Bookings.query.filter_by(booking_user_id=user_id).all()
      bookings_list = []
      for booking in bookings:
        bookings_list.append({'booking_id': booking.booking_id, 'booking_user_id': booking.booking_user_id, 'num_bookings': booking.num_bookings, 'booking_show_id': booking.booking_show_id})
      return jsonify({'status': 'success', 'message': 'Bookings fetched successfully!', 'bookings': bookings_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
    
  #Deletes a booking
  if request.method == 'DELETE':
    if current_user.id != user_id:
      return jsonify({'status': 'error', 'message': 'You are not authorized to access this resource!'}), 403
    try:
      booking = Bookings.query.filter_by(booking_user_id=user_id).first()
      db.session.delete(booking)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'Booking deleted successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

#Get all users & Create a user
@app.route('/api/users', methods=['GET','POST'])
@auth_required("token")
@roles_required('admin')
@cache.cached(timeout=5)
def user_info():
  if request.method == 'GET':
    #returns all the users
    try:
      users = User.query.all()
      users_list = []
      for user in users:
        users_list.append({'id': user.id, 'user_name': user.user_name, 'email': user.email, 'password': user.password})
      return jsonify({'status': 'success', 'message': 'Users fetched successfully!', 'users': users_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

#Get, update & delete a user
@app.route('/api/users/<int:user_id>', methods=['GET','PUT','DELETE'])
@auth_required("token")
@roles_required('admin')
@cache.cached(timeout=5)
def update_user(user_id):
  #get a user
  if request.method == 'GET':
    user = User.query.filter_by(id=user_id).first()
    user_roles = user.roles
    roles_list = []
    for role in user_roles:
      roles_list.append({'id': role.id, 'name': role.name, 'description': role.description, 'permissions': role.permissions})

    return jsonify({'status': 'success', 'message': 'User fetched successfully!', 'user': {'id': user.id, 'user_name': user.user_name, 'email': user.email, 'user_role': roles_list}}), 200
  
  #update a user
  if request.method == 'PUT':
    try:
      response = request.get_json()
      user_name = response['user_name']
      email = response['email']
      password = response['password']
      user = User.query.filter_by(id=user_id).first()
      user.user_name = user_name
      user.email = email
      user.password = hash_password(password)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'User updated successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}, 500)
  
  #delete a user
  if request.method == 'DELETE':
    try:
      user = User.query.filter_by(id=user_id).first()
      db.session.delete(user)
      db.session.commit()
      return jsonify({'status': 'success', 'message': 'User deleted successfully!'}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
    
#get current user's role
@app.route('/api/user/roles', methods=['GET'])
@auth_required("token")
@cache.cached(timeout=5)
def user_roles():
  if request.method == 'GET':
    try:
      user = User.query.filter_by(id=current_user.id).first()
      user_roles = user.roles
      roles_list = []
      for role in user_roles:
        roles_list.append({'id': role.id, 'name': role.name, 'description': role.description, 'permissions': role.permissions})
      return jsonify({'status': 'success', 'message': 'User fetched successfully!', 'user_role': roles_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}, 500)

#Search for a show
@app.route('/api/search/shows', methods=['POST'])
def search():
  if request.method == 'POST':
    try:
      response = request.get_json()
      search_query = response['search_query']
      trending_queries.append(search_query)
      shows = Show.query.filter(
      (Show.show_name.like(f"%{search_query}%"))
      | (Show.show_tags.like(f"%{search_query}%"))).all()
      shows_list = []
      for show in shows:
        shows_list.append({'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre})
      return jsonify({'status': 'success', 'message': 'Shows fetched successfully!', 'shows': shows_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

#Sample request for search
# {"search_query": "Avengers"}

#Search for a theatre
@app.route('/api/search/theatres', methods=['POST'])
def search_theatre():
  if request.method == 'POST':
    try:
      response = request.get_json()
      search_query = response['search_query']
      theatres = Theatre.query.filter(
      (Theatre.theatre_name.like(f"%{search_query}%"))
      | (Theatre.theatre_location.like(f"%{search_query}%"))).all()
      theatres_list = []
      for theatre in theatres:
        theatres_list.append({'theatre_id': theatre.theatre_id, 'theatre_name': theatre.theatre_name, 'theatre_location': theatre.theatre_location, 'theatre_capacity': theatre.theatre_capacity, 'theatre_img': theatre.theatre_img})
      return jsonify({'status': 'success', 'message': 'Theatres fetched successfully!', 'theatres': theatres_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

#filter shows by time
@app.route('/api/shows/filter', methods=['POST'])
def filter_shows():
  if request.method == 'POST':
    try:
      response = request.get_json()
      show_starting_time = response['show_starting_time']
      show_ending_time = response['show_ending_time']
      shows = Show.query.filter(
      (Show.show_starting_time >= show_starting_time)
      & (Show.show_ending_time <= show_ending_time)).all()
      shows_list = []
      for show in shows:
        shows_list.append({'show_id': show.show_id, 'show_name': show.show_name, 'show_rating': show.show_rating, 'show_price': show.show_price, 'show_starting_time': show.show_starting_time, 'show_ending_time': show.show_ending_time, 'show_tags': show.show_tags, 'show_img': show.show_img, 'show_theatre': show.show_theatre})
      return jsonify({'status': 'success', 'message': 'Shows fetched successfully!', 'shows': shows_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500

#Sample request for filter
# {"show_starting_time": "10:00 AM", "show_ending_time": "12:00 PM"}

#booking details by show
@app.route('/api/bookings/show/<int:show_id>', methods=['GET'])
@auth_required("token")
@cache.memoize(timeout=60)
def booking_details(show_id):
  if request.method == 'GET':
    try:
      bookings = Bookings.query.filter_by(booking_show_id=show_id).all()
      total_bookings = db.session.query(db.func.sum(Bookings.num_bookings)).\
                filter(Bookings.booking_show_id == show_id).scalar() or 0
      bookings_list = []
      for booking in bookings:
        bookings_list.append({'booking_id': booking.booking_id, 'booking_user_id': booking.booking_user_id, 'num_bookings': booking.num_bookings, 'booking_show_id': booking.booking_show_id})
      return jsonify({'status': 'success', 'message': 'Bookings fetched successfully!', 'bookings': bookings_list, 'total_bookings':total_bookings}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500



#Statistics for admin
@app.route('/api/stats', methods=['GET'])
@cache.memoize(timeout=60)
def stats():
  if request.method == 'GET':
    try:
      #theatre with highest revenue generated last week
      last_week_bookings = Bookings.query.filter(Bookings.booked_at >= (datetime.now() - timedelta(days=7))).all()
      # print(last_week_bookings)

      #Total tickets booked last week
      total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=7))).scalar() or 0
      total_revenue = db.session.query(db.func.sum(Show.show_price * Bookings.num_bookings)).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=7))).scalar() or 0

      #Serializing tota
      
      #Theatre with highest revenue generated
      theatre_revenue = db.session.query(Show.show_theatre, db.func.sum(Show.show_price)).group_by(Show.show_theatre).all()
      print(theatre_revenue)
      top_revenue_theatre = Theatre.query.get_or_404(theatre_revenue[0][0])
      top_revenue_theatre_name = top_revenue_theatre.theatre_name
      top_revenue_amount = theatre_revenue[0][1]

      #Highest booked show last week
      show_bookings = db.session.query(Bookings.booking_show_id, db.func.count(Bookings.booking_show_id)).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=7))).group_by(Bookings.booking_show_id).all()
      print(show_bookings)
      top_booked_show = Show.query.get_or_404(show_bookings[0][0])
      top_booked_show_id = top_booked_show.show_id
      top_booked_show_name = top_booked_show.show_name
      top_booked_show_bookings = show_bookings[0][1]
      top_booked_show_total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booking_show_id == top_booked_show_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=7))).scalar() or 0


      #if there are 5 continuous bookings for a show, it is going to be popular
      last_20_bookings = Bookings.query.order_by(Bookings.booked_at.desc()).limit(20).all()
      print(last_20_bookings)
      #check if there are 5 continuous bookings for a show
      trending_shows = []
      if len(last_20_bookings) > 5:
        for i in range(len(last_20_bookings)-5):
          if last_20_bookings[i].booking_show_id == last_20_bookings[i+1].booking_show_id == last_20_bookings[i+2].booking_show_id == last_20_bookings[i+3].booking_show_id == last_20_bookings[i+4].booking_show_id:
            show = Show.query.get_or_404(last_20_bookings[i].booking_show_id)
            theatre = Theatre.query.get_or_404(show.show_theatre)
            trending_shows.append({'show_name': show.show_name, 'theatre_name': theatre.theatre_name})
      print(trending_shows)

      #10 trending queries
      trending_queries_list = trending_queries[-10:]

      data = {'total_tickets_booked': total_tickets_booked, 'total_revenue': total_revenue, 'top_revenue_theatre_name': top_revenue_theatre_name, 'top_revenue_amount': top_revenue_amount, 'top_booked_show_name': top_booked_show_name, 'top_booked_show_bookings': top_booked_show_bookings, 'top_booked_show_total_tickets_booked': top_booked_show_total_tickets_booked, 'trending_shows': trending_shows, 'trending_queries': trending_queries_list}
      job = task_admin_report.delay(data)
      print(job.id)
      return jsonify({'status': 'success', 'message': 'Stats fetched successfully!', 'total_tickets_booked': total_tickets_booked, 'total_revenue': total_revenue, 'top_revenue_theatre_name': top_revenue_theatre_name, 'top_revenue_amount': top_revenue_amount, 'top_booked_show_name': top_booked_show_name, 'top_booked_show_bookings': top_booked_show_bookings, 'top_booked_show_total_tickets_booked': top_booked_show_total_tickets_booked, 'trending_shows': trending_shows, 'trending_queries': trending_queries_list}), 200
    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
    
#Statistics for each user
@app.route('/api/stats/user/<int:user_id>', methods=['GET'])
@cache.memoize(timeout=60)
def stats_by_user(user_id):
  if request.method == 'GET':
    try:
      #user details
      user = User.query.filter_by(id=user_id).first()
      user_name = user.user_name
      user_email = user.email
      
      #Total tickets booked last week
      total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=20))).scalar() or 0
      total_money_spent = db.session.query(db.func.sum(Show.show_price * Bookings.num_bookings)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).scalar() or 0

      if total_tickets_booked == 0:
        total_money_spent = 0
        favourite_theatre = None
        money_spent_on_favourite_theatre = 0
        top_booked_show_name = None
        top_booked_show_bookings = 0
        top_booked_show_total_tickets_booked = 0
      else:
        #Theatre with highest money spent
        theatre_revenue = db.session.query(Show.show_theatre, db.func.sum(Show.show_price)).filter(Bookings.booking_user_id == user_id).group_by(Show.show_theatre).all()
        print(theatre_revenue)
        top_revenue_theatre = Theatre.query.get_or_404(theatre_revenue[0][0])
        favourite_theatre = top_revenue_theatre.theatre_name
        money_spent_on_favourite_theatre = theatre_revenue[0][1]

        #Highest booked show last week
        show_bookings = db.session.query(Bookings.booking_show_id, db.func.count(Bookings.booking_show_id)).filter(Bookings.booking_user_id == user_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).group_by(Bookings.booking_show_id).all()
        print(show_bookings)
        top_booked_show = Show.query.get_or_404(show_bookings[0][0])
        top_booked_show_id = top_booked_show.show_id
        top_booked_show_name = top_booked_show.show_name
        top_booked_show_bookings = show_bookings[0][1]
        top_booked_show_total_tickets_booked = db.session.query(db.func.sum(Bookings.num_bookings)).filter(Bookings.booking_show_id == top_booked_show_id).filter(Bookings.booked_at >= (datetime.now() - timedelta(days=30))).scalar() or 0
        
      data = {'user_name': user_name, 'user_email': user_email, 'total_tickets_booked': total_tickets_booked, 'total_money_spent': total_money_spent, 'favourite_theatre': favourite_theatre, 'money_spent_on_favourite_theatre': money_spent_on_favourite_theatre, 'top_booked_show_name': top_booked_show_name, 'top_booked_show_bookings': top_booked_show_bookings, 'top_booked_show_total_tickets_booked': top_booked_show_total_tickets_booked}
      job = task_entertainment_report.delay(data)
      print(job.id)
      return jsonify({'status': 'success', 'message': 'Stats fetched successfully!', 'user_name': user_name, 'user_email': user_email, 'total_tickets_booked': total_tickets_booked, 'total_money_spent': total_money_spent, 'favourite_theatre': favourite_theatre, 'money_spent_on_favourite_theatre': money_spent_on_favourite_theatre, 'top_booked_show_name': top_booked_show_name, 'top_booked_show_bookings': top_booked_show_bookings, 'top_booked_show_total_tickets_booked': top_booked_show_total_tickets_booked}), 200

    except Exception as e:
      print(e)
      return jsonify({'status': 'error', 'message': str(e)}), 500
    
#Theatre report
@app.route('/api/theatres/<int:theatre_id>/report', methods=['GET'])
# @cache.memoize(timeout=60)
def generate_report(theatre_id):
    if request.method == 'GET':
        try:
          request_url_root=request.url_root
          job = task_generate_csv.apply_async(args=[theatre_id, request_url_root])
          result = job.wait()
          #get response from task
          print(result)
          return jsonify({'status': 'success', 'message': 'Report generated successfully!', 'report_url':result['report_url']}), 200

        except Exception as e:
          print(e)
          return jsonify({'status': 'error', 'message': str(e)}), 500






if __name__ == '__main__':
  # set port and debug mode from .env
  app.run(debug=True, port=5000)