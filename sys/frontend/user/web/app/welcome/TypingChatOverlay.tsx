"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Message {
    text: string;
    isUser: boolean;
}

const messages: Message[] = [
    {
        text: "I received my Solana Mobile Seeker today and I'm excited to see what I can do with it as a software developer. What about building an app?",
        isUser: true,
    },
    {
        text: "Congratulations on getting your Solana Mobile Seeker! That's exciting - it's a great device for exploring mobile Web3 development.",
        isUser: false,
    },
    {
        text: "Given your background with React Native, Flutter, and backend systems, you're well-positioned to build some interesting apps. Here are some approaches to consider:",
        isUser: false,
    },
    {
        text: "Development Options",
        isUser: false,
    },
    {
        text: "React Native + Solana Mobile SDK",
        isUser: false,
    },
    {
        text: " * Most natural fit given your React Native experience",
        isUser: false,
    },
    {
        text: " * Use @solana-mobile/mobile-wallet-adapter-protocol for wallet interactions",
        isUser: false,
    },
    {
        text: " * Integrate with @solana/web3.js for blockchain operations",
        isUser: false,
    },
    {
        text: " * You already know the ecosystem, so the learning curve is mainly the Solana-specific parts",
        isUser: false,
    },                
];

export default function TypingChatOverlay() {
    const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [, setIsTyping] = useState(true);

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
        <div className="relative flex flex-row pt-4 gap-4 items-center justify-center">
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
            <div className="absolute inset-0 flex items-start justify-center pt-32 pointer-events-none">
                <div className="bg-transparent rounded-2xl shadow-2xl p-6 max-w-2xl w-full backdrop-blur-none border-0">
                    <div className="flex flex-col gap-3">
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
