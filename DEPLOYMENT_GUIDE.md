# 🚀 Deployment Guide - Podcast Refinery

## Environment Variables for Vercel

When deploying to Vercel, you'll need to add these environment variables in your Vercel dashboard:

### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### OpenAI Configuration
```
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
```

### Optional: Firebase Emulator (for local development only)
```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## Steps to Deploy:

1. **Push to GitHub**: Commit and push your code to a GitHub repository

2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Add Environment Variables**:
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add all the variables listed above
   - Make sure to set them for Production, Preview, and Development

4. **Deploy**: Vercel will automatically deploy your app

## Security Notes:

✅ **API Keys are now secure**: 
- OpenAI API key is server-side only (in API routes)
- No hardcoded keys in the codebase
- Environment variables are properly configured

✅ **Firebase Security**:
- Make sure your Firestore security rules allow read/write access
- Update rules in Firebase Console if needed

## Testing After Deployment:

1. Create a new podcast entry
2. Test the AI parsing and tag generation
3. Test the semantic search functionality
4. Verify all features work correctly

Your app will be available at: `https://your-project-name.vercel.app`
