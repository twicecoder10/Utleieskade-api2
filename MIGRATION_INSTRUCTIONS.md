# ActionLog Table Migration Instructions

## Problem
The `ActionLog` table doesn't exist in the production database, causing the error: `column ActionLog.inspectorId does not exist`

## Solution: Run Migration on Railway

Since Railway uses internal networking (`postgres.railway.internal`), the migration must be run on Railway's environment, not locally.

### Option 1: Run Migration via Railway CLI (Recommended)

1. Install Railway CLI (if not already installed):
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   cd api
   railway link
   ```

4. Run the migration:
   ```bash
   railway run npm run migrate-actionlog
   ```

### Option 2: Run Migration via Railway Dashboard

1. Go to your Railway project dashboard
2. Navigate to your API service
3. Open the "Deployments" or "Settings" tab
4. Use the "Shell" or "Run Command" feature
5. Run: `npm run migrate-actionlog`

### Option 3: Add Migration to Server Startup (Automatic)

If you want the migration to run automatically when the server starts, you can add it to `server.js`:

```javascript
const createActionLogTable = require('./src/migrations/createActionLogTable');

// After database connection
createActionLogTable().catch(console.error);
```

### Option 4: Use DATABASE_URL Environment Variable

If you have a public DATABASE_URL, you can run it locally:

```bash
DATABASE_URL="your-public-database-url" npm run migrate-actionlog
```

## Verify Migration Success

After running the migration, you should see:
- ✅ ActionLog table created successfully
- ✅ Indexes created

The action logs page should now work without the "column does not exist" error.

