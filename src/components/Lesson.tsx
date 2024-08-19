import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";
import confetti from "canvas-confetti";
import ChatBot from "./ChatBot";

interface Question {
  text: string;
  type: "multiple-choice" | "short-answer";
  options?: string[];
  correctAnswer: number | string;
  keyword?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  questions: Question[];
}

const Lesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(
    null,
  );
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (id) {
        try {
          const lessonRef = doc(db, "lessons", id);
          const lessonSnap = await getDoc(lessonRef);
          if (lessonSnap.exists()) {
            setLesson({ id: lessonSnap.id, ...lessonSnap.data() } as Lesson);
          } else {
            setError("Lesson not found");
          }
        } catch (err) {
          setError("Error fetching lesson");
          console.error("Error fetching lesson:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLesson();
  }, [id]);

  const handleAnswerSelection = (answer: number | string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null && lesson) {
      const currentQuestion = lesson.questions[currentQuestionIndex];
      let isCorrect = false;

      if (currentQuestion.type === "multiple-choice") {
        isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      } else if (currentQuestion.type === "short-answer") {
        const userAnswer = (selectedAnswer as string).toLowerCase();
        const correctAnswer = (
          currentQuestion.correctAnswer as string
        ).toLowerCase();
        const keyword = currentQuestion.keyword?.toLowerCase();

        isCorrect =
          userAnswer === correctAnswer ||
          (keyword && userAnswer.includes(keyword));
      }

      if (isCorrect) {
        setScore(score + 1);
        setFeedback("Correct! Great job!");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setFeedback(
          `Wrong. The correct answer is: ${currentQuestion.correctAnswer}`,
        );
      }

      setTimeout(() => {
        setFeedback(null);
        if (currentQuestionIndex < lesson.questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(null);
        } else {
          setQuizCompleted(true);
          updateProgress();
        }
      }, 2000);
    }
  };

  const updateProgress = async () => {
    if (auth.currentUser && id) {
      try {
        const progressRef = doc(db, "progress", auth.currentUser.uid);
        const progressSnap = await getDoc(progressRef);

        if (!progressSnap.exists()) {
          await setDoc(progressRef, { completedLessons: [id] });
        } else {
          await updateDoc(progressRef, {
            completedLessons: arrayUnion(id),
          });
        }
      } catch (err) {
        console.error("Error updating progress:", err);
        setError("Failed to update progress");
      }
    }
  };

  const renderQuestion = (question: Question) => {
    if (question.type === "multiple-choice" && question.options) {
      return (
        <div className="question mb-6">
          <p className="font-medium text-lg mb-4">{question.text}</p>
          {question.options.map((option, index) => (
            <div key={index} className="option mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => handleAnswerSelection(index)}
                  className="mr-3"
                />
                <span className="text-lg">{option}</span>
              </label>
            </div>
          ))}
        </div>
      );
    } else if (question.type === "short-answer") {
      return (
        <div className="question mb-6">
          <p className="font-medium text-lg mb-4">{question.text}</p>
          <input
            type="text"
            value={(selectedAnswer as string) || ""}
            onChange={(e) => handleAnswerSelection(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Type your answer here"
          />
        </div>
      );
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (!lesson) {
    return <div className="text-center mt-8">Lesson not found</div>;
  }

  return (
    <div className="lesson p-4 max-w-3xl mx-auto relative">
      <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
      <div className="lesson-content mb-8">
        <p className="text-lg leading-relaxed">{lesson.content}</p>
      </div>
      {!quizCompleted ? (
        <div className="quiz bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Quiz</h2>
          {renderQuestion(lesson.questions[currentQuestionIndex])}
          {feedback && (
            <div
              className={`mb-4 p-2 rounded ${feedback.includes("Correct") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {feedback}
            </div>
          )}
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg text-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {currentQuestionIndex === lesson.questions.length - 1
              ? "Finish"
              : "Next"}
          </button>
        </div>
      ) : (
        <div className="quiz-results bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Quiz Results</h2>
          <p className="text-lg mb-4">
            You scored {score} out of {lesson.questions.length}.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-green-500 text-white px-6 py-2 rounded-lg text-lg font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      )}
      <ChatBot lessonTitle={lesson.title} lessonContent={lesson.content} />
    </div>
  );
};

export default Lesson;
