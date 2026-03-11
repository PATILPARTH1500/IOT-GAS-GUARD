import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA2QhR0Re9jgMYMF24kY4_86CzPdRz-hDw",
  authDomain: "gas-sensor-webapp.firebaseapp.com",
  databaseURL: "https://gas-sensor-webapp-default-rtdb.firebaseio.com",
  projectId: "gas-sensor-webapp",
  storageBucket: "gas-sensor-webapp.firebasestorage.app",
  messagingSenderId: "391417878594",
  appId: "1:391417878594:web:c85d58f0dff0e6452b35db"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
