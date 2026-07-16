# LibreDebt Mobile App — Setup & Placement Guide

## Repo structure (drop-in alongside existing web app)

libredebt/
  (all your existing Next.js files — unchanged)
  mobile/               ← everything in this folder is the Expo app
    app/
    components/
    hooks/
    lib/
    store/
    assets/
    package.json
    app.config.ts
    babel.config.js
    tailwind.config.js
    tsconfig.json
    global.css
    .env.example

## 1. Create the mobile folder

Run from your repo root:
  mkdir mobile
  cd mobile

Then copy all files from the mobile/ output into this directory.

## 2. Install dependencies

  cd mobile
  npm install

## 3. Environment variables

Copy .env.example to .env.local inside mobile/:
  EXPO_PUBLIC_API_URL=https://yourdomain.com

For local dev point to your local server:
  EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
  (use your machine's LAN IP, not localhost — phone can't reach localhost)

## 4. Add backend API routes to your existing Next.js app

Copy these files from api-routes/ into your existing Next.js project:

  api-routes/api/mobile/dashboard/route.ts
    → app/api/mobile/dashboard/route.ts

  api-routes/api/mobile/debts/route.ts
    → app/api/mobile/debts/route.ts

  api-routes/api/mobile/debts/[id]/route.ts
    → app/api/mobile/debts/[id]/route.ts

  api-routes/api/mobile/debts/[id]/archive/route.ts
    → app/api/mobile/debts/[id]/archive/route.ts

  api-routes/api/mobile/debts/[id]/payment/route.ts
    → app/api/mobile/debts/[id]/payment/route.ts

  api-routes/api/mobile/debts/[id]/ledger/route.ts
    → app/api/mobile/debts/[id]/ledger/route.ts

  api-routes/api/mobile/receivables/route.ts
    → app/api/mobile/receivables/route.ts

  api-routes/api/mobile/receivables/[id]/route.ts
    → app/api/mobile/receivables/[id]/route.ts

  api-routes/api/mobile/receivables/[id]/archive/route.ts
    → app/api/mobile/receivables/[id]/archive/route.ts

  api-routes/api/mobile/receivables/[id]/repayment/route.ts
    → app/api/mobile/receivables/[id]/repayment/route.ts

  api-routes/api/mobile/profile/route.ts
    → app/api/mobile/profile/route.ts

  api-routes/api/mobile/profile/delete/route.ts
    → app/api/mobile/profile/delete/route.ts

  api-routes/api/mobile/subscription/route.ts
    → app/api/mobile/subscription/route.ts

  api-routes/api/mobile/billing/checkout/route.ts
    → app/api/mobile/billing/checkout/route.ts

  api-routes/api/mobile/billing/cancel/route.ts
    → app/api/mobile/billing/cancel/route.ts

  api-routes/api/mobile/storage/receipt-url/route.ts
    → app/api/mobile/storage/receipt-url/route.ts

## 5. Exclude mobile/ from Next.js compilation

In your root next.config.ts, ensure the mobile folder isn't scanned:

  const nextConfig = {
    // ... existing config
  }
  export default nextConfig

Next.js only scans the app/ and src/ directories by default, so the
mobile/ folder is automatically excluded. No change needed.

## 6. Add mobile/ to root .gitignore additions

  # Mobile
  mobile/node_modules
  mobile/.expo
  mobile/dist
  mobile/.env.local

## 7. Run the mobile app

  cd mobile
  npx expo start

Then press:
  i — open in iOS simulator
  a — open in Android emulator
  Scan QR — open on physical device via Expo Go

## 8. Assets needed

Create placeholder files (or real ones) at:
  mobile/assets/icon.png              1024x1024 PNG
  mobile/assets/splash.png            1284x2778 PNG
  mobile/assets/adaptive-icon.png     1024x1024 PNG
  mobile/assets/notification-icon.png 96x96 PNG

You can use any solid #0F172A (navy) background with the LibreDebt
icon for all of these during development.

## 9. EAS Build (production)

  npm install -g eas-cli
  eas login
  eas build:configure
  eas build --platform ios
  eas build --platform android

Update app.config.ts with your real EAS projectId before building.

## 10. Deep linking for Paystack callback

In app.config.ts the scheme is already set to "libredebt".
Register the callback URL in Paystack dashboard as:
  libredebt://settings/billing

And add to your iOS info.plist (handled automatically by Expo):
  CFBundleURLSchemes: ["libredebt"]

## Auth note

The mobile app uses BetterAuth's standard email/password endpoints:
  POST /api/auth/sign-in/email  — { email, password }
  POST /api/auth/sign-up/email  — { email, password, name }
  POST /api/auth/sign-out
  GET  /api/auth/get-session

These already exist in your Next.js app from the web build.
BetterAuth accepts Bearer token auth on all protected routes,
so no changes to lib/auth.ts are needed.

## Complete file list (mobile/)

app/
  _layout.tsx
  index.tsx
  (auth)/
    _layout.tsx
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  (app)/
    _layout.tsx
    index.tsx                   (Overview/Dashboard)
    analytics.tsx
    debts/
      index.tsx                 (Debts list)
      new.tsx                   (Add debt)
      [id].tsx                  (Debt detail)
      [id]/
        payment.tsx             (Record payment with receipt)
        edit.tsx                (Edit debt)
    receivables/
      index.tsx
      new.tsx
      [id].tsx                  (Detail with repayment + reminder)
    settings/
      index.tsx
      profile.tsx
      billing.tsx

components/
  ui/
    Button.tsx
    Input.tsx
    Card.tsx
    Badge.tsx
    ProgressBar.tsx
    Skeleton.tsx
    EmptyState.tsx
  debt/
    DebtCard.tsx
  layout/
    TrialBanner.tsx
    ProGate.tsx

hooks/
  useDebts.ts
  useReceivables.ts
  useDashboard.ts
  useSubscription.ts

lib/
  api.ts
  currency.ts
  storage.ts
  queryClient.ts
  utils.ts

store/
  authStore.ts
  preferencesStore.ts

Screens still to add (v2):
  - Settings > Notifications (toggle reminders)
  - Receivables > [id]/edit
  - Debt strategies comparison screen
  - What-if simulator screen
