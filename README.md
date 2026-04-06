# TimeBlock PWA

A minimalist daily time-blocking planner with smart notifications. Built with Next.js 15, TypeScript, Tailwind CSS, and Zustand.

## Features

- **Zero Database**: All data stored in localStorage via Zustand persist middleware
- **Visual Timeline**: Daily schedule view from 00:00 - 23:59
- **Smart Notifications**: Browser notifications when block start time arrives
- **Sound Alerts**: Web Audio API notification sounds (toggleable)
- **PWA Ready**: Installable app with offline support
- **Mobile-First**: Responsive design optimized for mobile devices
- **Clean UI**: Apple/Minimalist aesthetic with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **State Management**: Zustand with persist middleware
- **Styling**: Tailwind CSS + Shadcn UI
- **PWA**: next-pwa for service worker and manifest
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Project Structure

```
├── app/
│   ├── ~offline/page.tsx    # Offline fallback page
│   ├── layout.tsx           # Root layout with PWA meta tags
│   ├── page.tsx             # Main page with Timeline
│   └── globals.css          # Global styles
├── components/
│   ├── Timeline.tsx         # Main timeline component
│   └── ui/                  # Shadcn UI components
├── hooks/
│   └── useAlarm.ts          # Alarm/notification logic
├── store/
│   └── useTaskStore.ts      # Zustand store with persist
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Custom service worker
│   └── icons/               # App icons
└── next.config.ts           # Next.js + PWA config
```

## Key Components

### 1. Zustand Store (`store/useTaskStore.ts`)
- Defines `TimeBlock` interface with id, title, start/end times, color, date
- Persist middleware saves to localStorage automatically
- Actions: add, update, delete, toggle complete, mark notified

### 2. Alarm Logic (`hooks/useAlarm.ts`)
- Checks every minute for blocks starting at current time
- Plays sound notification using Web Audio API
- Triggers browser notifications via Notification API
- Sends push notifications through service worker

### 3. Service Worker (`public/sw.js`)
- Caches static assets for offline use
- Handles push notifications in background
- Fallback to offline page when network fails

### 4. Timeline Component (`components/Timeline.tsx`)
- Visual daily schedule with color-coded blocks
- Date navigation (previous/next/today)
- Add/Edit block dialogs
- Mobile-optimized floating action button

## Deploy to Vercel

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Development

```bash
# Run dev server
npm run dev

# Build
npm run build -- --webpack

# Start production server
npm start
```

## Browser Support

- Chrome/Edge (recommended for best PWA experience)
- Firefox
- Safari (iOS 16.4+ for Web Push)

## License

MIT
