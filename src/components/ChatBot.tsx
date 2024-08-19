import React, { useState, useEffect, useRef } from "react";
import OpenAI from "openai";

interface ChatBotProps {
  lessonTitle: string;
  lessonContent: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ lessonTitle, lessonContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_CHATGPT_API_KEY,
    dangerouslyAllowBrowser: true, // Note: This is not recommended for production
  });

  useEffect(() => {
    setMessages([
      {
        role: "system",
        content: `You are a helpful tutor. The student is learning about ${lessonTitle}. The learning content is ${lessonContent}`,
      },
    ]);
  }, [lessonTitle, lessonContent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [...messages, userMessage],
      });

      const assistantMessage: Message = {
        role: "assistant",
        content:
          response.choices[0].message.content ||
          "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Lesson Assistant</h3>
            <button onClick={() => setIsOpen(false)}>&times;</button>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            {messages.slice(1).map((message, index) => (
              <div
                key={index}
                className={`mb-2 ${message.role === "user" ? "text-right" : "text-left"}`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    message.role === "user" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  {message.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-grow p-2 border rounded-l-lg"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded-r-lg"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg"
        >
          Chat
        </button>
      )}
    </div>
  );
};

export default ChatBot;
