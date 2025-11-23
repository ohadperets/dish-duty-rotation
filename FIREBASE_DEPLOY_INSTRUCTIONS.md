# Firebase Hosting Deployment Instructions

## Option 1: Using Firebase Console (Web Interface) - EASIEST

1. Go to: https://console.firebase.google.com/project/dishdutyrotation/hosting

2. Click "Get Started" or "Add another site"

3. Create a ZIP file with these files:
   - index.html
   - styles.css
   - script.js
   - firebase.json
   - Images/ (folder)
   - js/ (folder)
   - css/ (folder)
   - config/ (folder)

4. Upload the ZIP file through the web interface

5. Your site will be live at: `https://dishdutyrotation.web.app`

6. To add custom domain (dishess.com):
   - Go to Hosting → Add custom domain
   - Follow DNS setup instructions
   - Firebase provides automatic SSL

## Option 2: Using PowerShell (if npm works later)

```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy --only hosting
```

## Your Custom Domain Setup

After deployment, to use dishess.com:

1. Firebase Console → Hosting → Add Custom Domain
2. Enter: dishess.com
3. Add DNS records in GoDaddy:
   - Type: A
   - Name: @
   - Value: (Firebase will provide IP addresses)
   
4. Firebase handles SSL automatically!

## Benefits of Firebase Hosting

✓ Free SSL certificate (auto-renewing)
✓ Global CDN
✓ Fast deployment
✓ Works with your existing Firebase project
✓ No domain verification issues like Netlify
