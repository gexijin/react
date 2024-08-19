import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user, create user document
        const role =
          isTeacher && teacherPassword === import.meta.env.VITE_TEACHER_PASSWORD
            ? "teacher"
            : "student";
        await setDoc(userRef, { role });

        // If it's a student, create an empty progress document
        if (role === "student") {
          const progressRef = doc(db, "progress", user.uid);
          await setDoc(progressRef, { completedLessons: [] });
        }
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="sign-in p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      <div className="mb-4">
        <label className="mr-2">
          <input
            type="checkbox"
            checked={isTeacher}
            onChange={(e) => setIsTeacher(e.target.checked)}
          />
          Sign in as teacher
        </label>
      </div>
      {isTeacher && (
        <input
          type="password"
          value={teacherPassword}
          onChange={(e) => setTeacherPassword(e.target.value)}
          placeholder="Teacher Password"
          className="mb-4 p-2 border rounded"
        />
      )}
      <button
        onClick={handleGoogleSignIn}
        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow flex items-center"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          className="w-6 h-6 mr-2"
        />
        Sign in with Google
      </button>
    </div>
  );
};

export default SignIn;
