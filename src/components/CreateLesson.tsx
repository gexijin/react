import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

const CreateLesson: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], correctAnswer: 0 },
    ]);
  };

  const handleQuestionChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lessonsRef = collection(db, "lessons");
      const lessonsQuery = query(lessonsRef, orderBy("order", "desc"));
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lastLesson = lessonsSnapshot.docs[0];
      const newOrder = lastLesson ? lastLesson.data().order + 1 : 1;

      await addDoc(lessonsRef, {
        title,
        content,
        questions,
        order: newOrder,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating lesson:", error);
    }
  };

  return (
    <div className="create-lesson p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Lesson</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded"
            rows={5}
            required
          ></textarea>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Quiz Questions</h2>
          {questions.map((question, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <input
                type="text"
                value={question.text}
                onChange={(e) =>
                  handleQuestionChange(index, "text", e.target.value)
                }
                placeholder="Question text"
                className="w-full p-2 border rounded mb-2"
                required
              />
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(index, optionIndex, e.target.value)
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-grow p-2 border rounded mr-2"
                    required
                  />
                  <input
                    type="radio"
                    name={`correct-answer-${index}`}
                    checked={question.correctAnswer === optionIndex}
                    onChange={() =>
                      handleQuestionChange(index, "correctAnswer", optionIndex)
                    }
                    required
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Question
          </button>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Lesson
        </button>
      </form>
    </div>
  );
};

export default CreateLesson;
