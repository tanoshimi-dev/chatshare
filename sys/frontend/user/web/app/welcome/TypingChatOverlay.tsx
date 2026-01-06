"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Message {
    text: string;
    isUser: boolean;
}

const messages: Message[] = [
    { text: "Traefikの設定方法について教えてください", isUser: true },
    {
        text: "Of course! I'd be happy to help. What are you working on?",
        isUser: false,
    },
    // { text: "I'm learning React and Next.js!", isUser: true },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false,
    },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false,
    },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false,
    },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false,
    },
];

export default function TypingChatOverlay() {
    const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        if (currentMessageIndex >= messages.length) {
            // Reset animation after a pause
            const timeout = setTimeout(() => {
                setDisplayedMessages([]);
                setCurrentMessageIndex(0);
                setCurrentText("");
                setCurrentCharIndex(0);
                setIsTyping(true);
            }, 3000);
            return () => clearTimeout(timeout);
        }

        const currentMessage = messages[currentMessageIndex];

        if (currentCharIndex < currentMessage.text.length) {
            const timeout = setTimeout(() => {
                setCurrentText(
                    (prev) => prev + currentMessage.text[currentCharIndex],
                );
                setCurrentCharIndex((prev) => prev + 1);
            }, 50);
            return () => clearTimeout(timeout);
        } else {
            // Finished typing current message
            const timeout = setTimeout(() => {
                setDisplayedMessages((prev) => [...prev, currentMessage]);
                setCurrentText("");
                setCurrentCharIndex(0);
                setCurrentMessageIndex((prev) => prev + 1);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [currentMessageIndex, currentCharIndex]);

    return (
        <div className="relative flex flex-row gap-4 items-center justify-center">
            <div className="relative">
                <Image
                    src="/images/programming_school_student.jpg"
                    alt="Programming School Student"
                    width={200}
                    height={200}
                    className="rounded-lg"
                />
            </div>
            <div className="relative">
                <Image
                    src="/images/girl_programmer.jpg"
                    alt="Girl Programmer"
                    width={200}
                    height={200}
                    className="rounded-lg"
                />
            </div>
            <div className="relative">
                <Image
                    src="/images/programming_school_boy afro.jpg"
                    alt="Programming School Boy Afro"
                    width={200}
                    height={200}
                    className="rounded-lg"
                />
            </div>

            {/* Chat overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-transparent rounded-2xl shadow-2xl p-4 max-w-md w-full backdrop-blur-none border-0">
                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                        {displayedMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                                        msg.isUser
                                            ? "bg-blue-500 text-white"
                                            : "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {currentText && (
                            <div
                                className={`flex ${
                                    messages[currentMessageIndex]?.isUser
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                                        messages[currentMessageIndex]?.isUser
                                            ? "bg-blue-500 text-white"
                                            : "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"
                                    }`}
                                >
                                    {currentText}
                                    <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
