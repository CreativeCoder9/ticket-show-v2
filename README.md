# TicketShow - Online Theatre Booking System

A full-stack web application for booking theatre show tickets, built with Flask and Vue.js as part of a Modern Application Development (MAD) course project.

## Features

### For Customers
- Browse available theatres and shows
- Search and filter shows by name, theatre, location, or tags
- Book tickets with real-time seat availability
- Dynamic pricing based on demand
- View booking history and personal statistics
- Receive monthly entertainment reports via email
- Get booking reminders if inactive

### For Admins
- Manage theatres (create, update, delete)
- Manage shows (create, update, delete)
- View analytics dashboard with last 7 days statistics
- Generate CSV reports for theatres
- Monitor bookings across all shows

### Technical Features
- Token-based authentication with role-based access control
- Redis caching for improved performance
- Asynchronous task processing with Celery
- Scheduled background jobs for reports and reminders
- HTML-formatted email notifications
- RESTful API architecture
- Responsive single-page application (SPA)
- Cloud deployment on Azure App Service

## Technology Stack

### Backend
- **Framework**: Flask 2.3.2
- **Database**: SQLite with SQLAlchemy 2.0.19 ORM
- **Authentication**: Flask-Security-Too 5.3.0
- **Task Queue**: Celery 5.3.4 with Redis broker
- **Caching**: Flask-Caching 2.0.2 (Redis backend)
- **Email**: Flask-Mail 0.9.1
- **Data Processing**: Pandas 2.1.1, NumPy 1.26.0
- **Server**: Gunicorn 21.2.0

### Frontend
- **Framework**: Vue.js 2.6.14
- **Router**: Vue Router 2.0.0
- **UI Framework**: Bootstrap 5.3.0
- **Icons**: Bootstrap Icons 1.5.0
- **Animations**: Lottie Files

### Infrastructure
- **Cache & Queue**: Redis (cloud hosted)
- **CI/CD**: GitHub Actions
- **Deployment**: Azure App Service

## Installation

### Prerequisites
- Python 3.8 or higher
- Redis server (local or cloud instance)
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/CreativeCoder9/mad-2.git
cd mad-2
```

2. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables (create a `.env` file or set manually):
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Email Configuration (optional, for email features)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Flask Configuration
SECRET_KEY=your-secret-key-here
SECURITY_PASSWORD_SALT=your-salt-here
```

## Running the Application

### 1. Start Redis (if running locally)
```bash
redis-server
```

### 2. Run the Flask Application
```bash
python app.py
```

The application will be available at `http://localhost:5000`

### 3. Start Celery Worker (for background tasks)
```bash
celery -A app.celery worker -l info
```

### 4. Start Celery Beat Scheduler (for periodic tasks)
```bash
celery -A app.celery beat --max-interval 1 -l info
```

### Production Deployment
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Project Structure

