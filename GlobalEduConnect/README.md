# GlobalEduConnect

A comprehensive mobile-enabled educational platform that supports global learning connections through adaptive technology and enhanced user experience.

## Features

- Enhanced user authentication with role-based access (students, teachers, admin)
- Advanced class scheduling system
- Reporting system for violations
- Donation system ("Buy Me a Coffee" functionality)
- Admin panel features
- Asynchronous learning capabilities
- Community features (forums, chat, challenge boards)
- Global accessibility (multi-language support, timezone adjustments)
- Security/privacy features
- Mobile-first design with Progressive Web App capabilities

## Technology Stack

- React.js (TypeScript) frontend
- Capacitor for cross-platform mobile development
- Drizzle ORM for database interactions
- PostgreSQL database
- Role-based authentication (Student/Teacher/Admin)
- Responsive design with mobile-first approach
- Multi-platform support (Web, iOS, Android)
- Error boundary and network-aware query management

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/globaleduconnect
   SESSION_SECRET=your_session_secret
   ```

3. Initialize the database:
   ```
   npm run db:push
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application:
   Open your browser and visit `http://localhost:5000`

## Mobile Development

For mobile development with Capacitor:

1. Build the web application:
   ```
   npm run build
   ```

2. Add mobile platforms:
   ```
   npx cap add android
   npx cap add ios
   ```

3. Sync the web code to the mobile projects:
   ```
   npx cap sync
   ```

4. Open the native IDEs:
   ```
   npx cap open android
   npx cap open ios
   ```

## Progressive Web App

This application is configured as a Progressive Web App (PWA) with offline capabilities. The service worker is automatically generated during the build process.

## Contact

For questions or support, please reach out to the development team.