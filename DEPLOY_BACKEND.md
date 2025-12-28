# How to Deploy Backend to Railway

## 1. Prepare GitHub
1.  Make sure all your latest code is committed and pushed to your **GitHub repository**.

## 2. Create Project on Railway
1.  Go to [Railway.app](https://railway.app/) and log in (e.g., with GitHub).
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select your repository (`CROSSCERT-VPAA-`).
4.  **IMPORTANT:** Click **"Add Variables"** but DO NOT deploy yet if possible (or let it fail first, it's fine).

## 3. Configure Service Settings (Crucial Step)
Since your backend is in a subfolder (`/backend`), you must tell Railway where to look.
1.  Click on your new service/card in the Railway dashboard.
2.  Go to the **"Settings"** tab.
3.  Scroll down to **"Root Directory"**.
4.  Change it from `/` to `/backend`.
5.  Railway will detect the change and might restart a build.

## 4. Set Environment Variables
Go to the **"Variables"** tab and add the following keys (copy values from your `.env` or Supabase):
*   `SECRET_KEY`: (Generate a random one or use a secure string)
*   `DEBUG`: `False` (For production)
*   `ALLOWED_HOSTS`: `*` (Or add your Vercel frontend URL later)
*   `SUPABASE_DB_NAME`: `postgres`
*   `SUPABASE_DB_USER`: `postgres`
*   `SUPABASE_DB_PASSWORD`: (Your Supabase DB Password)
*   `SUPABASE_DB_HOST`: (Your Supabase Host, e.g., `db.xyz.supabase.co`)
*   `SUPABASE_DB_PORT`: `6543` (Use the pooling port!)
*   `SENDER_EMAIL`: (Your Gmail)
*   `SENDER_PASSWORD`: (Your App Password)
*   `FRONTEND_URL`: (Your future Vercel URL, e.g. `https://crosscert.vercel.app`)
*   `CSRF_COOKIE_SECURE`: `True` (For HTTPS production)
*   `SESSION_COOKIE_SECURE`: `True` (For HTTPS production)

## 5. Deploy
1.  Once variables are set, the deployment logs should show it installing dependencies.
2.  Wait for it to say **"Active"**.
3.  Go to **"Settings"** -> **"Networking"** -> **"Generate Domain"**.
4.  This is your **Backend URL** (e.g., `https://crosscert-production.up.railway.app`).

## 6. Connect to Frontend
1.  Copy that new Backend URL.
2.  Go to your Vercel Frontend project settings.
3.  Add/Update the Environment Variable: `NEXT_PUBLIC_API_URL` with the Railway URL.
4.  Redeploy Vercel.
