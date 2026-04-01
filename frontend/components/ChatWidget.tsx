"use client";
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

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
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
          <div className="p-4 bg-indigo-600 text-white rounded-t-lg font-bold">Nexus AI Assistant</div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-indigo-100' : 'bg-gray-100'}`}>{m.text}</span>
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 border rounded px-2 py-1 outline-none" placeholder="Ask AI..." />
            <button onClick={handleSend} className="bg-indigo-600 p-2 rounded text-white"><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
