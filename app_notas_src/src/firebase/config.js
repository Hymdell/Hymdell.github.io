import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAedvSjQ6NwyECX30eMIu-MGZyUgLZAerU",
  authDomain: "app-anotacoes-e8118.firebaseapp.com",
  projectId: "app-anotacoes-e8118",
  storageBucket: "app-anotacoes-e8118.firebasestorage.app",
  messagingSenderId: "184943160004",
  appId: "1:184943160004:web:5785e539b20288ea333791",
  measurementId: "G-6YPPZ0VP8W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };
