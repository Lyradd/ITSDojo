
# ITSDojo

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), designed as a Gamified Learning Management System.

## Project Setup & Installation (Important)

Before running the development server, ensure you have installed all necessary dependencies and UI components used in this project.

### 1. Install Core Dependencies
Run this command to install state management, utility libraries, icons, and visualization tools:

```bash
npm install zustand clsx tailwind-merge lucide-react class-variance-authority reactflow

```

### 2. Initialize Shadcn UI

If you haven't initialized Shadcn UI yet, run:

```bash
npx shadcn@latest init

```

### 3. Install Required UI Components

This project relies on specific Shadcn UI components. Install them using the following command:

```bash
npx shadcn@latest add button card input label progress separator

```

---

## Database Setup (Neon & Drizzle)
This project uses Neon (Serverless PostgreSQL) as the database and Drizzle ORM for type-safe database interactions.

### 1. Install Database Dependencies
Install the ORM, Neon driver, and development tools for migrations:

```Bash
npm install drizzle-orm @neondatabase/serverless dotenv
npm install -D drizzle-kit
```
### 2. Configure Environment Variables
Create a .env file in the root directory. You need to add your Neon connection string here.

Important: Use the "Pooled" connection string from your Neon Dashboard. Ensure there are no psql prefixes or single quotes '.

Cuplikan kode

#### .env
```bash
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-your-endpoint.aws.neon.tech/neondb?sslmode=require"
```

## 3. Sync Database Schema
Whenever you make changes to db/schema.ts, you must push the changes to the Neon database:

```bash
npx drizzle-kit push
```

## 4. Manage Data (Drizzle Studio)
To view, edit, or add dummy data to your database using a GUI (similar to phpMyAdmin):

```bash
npx drizzle-kit studio
```

This will open a local web interface to interact with your live Neon database.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
