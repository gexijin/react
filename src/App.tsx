import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { auth } from "./firebase";
import SignIn from "./components/SignIn";
import Dashboard from "./components/Dashboard";
import CreateLesson from "./components/CreateLesson";
import Lesson from "./components/Lesson";
import { User as FirebaseUser } from "firebase/auth";

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            <Route
              path="/signin"
              element={!user ? <SignIn /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/signin" />}
            />
            <Route
              path="/create-lesson"
              element={user ? <CreateLesson /> : <Navigate to="/signin" />}
            />
            <Route
              path="/lesson/:id"
              element={user ? <Lesson /> : <Navigate to="/signin" />}
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/signin"} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
