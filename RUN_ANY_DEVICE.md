# COER LVNS — Run on another laptop/mobile

## 1. First laptop / PC
Install Node.js 20 LTS or newer.

In the project folder:

```bash
npm install
npm run dev
```

The Vite server now listens on `0.0.0.0`, so it can be opened from devices on the same Wi-Fi/LAN.

## 2. Find the PC's local IP on Windows
Open Command Prompt and run:

```text
ipconfig
```

Find `IPv4 Address`, for example `192.168.1.10`.

## 3. Open from phone/another laptop
Connect the other device to the same Wi-Fi and open:

```text
http://192.168.1.10:5173
```

Replace the IP with the PC's IPv4 address.

If Windows Firewall asks for access, allow Node.js on Private networks. Do not expose the development server directly to the public internet.

## 4. Forgot Password
The login screen now has **Forgot Password?**. The reset email redirects back to the site.

In Supabase Dashboard, add these URLs under Authentication → URL Configuration:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- Your LAN URL, e.g. `http://192.168.1.10:5173`

For a hosted deployment, add the final HTTPS site URL instead.

## 5. Apply the database migration
Run the SQL file below once in Supabase Dashboard → SQL Editor:

`supabase/migrations/20260928010000_auth_recovery_and_profile_trigger.sql`

This creates the profile automatically after signup, including when email confirmation is enabled.
