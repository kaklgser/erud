import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { getChatResponse } from "../../services/chatbotService";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi there! I'm the PrimoBoost AI Assistant. I can help you with resume optimization, ATS scores, job listings, interview prep, pricing, and more.\n\nHow can I help you today?",
  timestamp: new Date(),
};

const FAQ_CHIPS = [
  "What is PrimoBoost AI?",
  "How do I optimize my resume?",
  "Tell me about pricing",
  "Job listings",
  "Interview prep",
  "How to contact support?",
];

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (isOpen) {
      setMessages([WELCOME_MESSAGE]);
    }
    setIsOpen((prev) => !prev);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await getChatResponse(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble responding right now. Please try again or email primoboostai@gmail.com for quick support.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const showChips = messages.length <= 1;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 mb-2 w-[340px] sm:w-[380px] overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center gap-3 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 py-3">
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <Bot className="h-4.5 w-4.5 text-emerald-400" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-gray-900 bg-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100">PrimoBoost AI</p>
                <p className="text-[11px] text-emerald-400/80">Online - Ready to help</p>
              </div>
              <button
                onClick={toggleOpen}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-200"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[380px] flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user"
                          ? "bg-cyan-500/15 text-cyan-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
                          msg.role === "user"
                            ? "rounded-br-md bg-cyan-600 text-white"
                            : "rounded-bl-md bg-gray-800 text-gray-200 ring-1 ring-gray-700/50"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p
                        className={`mt-1 text-[10px] text-gray-500 ${
                          msg.role === "user" ? "text-right" : ""
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-gray-800 px-4 py-3 ring-1 ring-gray-700/50">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {showChips && (
                <div className="border-t border-gray-700/50 bg-gray-800/50 px-3 py-2.5">
                  <p className="mb-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Quick Questions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FAQ_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        className="rounded-full border border-gray-600/50 bg-gray-800 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-gray-700/50 bg-gray-900 px-3 py-2.5"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-[13px] text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-shadow hover:shadow-xl hover:shadow-emerald-500/30"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          ) }
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
