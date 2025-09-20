# 🎯 Podcast Refinery

A personal knowledge vault + content engine for podcast notes. Transform your NotebookLM summaries into structured data with AI-powered content generation.

## ✨ Features

- **📝 Smart Parsing**: Automatically extract structured data from NotebookLM summaries
- **🤖 AI Content Generation**: Generate social media hooks, content topics, and monetization ideas
- **🔍 Powerful Search**: Find entries by speaker, topic, or content
- **📱 iOS-like Interface**: Clean, modern design inspired by Apple Notes + Notion
- **📊 Organized Storage**: Structured Firebase storage with real-time updates
- **📄 Export Options**: Export to PDF or Markdown format
- **✏️ Easy Editing**: Inline editing for all fields and sections

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Auth)
- **AI**: OpenAI GPT-4 for parsing and content generation
- **Export**: jsPDF + html2canvas for PDF generation
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom iOS-like components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- OpenAI API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd podcast-refinery
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Set up Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /podcast-entries/{document=**} {
      allow read, write: if true; // Adjust security rules as needed
    }
  }
}
```

4. Get your Firebase config from Project Settings → General → Your apps

### 4. OpenAI Setup

1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Creating Your First Entry

1. Click **"New Entry"** on the dashboard
2. Paste your NotebookLM summary in the text area
3. Click **"Process Entry"** to extract structured data and generate content
4. Review the parsed data and generated content
5. Click **"Save Entry"** to store in Firebase

### Expected NotebookLM Format

The app expects NotebookLM summaries with sections like:

```
Main Idea: The core concept discussed in the podcast

Key Takeaways:
• First key takeaway
• Second key takeaway
• Third key takeaway

Central Problem: The main problem being addressed

Strengths:
• First strength mentioned
• Second strength mentioned

Weaknesses:
• First weakness mentioned
• Second weakness mentioned

Practical Lessons:
• First practical lesson
• Second practical lesson

Action Checklist:
• First actionable item
• Second actionable item
```

### Managing Entries

- **View**: Click any entry card to see full details
- **Edit**: Click the edit button in entry details
- **Search**: Use the search bar to find entries by content
- **Filter**: Filter by speaker or other criteria
- **Export**: Export individual entries as PDF or Markdown
- **Copy**: Copy individual sections to clipboard

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── entry/[id]/        # Entry detail page
│   ├── new/               # New entry creation page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard/home page
├── components/            # Reusable React components
│   ├── ErrorMessage.tsx
│   └── LoadingSpinner.tsx
├── lib/                   # Utility libraries
│   ├── export.ts          # PDF/Markdown export functions
│   ├── firebase.ts        # Firebase configuration
│   ├── firestore.ts       # Firestore database operations
│   ├── openai.ts          # OpenAI API integration
│   └── utils.ts           # Helper utilities
└── types/                 # TypeScript type definitions
    └── index.ts
```

## 🔧 Configuration

### Tailwind CSS

The app uses a custom Tailwind configuration with:
- Custom colors (primary, accent)
- iOS-like design system
- Custom components and utilities
- Inter font family

### Firebase Security

For production, update Firestore rules to include proper authentication:

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

## 📊 Data Schema

Each podcast entry is stored with this structure:

```typescript
interface PodcastEntry {
  id?: string;
  title: string;
  youtubeLink: string;
  date: Timestamp | Date;
  speaker: string;
  mainIdea: string;
  keyTakeaways: string[];
  centralProblem: string;
  strengths: string[];
  weaknesses: string[];
  counterarguments: string[];
  practicalLessons: string[];
  twoMinuteVersion: string[];
  actionChecklist: string[];
  socialMediaHooks: string[];      // AI-generated
  contentTopics: string[];         // AI-generated
  monetizationIdeas: string[];     // AI-generated
  notes: string;                   // Personal notes
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}
```

## 🎨 Design System

The app uses an iOS-inspired design system with:

- **Colors**: Clean whites, grays, with blue primary and gold accent
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Consistent 4px grid system
- **Shadows**: Soft, subtle shadows for depth
- **Borders**: Rounded corners (12px, 16px, 24px)
- **Animations**: Smooth, Apple-like transitions

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [NotebookLM](https://notebooklm.google) for podcast summarization
- [OpenAI](https://openai.com) for AI-powered content generation
- [Firebase](https://firebase.google.com) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide](https://lucide.dev) for beautiful icons

## 📞 Support

If you have any questions or need help setting up the application, please open an issue in the repository.

---

Built with ❤️ for podcast enthusiasts and content creators.
