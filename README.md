# NSBM SportsHub — Group 9

**Web and Mobile Application Development (WAD) — Batch 26.1 IFSL**  
Faculty of Computing, NSBM Green University

NSBM SportsHub is a campus sports management web application developed for the WAD group project. It brings sports club membership, facility bookings, announcements, and equipment management into one application with student and administrator interfaces.

- **Selected topic:** Topic 3 — NSBM SportsHub: Sports Club Management System
- **Live application:** [sportwebdeply.vercel.app](https://sportwebdeply.vercel.app/)
- **Source repository:** [Ckstr-arch/WAD-Group-9](https://github.com/Ckstr-arch/WAD-Group-9)

## Group Members

| Student ID | Name |
| --- | --- |
| 42006 | Thilakarathna K P S I |
| 41480 | Wishvakeerthi T A O D |
| 42294 | Hansajith M A S S |
| 41724 | LBCS Bandarage |
| 41641 | Adikari A A P E |
| 42749 | EkanayakaEMS |
| 41707 | Sampath kd |
| 42241 | EKANAYAKE E M J B |

## Objectives

- Provide a central place for students to access campus sports services.
- Support sports club membership requests and administrator approvals.
- Simplify facility booking requests and their management.
- Publish sports announcements and provide access to training and tournament information.
- Give administrators tools to manage student accounts and equipment stock.
- Integrate an HTML, CSS, and JavaScript frontend with a PHP and MySQL backend.

## Features

### Login and Authentication

- Email and password sign-in with validation and inline error feedback.
- Password visibility control and responsive login layout.
- Password-hash verification, active-account checks, and PHP sessions.
- Dashboard routing based on the account role.
- Authentication API operations for login, session checks, and logout.

### Student Interface

- Dashboard layout for memberships, bookings, and sports announcements.
- Sports club browsing and membership requests.
- Facility booking requests.
- Navigation to training schedules and tournament information.

### Administrator Interface

- Register, search, filter, and delete student accounts, with protection for designated accounts.
- Set student account passwords.
- Review facility bookings and update their status.
- Create sports clubs and approve or reject membership requests.
- Publish announcements.
- Add equipment items and update total and issued stock.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS, vanilla JavaScript |
| Backend | PHP with JSON API endpoints |
| Database | MySQL, accessed through PDO |
| Authentication | PHP sessions and PHP password-hashing functions |
| Deployment | Vercel, using the PHP runtime configured in `vercel.json`, with an external database |
| Version control | Git and GitHub |

## Admin Credentials

Use the following supplied account for the hosted project demonstration:

| Field | Value |
| --- | --- |
| Email | `admin@nsbmsport.ac.lk` |
| Password | `Admin005@Nsbm@-1257*#` |

These are the supplied hosted-demo credentials. Creating a local database does not automatically create this account; follow the local account setup below.

## Project Structure

```text
WAD-Group-9/
├── public_html/                       # Application web root
│   ├── index.html                    # Main login page
│   ├── index.css                     # Login styling
│   ├── login.js                      # Login requests and dashboard routing
│   ├── login.html                    # Redirect to the main login page
│   ├── student-dashboard.html        # Student interface
│   ├── student-dashboard.css
│   ├── student-dashboard.js
│   ├── admin-dashboard.html          # Administrator interface
│   ├── admin-dashboard.css
│   ├── admin-dashboard.js
│   ├── clubs.html                    # Club browsing and membership interface
│   ├── book-facilities.html          # Facility booking interface
│   ├── training-schedule.html        # Training information
│   ├── tournaments.html              # Tournament information
│   ├── assets/                       # Images and other visual assets
│   ├── services/                     # Shared-module placeholders
│   └── backend/
│       ├── api/                      # auth, students, clubs, bookings,
│       │                             # announcements, and inventory endpoints
│       └── config/
│           └── database.php          # PDO connection and backend helpers
├── database/
│   ├── schema.sql                    # Database tables and relationships
│   ├── seed.sql                      # Development sample data
│   └── seed-passwords.php            # Development password-hash helper
├── CONTRIBUTING.md                   # Team Git workflow
├── vercel.json                       # Deployment builds and routing
└── README.md
```

The tree highlights the main application files; supporting page styles and scripts are also located in `public_html`.

## Local Setup

### Prerequisites

- Git.
- PHP 8.1 or later with the `pdo_mysql` and `mbstring` extensions enabled.
- A running MySQL server and a database account with a non-empty password.
- A web browser.

The frontend does not require an npm build. PHP must serve the application for the backend endpoints to work.

### 1. Clone the repository

```bash
git clone https://github.com/Ckstr-arch/WAD-Group-9.git
cd WAD-Group-9
```

### 2. Create the database

From the repository root, open the MySQL client:

```bash
mysql -u root -p
```

Run the following inside the MySQL client:

```sql
CREATE DATABASE sportshub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sportshub;
SOURCE database/schema.sql;
```

`database/seed.sql` contains optional development data and different account emails from the hosted demo. Review it before importing: the `@hardcodedAdminHash` assignment is a placeholder that requires a valid password hash. The setup below creates a local admin without relying on the seed file.

### 3. Create a local administrator

In a terminal, generate a hash for a password of your choice. Replace the sample password before running:

```bash
php -r "echo password_hash('choose-a-local-password', PASSWORD_DEFAULT), PHP_EOL;"
```

In the MySQL client, replace `PASTE_GENERATED_HASH_HERE` with the generated output, then run:

```sql
USE sportshub;
INSERT INTO users (student_id, name, email, password_hash, role, avatar_initials, is_active)
VALUES ('ADMIN001', 'SportsHub Admin', 'admin@nsbmsport.ac.lk',
        'PASTE_GENERATED_HASH_HERE', 'super_admin', 'SA', 1);
```

Sign in locally with this email and the password you selected. Student accounts can then be created through the administrator interface.

### 4. Configure the database connection

The current backend reads environment variables directly. Set them in the terminal that will start PHP. For PowerShell:

```powershell
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_NAME = 'sportshub'
$env:DB_USER = 'your_mysql_username'
$env:DB_PASS = 'your_mysql_password'
```

Replace the username and password with your database account details. `DB_PASSWORD` is also accepted as an alternative to `DB_PASS`. If required by the database provider, `DB_SSL_CA` can specify the path to a CA certificate file.

The current configuration does not automatically load `.env` or `env.local.php`; copying a configuration template alone will not configure the connection.

### 5. Start the application

From the repository root, in the same terminal:

```bash
php -S localhost:8000 -t public_html
```

Open [http://localhost:8000](http://localhost:8000). To check whether the authentication endpoint responds, open [http://localhost:8000/backend/api/auth.php](http://localhost:8000/backend/api/auth.php). Before login, it should return JSON with `authenticated: false`.

## Deployment

The repository's `vercel.json` serves frontend assets from `public_html` and builds PHP endpoints from `public_html/backend/api`. The database must be configured separately using the environment variables listed above.

The application can also be served by a PHP-capable host with `public_html` as the document root. Import the database schema and configure the database connection on that host.

## Implementation Notes

- Public student self-registration and student self-service password recovery are not implemented; administrators manage student accounts.
- Training and tournament pages do not have corresponding management API endpoints in this repository.
- The reviewed local student dashboard differs from the hosted version. Its imported `services/api.js` and `services/guard.js` are placeholders, so its dashboard integration needs completion or synchronization with the deployed version.
- Authentication includes password verification and PHP sessions, but access control needs further work: the backend has a client-supplied user-ID fallback, and role handling is not consistent for `club_manager`.

## Contributing

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the team's workflow. Work on a feature branch, use meaningful commits, and open a pull request into `main`. Each member should commit their own work so the contribution history remains visible.

## Academic Submission

The final group submission includes the project report, accessible source repository, live application, and a screen-recorded demonstration with each member's contribution. The report and final video links should be added when available.

This application was developed as academic coursework for NSBM Green University.
