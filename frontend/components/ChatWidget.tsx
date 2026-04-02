"use client";
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "Hi! I'm your ERP AI. Ask me anything about your data." }]);

  const handleSend = async () => {
    if (!query) return;
    const userMsg = { role: "user", text: query };
    setMessages([...messages, userMsg]);
    setQuery("");

    try {
      const res = await fetch("https://nexus-erp-f8q9.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: "Error connecting to AI brain." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-indigo-600 p-4 rounded-full shadow-lg hover:bg-indigo-700 text-white">
        {isOpen ? <X /> : <MessageCircle />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-slate-700">
          <div className="p-4 bg-indigo-600 text-white rounded-t-lg font-bold">Nexus AI Assistant</div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-200'}`}>
                    {m.role === 'ai' ? (
                        <div className="text-sm flex flex-col gap-2 text-left">
                            <ReactMarkdown
                                components={{
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-indigo-400 dark:text-indigo-300" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-1" {...props} />
                                }}
                            >
                                {m.text}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-sm">{m.text}</div>
                    )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t dark:border-slate-700 flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 border dark:border-slate-700 rounded px-2 py-1 outline-none dark:bg-slate-800 dark:text-white" placeholder="Ask AI..." />
            <button onClick={handleSend} className="bg-indigo-600 p-2 rounded text-white"><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
