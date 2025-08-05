# Smart Stock Inventory System

## Overview
A modern inventory management solution for retail businesses, built with Laravel and React using PrimeReact and Tailwind CSS. This system simplifies inventory operations, sales, purchases, and financial tracking with real-time insights.

## Installation
1. Clone the repository: `git clone https://your-repo-url.git`
2. Copy `.env.example` to `.env` and configure database credentials.
3. Run `docker-compose up --build` to start the environment.
4. Run migrations: `docker-compose exec app php artisan migrate`
5. Install frontend dependencies: `docker-compose exec node npm install`
6. Start the app: Access `http://localhost:8000`

## Usage
- Register a new user at `/register`.
- Log in at `/login` with admin credentials.
- Manage users, roles, and inventory from the dashboard.

## Contributing
- Fork the repository.
- Create a feature branch (`git checkout -b feature/xyz`).
- Commit changes and push to the branch.
- Open a pull request.

## Version
- Initial Release: 2025-08-04

## License
GPL-2.0+