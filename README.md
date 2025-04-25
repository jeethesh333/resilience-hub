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