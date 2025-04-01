# WorkWave

WorkWave is a platform that connects clients with skilled workers for various tasks and services.

## Project Structure

- `/frontend/workwave-client` - Angular frontend application
- `/backend` - Express backend (future development)
- `server.js` - Express server for serving the production build

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm (>= 6.x)
- Angular CLI (>= 17.x)

### Installation

1. Clone the repository
2. Install dependencies in the root folder:
```bash
npm install
```
3. Install dependencies in the Angular app:
```bash
cd frontend/workwave-client
npm install
```

## Running the Application

### Development Mode

#### PowerShell Users

You can use the provided PowerShell script to start both servers with a single command:

```powershell
./start-app.ps1
```

Alternatively, run each command in a separate terminal:
   
**Terminal 1 - Express Server**
```powershell
npm run server
```
   
**Terminal 2 - Angular Server**
```powershell
cd frontend/workwave-client
ng serve --port 4202
```

#### Bash/Command Prompt Users

Run both servers concurrently:
```bash
npm run dev
```

### Production Mode

1. Build the Angular application:
```bash
npm run build  # Development build
# OR
npm run prod-build  # Production build with optimization
```

2. Start the Express server:
```bash
npm start
```

The application will be available at http://localhost:5002

## Features

- User authentication (login, register, change password)
- Browse and search tasks
- Create, update, and delete tasks
- Apply for tasks and hire workers
- Messaging between clients and workers
- User profiles with reviews
- Task completion and cancellation workflow

## Troubleshooting

### Port conflicts

If you experience an `EADDRINUSE` error, it means the port is already in use. You can:
1. Check if another instance of the server is running and stop it
2. Change the port in `.env` and `server.js` files
3. For Angular, specify a different port with `--port` flag

### Common Linting Warnings

1. **"RouterLink is not used"**: This warning appears when RouterLink is imported but not used in the template. You can either remove it from imports or add routerLink to template elements.

2. **Type warnings**: Address any 'any' type warnings by creating proper TypeScript interfaces.

3. **Unused variables**: Make sure to use or remove variables that are defined but never used.

## Demo Login Credentials

- **Client**: client@example.com / password
- **Worker**: worker@example.com / password

## Notes

This project uses mock data for demonstration purposes. In a production environment, these would be replaced with actual API calls to the backend. 