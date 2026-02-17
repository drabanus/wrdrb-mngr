# Garderobe - Choir Wardrobe Manager

A web-based wardrobe management system for children's choirs. Track clothing inventory, assign pieces to children, manage measurements and sizes across DE/EU/US/UK conventions, and coordinate gig logistics -- all from a mobile-friendly PWA.

## Features

- **Children management** -- profiles, body measurements, growth predictions
- **Inventory tracking** -- clothing pieces and bags with QR code scanning
- **Size conventions** -- DE, EU, US, and UK size support with automatic conversion
- **Assignments** -- assign clothing and bags to children
- **Dispatch & reception** -- check equipment in/out for gigs
- **Task board** -- laundry, repairs, and size-change todos
- **Role-based access** -- admin, receptionist, laundry, and mender roles
- **Multi-language** -- German, English, and Spanish
- **PWA** -- installable, works offline

## Tech Stack

SvelteKit 2 + Svelte 5, Tailwind CSS + DaisyUI, Prisma with SQLite, Lucia authentication, Vite PWA

## Prerequisites

| Dependency | Minimum version |
|------------|-----------------|
| Node.js    | 18+             |
| npm        | 9+              |

## Install

### macOS

```bash
# Install Node.js (if not already installed)
brew install node

# Clone and enter the project
git clone <repo-url> garderobe
cd garderobe

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# (Optional) Seed with demo data
npm run db:seed

# Start the dev server
npm run dev
```

### Linux (Debian/Ubuntu)

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# You may also need build tools for better-sqlite3
sudo apt-get install -y build-essential python3

# Clone and enter the project
git clone <repo-url> garderobe
cd garderobe

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# (Optional) Seed with demo data
npm run db:seed

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Demo Credentials

After seeding, you can log in with:

| Username   | Password    | Role          |
|------------|-------------|---------------|
| admin      | admin123    | Administrator |
| empfang    | empfang123  | Receptionist  |
| waesche    | waesche123  | Laundry       |
| naeherei   | naehen123   | Mender        |

## Scripts

| Command              | Description                         |
|----------------------|-------------------------------------|
| `npm run dev`        | Start development server            |
| `npm run build`      | Build for production                |
| `npm run preview`    | Preview production build            |
| `npm run db:generate`| Regenerate Prisma client            |
| `npm run db:push`    | Push schema changes to the database |
| `npm run db:seed`    | Seed database with demo data        |
