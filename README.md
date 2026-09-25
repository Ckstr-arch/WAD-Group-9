# NSBM [Project Title TBD] — Group 9

> Web and Mobile Application Development (WAD) — Batch 26.1 IFSL
> Faculty of Computing, NSBM Green University

## Team

| Role | Name | Contact |
|------|------|---------|
| Team Leader | *TBD* | *TBD* |
| Member | *TBD* | *TBD* |
| Member | *TBD* | *TBD* |
| Member | *TBD* | *TBD* |

## Project Topic

Selected topic: **TBD** (one of NewsDesk / ArtCraft / SportsHub / StudyCircle)

## Introduction

*Short paragraph on what the system does and who it's for — fill in once the topic is confirmed.*

## Objectives

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Bootstrap)
- **Backend:** PHP
- **Database:** MySQL

## Features

### Admin Panel
- [ ] Secure login
- [ ] Manage categories
- [ ] Approve/reject submissions
- [ ] CRUD on core content
- [ ] Reports/analytics

### Student/User Panel
- [ ] Register & login
- [ ] Browse/search/filter content
- [ ] Submit content for approval
- [ ] Comment/like/rate
- [ ] Personal history/dashboard

## Project Structure

```
WAD-Group-9/
├── admin/              # Admin-facing PHP pages
├── user/               # Student/user-facing PHP pages
├── includes/           # Shared PHP: db connection, auth, helper functions
├── config/             # Config templates (real config.php is gitignored)
├── database/
│   └── schema.sql      # Full MySQL schema + sample data
├── public/
│   ├── index.php       # Landing page
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
└── docs/
    └── screenshots/    # Screenshots for the project report
```

## Local Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/WAD-Group-9.git
   cd WAD-Group-9
   ```
2. Create a MySQL database and import the schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE wad_group9"
   mysql -u root -p wad_group9 < database/schema.sql
   ```
3. Copy the config template and fill in your DB credentials:
   ```bash
   cp config/config.example.php config/config.php
   ```
4. Serve the project with PHP's built-in server (or XAMPP/WAMP/MAMP):
   ```bash
   php -S localhost:8000 -t public
   ```
5. Visit `http://localhost:8000`.

## Deployment

- **Live hosted link:** *TBD* (InfinityFree / 000webhost / Render, etc.)
- **Demo video:** *TBD*

## Branching & Contribution Workflow

- `main` — stable, working code only
- `dev` — integration branch
- `feature/<name>` — one branch per feature, merged into `dev` via PR

Each member should commit their own work under their own GitHub account so contributions are visible in the commit history, per the module's grading criteria.

## Deliverables Checklist

- [ ] Project report (PDF/Word) with screenshots, GitHub link, live link, video link
- [ ] Public/accessible GitHub repository with contribution history
- [ ] Live deployed application
- [ ] Screen-recorded demo video (login, admin panel, user panel, CRUD, DB, each member's contribution)

## License

This project is submitted as academic coursework for NSBM Green University.
