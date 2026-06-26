"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

type Message = {
    id: string;
    role: "user" | "bot";
    content: string;
};

export function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "init", role: "bot", content: "Hello! I am your AI Financial Assistant. How can I help you with project data today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const formatMessage = (text: string) => {
        let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
        formatted = formatted.replace(/__(.*?)__/g, "<u>$1</u>");
        return formatted;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        setInput("");
        
        const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: userText };
        setMessages(prev => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            const data = await fetchApi("/chat", {
                method: "POST",
                body: JSON.stringify({ message: userText })
            });

            const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", content: data.reply || "Sorry, the response format is invalid." };
            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", content: `Error: ${error.message || "Failed to contact server."}` };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px] max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="bg-[#2568C1] px-4 py-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Bot size={18} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Timesheed AI</h3>
                                    <p className="text-xs text-white/80">Financial Assistant</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "bot" && (
                                        <div className="w-8 h-8 rounded-full bg-[#2568C1]/10 flex items-center justify-center flex-shrink-0 text-[#2568C1]">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div 
                                        className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap shadow-sm ${msg.role === "user" ? "bg-[#2568C1] text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"}`}
                                        dangerouslySetInnerHTML={{ __html: msg.role === "bot" ? formatMessage(msg.content) : msg.content }}
                                    />
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-[#2568C1]/10 flex items-center justify-center flex-shrink-0 text-[#2568C1]">
                                        <Bot size={16} />
                                    </div>
                                    <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-100 text-slate-500 rounded-bl-sm flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="text-xs">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-slate-100">
                            <div className="relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask anything about the system..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#2568C1] resize-none"
                                    rows={1}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 p-1.5 text-[#2568C1] hover:bg-[#2568C1]/10 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-[#2568C1] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#2568C1]/30 hover:shadow-[#2568C1]/50 transition-shadow"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>
        </div>
    );
}
