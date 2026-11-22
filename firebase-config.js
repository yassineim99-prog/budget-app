// Sharing between phones ("invite codes") uses a free Firebase project that YOU (the app owner) create once.
// Paste the web config from Firebase console → Project settings → Your apps → Web app → "Config".
// This config is not secret: it only identifies your project. Your security rules (firebase/firestore.rules) protect the data.
window.NISBA_FIREBASE = null;

/* Example — replace null above with your own values:
window.NISBA_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  appId: "1:1234567890:web:abcdef"
};
*/
