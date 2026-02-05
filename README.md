# PLeads - Lead Capture System

Application for capturing and managing business leads using Google Places API.

## Prerequisites

- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [Git](https://git-scm.com/)

## Installation

1. **Clone the repository** (or copy the files):
   ```bash
   git clone <repository-url>
   cd PLeads
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Google Places API key:
     ```
     VITE_GOOGLE_PLACES_KEY=your_api_key_here
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

## Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Building tor Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/` - Source code
- `dist/` - Production build output
- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
