# Resilience Hub

A React application built with Vite, TypeScript, and Firebase for managing resilience challenges and personal growth.

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd resilience-hub
```

2. Install dependencies:
```bash
npm install
```

3. Environment Variables Setup:
   - Copy `.env.example` to a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your Firebase configuration values in the `.env` file

4. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run lint:watch` - Watch for ESLint issues

## Deployment

To deploy the application to Firebase Hosting:

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```
- Select 'Hosting'
- Choose your Firebase project
- Use 'dist' as your public directory
- Configure as a single-page app: Yes
- Don't overwrite index.html: No

4. Build the application:
```bash
npm run build
```

5. Deploy to Firebase:
```bash
firebase deploy
```

Your app will be deployed to `https://<your-project-id>.web.app`

## Environment Variables

This project uses the following environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Important:** Never commit your `.env` file to version control. The `.env.example` file serves as a template. 