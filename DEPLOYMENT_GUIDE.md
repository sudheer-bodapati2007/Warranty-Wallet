# Warranty Wallet — Production Deployment & Operations Guide

This guide details the exact steps and configuration checklist required to deploy, migrate, and maintain the **Warranty Wallet** full-stack application across **Vercel** (Frontend), **Render** (Backend), **MongoDB Atlas** (Database), **Cloudflare R2 / AWS S3** (Object Storage), and **Resend** (Email Delivery).

---

## 1. Architecture Summary

```
                       ┌─────────────────────────┐
                       │      Vercel (Frontend)  │
                       │   React 18 + Vite SPA   │
                       └────────────┬────────────┘
                                    │ HTTPS (API Requests with Bearer JWT)
                                    ▼
                       ┌─────────────────────────┐
                       │      Render (Backend)   │
                       │     Node.js Express API │
                       └─────┬──────────────┬────┘
                             │              │
           MongoDB Connection│              │S3 API / Presigned URLs
                             ▼              ▼
              ┌─────────────────────┐   ┌─────────────────────────────┐
              │ MongoDB Atlas DB    │   │ Cloudflare R2 / AWS S3      │
              │ Users, Warranties,  │   │ Private Invoices & Images   │
              │ Notifications       │   └─────────────────────────────┘
              └─────────────────────┘
```

---

## 2. Pre-Deployment Configuration Checklist

### 2.1 MongoDB Atlas Setup
1. Create a MongoDB Atlas Cluster (M0 Free tier or dedicated).
2. Go to **Network Access** and add your backend's IP (or allow `0.0.0.0/0` with strong database user credentials).
3. In **Database Access**, create a user with `readWrite` privileges on the `warranty-wallet` database.
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/warranty-wallet?retryWrites=true&w=majority
   ```

### 2.2 Cloudflare R2 (or AWS S3) Setup
1. Log in to the Cloudflare Dashboard and navigate to **R2**.
2. Click **Create Bucket** and name it (e.g., `warranty-wallet-uploads`).
3. Set the bucket permissions to **Private** (default) — invoice documents are protected and served via short-lived signed URLs.
4. Go to **R2 > Manage R2 API Tokens**, create a token with **Object Read & Write** permissions on the bucket.
5. Record:
   - Account ID / S3 Endpoint: `https://<account_id>.r2.cloudflarestorage.com`
   - Access Key ID
   - Secret Access Key

### 2.3 Resend (Email Reminders) Setup
1. Sign up at [Resend.com](https://resend.com).
2. Add and verify your custom domain in **Domains** (add the required DKIM and SPF records in your DNS provider).
3. Under **API Keys**, create a new key with sending permissions.
4. Set your verified sender email (e.g., `Warranty Wallet <notifications@yourdomain.com>`).
   *(Note: Resend allows testing with `onboarding@resend.dev` to your account email address if a custom domain is not yet configured).*

---

## 3. Backend Deployment on Render

1. Create a new **Web Service** on Render and link your GitHub repository.
2. Configure the service settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Add Environment Variables in Render Dashboard under **Environment**:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security & logging modes |
| `PORT` | `10000` | Port automatically assigned by Render |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/warranty-wallet` | Atlas connection string |
| `CLIENT_URL` | `https://your-warranty-app.vercel.app` | Explicit CORS allowed origin |
| `JWT_SECRET` | *(64-char random string)* | Used to sign JWT session tokens |
| `JWT_EXPIRE` | `7d` | Token validity duration |
| `S3_BUCKET` | `warranty-wallet-uploads` | Private R2/S3 bucket name |
| `S3_ACCESS_KEY_ID` | *(your access key)* | Storage access key |
| `S3_SECRET_ACCESS_KEY`| *(your secret key)* | Storage secret access key |
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` | R2 endpoint URL |
| `S3_REGION` | `auto` | Set to `auto` for R2 or e.g. `us-east-1` for AWS |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxx` | Resend API key |
| `EMAIL_FROM` | `Warranty Wallet <notifications@yourdomain.com>` | Verified sender address |
| `CRON_SECRET` | *(32-char random string)* | Protects the reminder cron webhook |

4. Deploy the service and verify `/api/health` returns HTTP 200 with `status: "ok"`.

### 3.1 Scheduled Expiry Reminders (Cron Job on Render)
1. On Render, click **New + > Cron Job**.
2. Link the repository and set:
   - **Root Directory**: `backend`
   - **Command**: `node scripts/run-reminders.js`
   - **Schedule**: `0 9 * * *` (runs every day at 09:00 UTC)
3. Share the same Environment Variables as your Web Service.

*(Alternative: Use an external cron scheduler such as GitHub Actions or cron-job.org sending a `POST` request to `https://<your-backend>.onrender.com/api/notifications/process-reminders` with header `x-cron-secret: <CRON_SECRET>`)*.

---

## 4. Frontend Deployment on Vercel

1. Import your repository into Vercel.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variable:
   - `VITE_API_URL`: `https://<your-render-backend-service>.onrender.com/api`
4. Deploy the project.
5. Verify client-side routing:
   The repository includes [frontend/vercel.json](file:///c:/Users/sudheer/OneDrive/Desktop/Warranty%20Wallet/frontend/vercel.json) with SPA rewrites to ensure direct navigation to `/warranties` and `/warranties/:id` succeeds without 404s.

---

## 5. Safe Database & File Migrations

### 5.1 Pre-Migration Database Backup
Always capture a snapshot before migrating data:
```bash
mongodump --uri="<MONGODB_URI>" --collection=warranties --out=./backup-pre-migration
```

### 5.2 Legacy Records Migration (Associating Unowned Records)
1. Run dry-run audit (read-only, no database modifications):
   ```bash
   node backend/scripts/migrate-legacy-warranties.js --dry-run
   ```
2. When ready, designate an explicit registered user account to own legacy warranties:
   ```bash
   node backend/scripts/migrate-legacy-warranties.js --owner-email=your-admin@example.com --execute
   ```
3. The script verifies count consistency and prints an audit report.

### 5.3 Local Uploads to Cloud Storage Migration
1. Run dry-run audit of local `/uploads/` files:
   ```bash
   node backend/scripts/migrate-files-to-cloud.js --dry-run
   ```
2. Execute upload to R2/S3:
   ```bash
   node backend/scripts/migrate-files-to-cloud.js --execute
   ```
3. A rollback map `backend/scripts/file-migration-map.json` is exported.
4. **Safety Rule**: Keep local files in `backend/uploads/` until you have verified production cloud operations. Do not delete local files prematurely.

---

## 6. Rollback Procedures

### 6.1 Database Rollback
If a database rollback is ever required:
```bash
mongorestore --uri="<MONGODB_URI>" --nsInclude="warranty-wallet.warranties" ./backup-pre-migration/warranty-wallet/warranties.bson
```

### 6.2 Cloud File Rollback
To restore database references back to local paths:
```javascript
// Reverts references using file-migration-map.json
const map = JSON.parse(fs.readFileSync('backend/scripts/file-migration-map.json'));
for (const item of map) {
  await Warranty.findByIdAndUpdate(item.warrantyId, { [item.field]: item.oldRef });
}
```

### 6.3 Deployment Rollback
- **Vercel**: Instant Rollback to previous deployment via **Deployments > Instant Rollback**.
- **Render**: Rollback via **Manual Deploy > Deploy a specific commit** or revert the commit in Git.
