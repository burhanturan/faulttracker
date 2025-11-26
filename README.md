# FaultTracker - Railway Fault Reporting System

FaultTracker is a comprehensive mobile application designed for reporting and managing railway infrastructure faults. It features a role-based system connecting Workers, Chiefdoms (Şeflik), CTC Centers, Engineers, and Administrators to streamline fault resolution.

## 🚀 Tech Stack

### Frontend (Mobile)
-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Language**: TypeScript
-   **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
-   **Navigation**: Expo Router

### Backend (API)
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: PostgreSQL
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Language**: TypeScript

## ✨ Features

-   **Role-Based Access Control**:
    -   **Admin**: Manage users, chiefdoms, and view system overview.
    -   **CTC (Center)**: Report faults and assign them to Chiefdoms.
    -   **Engineer**: View assigned tasks and manage fault status (Admin access included).
    -   **Worker**: Report issues and view status.
-   **Fault Management**: Report, track, and update fault status.
-   **User Management**: Create, edit, and delete users with specific roles.
-   **Chiefdom Management**: Organize users and faults by region/chiefdom.
-   **Real-time Updates**: (Planned) Instant notifications for fault assignments.

## 🛠️ Installation & Setup

### Prerequisites
-   Node.js & npm
-   PostgreSQL (Local or Cloud)
-   Expo Go app (for testing on device)

### 1. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure Environment:
Create a `.env` file in `backend/` and add your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fault_tracker?schema=public"
```

Run Migrations & Seed Data:
```bash
npx prisma db push
npx ts-node seed.ts
```

Start the Server:
```bash
npx nodemon --exec ts-node index.ts
```
*Server runs on `http://localhost:3000`*

### 2. Frontend Setup
Navigate to the project root:
```bash
cd ..
```

Install dependencies:
```bash
npm install
```

Configure API URL:
Update `lib/api.ts` with your local IP address if testing on a physical device.

Start the App:
```bash
npx expo start
```
Scan the QR code with Expo Go.
