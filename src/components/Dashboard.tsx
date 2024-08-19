import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

interface Lesson {
  id: string;
  title: string;
  order: number;
}

const Dashboard: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRoleAndLessons = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        }

        const lessonsQuery = query(collection(db, "lessons"), orderBy("order"));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsList = lessonsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Lesson,
        );
        setLessons(lessonsList);

        if (userSnap.data().role === "student") {
          const progressRef = doc(db, "progress", auth.currentUser.uid);
          const progressSnap = await getDoc(progressRef);
          if (progressSnap.exists()) {
            const completedLessons = progressSnap.data().completedLessons || [];
            setProgress((completedLessons.length / lessonsList.length) * 100);
          }
        }
      }
    };

    fetchUserRoleAndLessons();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="dashboard p-4 relative">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {userRole === "teacher" && (
        <Link
          to="/create-lesson"
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block"
        >
          Create New Lesson
        </Link>
      )}
      {userRole === "student" && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Your Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>{progress.toFixed(2)}% complete</p>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2">Lessons</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.id} className="mb-2">
            <Link
              to={`/lesson/${lesson.id}`}
              className="text-blue-500 hover:underline"
            >
              {lesson.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
