#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function setupEnvironment() {
  console.log('🎯 Welcome to Podcast Refinery Setup!');
  console.log('This script will help you configure your environment variables.\n');

  // Check if .env.local already exists
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('❓ .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📋 Please provide your configuration details:\n');

  // Collect Firebase configuration
  console.log('🔥 Firebase Configuration:');
  const firebaseConfig = {
    apiKey: await question('API Key: '),
    authDomain: await question('Auth Domain: '),
    projectId: await question('Project ID: '),
    storageBucket: await question('Storage Bucket: '),
    messagingSenderId: await question('Messaging Sender ID: '),
    appId: await question('App ID: ')
  };

  // Collect OpenAI configuration
  console.log('\n🤖 OpenAI Configuration:');
  const openaiApiKey = await question('OpenAI API Key: ');

  // Generate .env.local content
  const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseConfig.appId}

# OpenAI Configuration
OPENAI_API_KEY=${openaiApiKey}

# Environment
NODE_ENV=development
`;

  // Write .env.local file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment configuration saved to .env.local');
    
    // Create .env.local.example if it doesn't exist
    const examplePath = path.join(__dirname, '.env.local.example');
    if (!fs.existsSync(examplePath)) {
      const exampleContent = envContent.replace(/=.*/g, '=your_value_here');
      fs.writeFileSync(examplePath, exampleContent);
      console.log('✅ Example file created at .env.local.example');
    }

    console.log('\n🚀 Next steps:');
    console.log('1. Run "npm run dev" to start the development server');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Create your first podcast entry!\n');
    
    console.log('📚 Need help?');
    console.log('- Check the README.md for detailed setup instructions');
    console.log('- Ensure your Firebase project has Firestore enabled');
    console.log('- Make sure your OpenAI API key has sufficient credits\n');

  } catch (error) {
    console.error('❌ Error writing environment file:', error.message);
  }

  rl.close();
}

// Validate Firebase configuration
function validateFirebaseConfig(config) {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !config[key] || config[key].trim() === '');
  
  if (missing.length > 0) {
    console.log(`❌ Missing Firebase configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Validate OpenAI API key format
function validateOpenAIKey(key) {
  if (!key || !key.startsWith('sk-')) {
    console.log('❌ OpenAI API key should start with "sk-"');
    return false;
  }
  
  return true;
}

if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };
