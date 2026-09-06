# 📱 SAJAG (सजग) Citizen Emergency Portal & PWA
### Community Early Warning, Safe Shelter Evacuation & 1-Tap SOS

`sajag_public` is the citizen-facing, mobile-first Progressive Web Application (PWA) designed for residents across the Kathmandu Valley (Bagmati corridor, seismic zones, and steep valley slopes). It provides real-time community hazard risk assessment, evacuation navigation, field reporting, and distress broadcasting.

---

## 📁 1. Directory Structure

```text
sajag_public/
├── package.json                      # Next.js 14, Tailwind, Lucide, Leaflet, Socket.IO
├── tsconfig.json                     # Standalone TypeScript compiler configuration
├── tailwind.config.ts                # Emergency high-contrast alert design system
├── next.config.mjs                   # Remote image optimization & React strict mode
├── .env.local                        # Backend API & Socket.IO URL endpoints
├── public/
│   ├── manifest.json                 # PWA standalone install configuration
│   └── icons/                        # Web app icons
│
├── types/
│   └── index.ts                      # Standalone SAJAG domain models (zero monorepo coupling)
│
├── lib/
│   ├── api.ts                        # Axios HTTP client with Bearer auth interceptor
│   ├── socket.ts                     # Socket.IO client singleton for live broadcast pushes
│   └── utils.ts                      # Tailwind styling helpers (clsx & twMerge)
│
├── stores/
│   └── auth.store.ts                 # Zustand store for citizen authentication & session
│
├── components/
│   ├── navbar.tsx                    # Header with Live Grid connection badge & alerts icon
│   ├── bottom-nav.tsx                # Mobile dock with glowing center floating SOS button
│   └── map/
│       └── citizen-map.tsx           # Lightweight Leaflet evacuation map (shelters, danger zones)
│
└── app/
    ├── layout.tsx                    # Root layout with dark theme & navbar/dock wrappers
    ├── globals.css                   # Tailwind base styles & custom Leaflet marker animations
    ├── page.tsx                      # 🏠 CITIZEN DASHBOARD (Hazard Meter, Advisories, Quick Actions)
    │
    ├── sos/
    │   └── page.tsx                  # 🚨 1-Tap Distress SOS Button (3s countdown & rescue status)
    │
    ├── shelters/
    │   └── page.tsx                  # 🏕️ Safe Havens Evacuation List & Interactive Route Map
    │
    ├── report/
    │   └── page.tsx                  # 📸 Citizen Ground Incident Photo/GPS Report Form
    │
    ├── alerts/
    │   └── page.tsx                  # 🔔 Active Broadcast Bulletins & "I Am Safe" Check-in
    │
    └── (auth)/
        └── login/
            └── page.tsx              # Quick Resident Check-in & Phone Registration
```

---

## 🧭 2. Citizen User Journey & Core Flowcharts

### Flow A: Real-Time Early Warning & Safety Status Check-in
```text
Citizen Opens App (/) ──> View 0-100 Community Hazard Index (Bagmati Water, Rain, Quake, Soil)
                             │
                             ├─► IF Hazard Alert Active ──> Read Broadcast Advisory Banner
                             │                                 │
                             │                                 └─► Tap "I am Safe" (Status logged to Command Center)
                             │                                 └─► Tap "Need Help" (Redirect to SOS)
                             │
                             └─► View Nearest Safe Shelter Haven (Distance & Available Beds)
```

### Flow B: Emergency SOS Distress Dispatch
```text
Citizen in Danger ──> Navigates to /sos (or taps Center Floating SOS Button)
                         │
                         ├─► Tap Big Red SOS Button ──> 3-Second Abort Countdown Timer
                         │                                 │
                         │                                 ├─► Tap "Cancel" ➔ Aborts trigger
                         │                                 └─► Timer reaches 0 ➔ Transmit Distress
                         │
                         ├─► Auto-fetches GPS Geolocation & Optional Details (Trapped Count, Medical Need)
                         │
                         └─► Enters Live Tracker View:
                             • Socket.IO listens for 'sos:update' from Command Center
                             • Displays Assigned Unit (e.g., Armed Police Force Unit 4)
                             • Shows Officer Name & VHF Radio Frequency
```

### Flow C: Safe Shelter Evacuation
```text
Citizen taps /shelters ──> Views verified safe havens (Dasharath Stadium, TU Ground, Tundikhel)
                             │
                             ├─► Toggle between List View and Map View
                             ├─► Inspect facility tags: 🏥 Medical Clinic, ⚡ Backup Power, 💧 Food/Water
                             └─► Tap "Get Directions" ➔ Opens Google Maps routing to shelter
```

### Flow D: Crowdsourced Ground Incident Report
```text
Citizen observes rising flood / landslide ──> Navigates to /report
                                                 │
                                                 ├─► Select Hazard Category (Flood, Landslide, Fallen Tree)
                                                 ├─► Attach Ground Evidence Photo
                                                 ├─► Auto-attach Current GPS Coordinates
                                                 └─► Submit ➔ Transmits to Command Center for verification
```

---

## 🔌 3. API & Real-time WebSocket Integration

The Citizen Portal interacts with `sajag_backend` via:

### REST Endpoints:
- `GET /api/alerts/active`: Retrieves current confirmed disaster events.
- `POST /api/alerts/respond`: Citizen self-reports `SAFE` or `UNSAFE` status.
- `GET /api/shelters/nearest?lat={lat}&lng={lng}`: Returns safe havens sorted by distance.
- `POST /api/sos`: Creates a distress call record with coordinates and urgency.
- `POST /api/reports`: Submits crowdsourced field hazard observation with media.

### WebSocket Events (`socket.io`):
- `alert:new`: Pushes immediate sirens and broadcasts when risk thresholds breach.
- `sos:update`: Notifies the citizen when authorities dispatch a rescue team to their location.

---

## 🛠️ 4. Running the Citizen Portal Standalone

```bash
cd /home/dipak/hacathon/sajag_public

# Install dependencies (already executed)
npm install

# Start development server on port 3000
npm run dev
```

Navigate to [**http://localhost:3000**](http://localhost:3000) on mobile or desktop browser.
