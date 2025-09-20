# 🚀 Quick Setup Guide - Podcast Refinery

## Prerequisites
- Node.js 18+ installed
- Firebase account
- OpenAI account with API access

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Setup Script
```bash
npm run setup
```
This interactive script will ask for your API keys and create the `.env.local` file.

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - your app is ready! 🎉

## Manual Setup (if you prefer)

### 1. Create .env.local
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=sk-your_openai_key
```

### 2. Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Copy config from Project Settings → General → Your apps

### 3. OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Ensure you have sufficient credits

## Firebase Security Rules

For development:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /podcast-entries/{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /podcast-entries/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Usage Tips

### Best NotebookLM Format
```
Main Idea: Clear, concise statement of the core concept

Key Takeaways:
• First important lesson
• Second valuable insight
• Third key point

Central Problem: The main challenge discussed

Strengths:
• First positive aspect
• Second advantage

[Continue with other sections...]
```

### Key Features
- ✅ Smart text parsing with OpenAI
- ✅ Automatic content generation
- ✅ Real-time search and filtering
- ✅ PDF/Markdown export
- ✅ Clean, iOS-inspired UI
- ✅ Inline editing for all fields

## Troubleshooting

### Common Issues

**"Firebase not configured"**
- Check your `.env.local` file exists
- Verify all Firebase keys are correct
- Restart development server

**"OpenAI API error"**
- Verify your API key starts with `sk-`
- Check you have sufficient credits
- Ensure the key has chat completion permissions

**"Module not found"**
- Run `npm install` to install dependencies
- Check Node.js version (needs 18+)

**"Build fails"**
- Run `npm run lint` to check for errors
- Ensure TypeScript is properly configured

### Performance Tips
- Large entries export better as Markdown
- Use specific search terms for faster results
- Archive old entries to maintain performance

## Project Structure
```
src/
├── app/           # Next.js pages
├── components/    # Reusable components
├── lib/          # Utilities and APIs
└── types/        # TypeScript definitions
```

## Support
- Check the main README.md for detailed documentation
- Review sample-notebooklm-format.txt for format examples
- Open an issue for bugs or feature requests

---
Ready to transform your podcast notes? Start with `npm run setup`! 🎯