```
mad-2/
├── app.py                          # Main Flask application with all routes and models
├── requirements.txt                # Python dependencies
├── templates/
│   ├── index.html                  # Main SPA template
│   ├── admin_report_template.html  # Admin email template
│   ├── user_report_template.html   # User report email template
│   └── reminder_template.html      # Reminder email template
├── static/
│   ├── app.js                      # Vue.js router configuration
│   ├── components/                 # Vue.js components
│   │   ├── home.js                 # Landing page
│   │   ├── login.js                # Login page
│   │   ├── register.js             # Registration page
│   │   ├── dashboard.js            # User dashboard
│   │   ├── theatre.js              # Theatre details
│   │   ├── show.js                 # Show details and booking
│   │   ├── bookings.js             # Booking management
│   │   ├── confirm-bookings.js     # Booking confirmation
│   │   ├── admin.js                # Admin dashboard
│   │   ├── add-theatre.js          # Add theatre (admin)
│   │   ├── add-show.js             # Add show (admin)
│   │   ├── update-theatre.js       # Edit theatre (admin)
│   │   └── update-show.js          # Edit show (admin)
│   ├── css/                        # Stylesheets
│   ├── images/                     # Static images
│   ├── uploads/                    # User uploaded files
│   └── reports/                    # Generated CSV reports
└── .github/workflows/
    └── main_ticketshowv2.yml       # Azure deployment workflow
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user

### Users
- `GET /api/user` - Get current user details
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user
- `GET /api/user/roles` - Get user roles

### Theatres
- `GET /api/theatres` - List all theatres
- `POST /api/theatres` - Create new theatre (admin only)
- `GET /api/theatres/<id>` - Get theatre details
- `PUT /api/theatres/<id>` - Update theatre (admin only)
- `DELETE /api/theatres/<id>` - Delete theatre (admin only)
- `GET /api/theatres/<id>/report` - Generate CSV report for theatre

### Shows
- `GET /api/shows` - List all shows
- `POST /api/shows` - Create new show (admin only)
- `GET /api/shows/<id>` - Get show details
- `PUT /api/shows/<id>` - Update show (admin only)
- `DELETE /api/shows/<id>` - Delete show (admin only)
- `POST /api/shows/filter` - Filter shows by criteria

### Bookings
- `GET /api/bookings` - List all bookings (admin only)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/user/<id>` - Get user's bookings
- `DELETE /api/bookings/user/<id>` - Delete booking
- `GET /api/bookings/show/<id>` - Get bookings for show

### Search
- `POST /api/search/shows` - Search shows by name, theatre, or tags
- `POST /api/search/theatres` - Search theatres by name or location

### Analytics
- `GET /api/stats` - Get admin statistics (last 7 days)
- `GET /api/stats/user/<id>` - Get user statistics

### Utilities
- `GET /api/uploads/geturl` - Get upload URL for files
- `POST /api/uploads/geturl` - Upload files (images)

## Key Functionalities

### Dynamic Pricing
Ticket prices automatically adjust based on booking demand:
- Base price when availability > 50%
- Base price + 50 when availability 15-50%
- Base price + 100 when availability < 15%

### Background Tasks (Celery)
- **Monthly Entertainment Report**: Sends weekly reports to all users with booking statistics, favorite theatre, and top show
- **Booking Reminder**: Daily emails at 6 PM to users who haven't booked in the last 7 days
- **CSV Report Generation**: Asynchronous generation of theatre reports

### Security
- Token-based authentication
- Role-based access control (Admin/Customer)
- Password hashing with bcrypt
- Protected admin routes

## Database Models

- **User** - User accounts and authentication
- **Role** - User roles (admin, customer)
- **Theatre** - Theatre information (name, location, capacity)
- **Show** - Show details (name, rating, price, timing, tags)
- **Bookings** - Ticket bookings linking users to shows

## Development

### Database Initialization
The application automatically creates the database and tables on first run. An admin user is created with default credentials (check `app.py` for details).

### Running Tests
```bash
# Add test commands here when tests are implemented
```

### Code Structure
The application follows a monolithic architecture with all backend logic in `app.py` and frontend components in the `static/components/` directory. The frontend is a Vue.js Single Page Application (SPA) that communicates with the Flask backend via REST API.

## Deployment

The application is configured for deployment on Azure App Service using GitHub Actions. The workflow file is located at `.github/workflows/main_ticketshowv2.yml`.

### Deployment Steps
1. Push changes to the repository
2. GitHub Actions automatically triggers the workflow
3. Application is built and deployed to Azure
4. Redis connection is established with cloud Redis instance

## Environment Variables

Required environment variables:
- `REDIS_URL` - Redis connection URL
- `SECRET_KEY` - Flask secret key
- `SECURITY_PASSWORD_SALT` - Password salt for Flask-Security

Optional (for email features):
- `MAIL_SERVER` - SMTP server address
- `MAIL_PORT` - SMTP port
- `MAIL_USE_TLS` - Use TLS (True/False)
- `MAIL_USERNAME` - Email username
- `MAIL_PASSWORD` - Email password

## License

This project is part of a Modern Application Development (MAD) course.

## Contributing

This is an academic project. Contributions should follow standard coding practices and maintain the existing architecture.
