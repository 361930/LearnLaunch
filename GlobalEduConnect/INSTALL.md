# GlobalEduConnect Installation Guide

This guide will help you set up and run the GlobalEduConnect application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or later)
- npm (v8 or later)
- PostgreSQL (v14 or later)

## Database Setup

1. Create a new PostgreSQL database:
   ```sql
   CREATE DATABASE globaleduconnect;
   ```

2. Create a database user (optional, if you don't want to use the default postgres user):
   ```sql
   CREATE USER educonnect WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE globaleduconnect TO educonnect;
   ```

## Application Setup

1. Unzip the application files to your preferred location.

2. Navigate to the application directory:
   ```bash
   cd GlobalEduConnect
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/globaleduconnect
   SESSION_SECRET=your_session_secret
   ```
   Replace `username` and `password` with your PostgreSQL credentials.

5. Initialize the database schema:
   ```bash
   npm run db:push
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application:
   Open your browser and visit `http://localhost:5000`

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## Mobile Setup

For mobile development with Capacitor:

1. Install Capacitor globally:
   ```bash
   npm install -g @capacitor/cli
   ```

2. Build the web application:
   ```bash
   npm run build
   ```

3. Add mobile platforms:
   ```bash
   npx cap add android
   npx cap add ios
   ```

4. Sync the web code to the mobile projects:
   ```bash
   npx cap sync
   ```

5. Open the native IDEs:
   ```bash
   npx cap open android  # Requires Android Studio
   npx cap open ios      # Requires Xcode and macOS
   ```

## Troubleshooting

- **Database Connection Issues**: Ensure your PostgreSQL server is running and the DATABASE_URL is correct in your .env file.
- **Port Conflicts**: If port 5000 is already in use, you can modify the port in the server configuration.
- **Node Version**: This application works best with Node.js v18 or later. If you encounter issues, try updating your Node.js version.

## Additional Configuration

For additional configuration options and advanced setup, please refer to the README.md file.

## Support

If you encounter any issues during installation, please contact the development team for assistance.