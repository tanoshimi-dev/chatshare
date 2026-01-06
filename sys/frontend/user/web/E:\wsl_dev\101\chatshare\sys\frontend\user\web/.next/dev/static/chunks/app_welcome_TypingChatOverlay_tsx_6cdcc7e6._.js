(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/welcome/TypingChatOverlay.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TypingChatOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const messages = [
    {
        text: "Traefikの設定方法について教えてください",
        isUser: true
    },
    {
        text: "Of course! I'd be happy to help. What are you working on?",
        isUser: false
    },
    // { text: "I'm learning React and Next.js!", isUser: true },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false
    },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false
    },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false
    },
    {
        text: "Great choice! Let's build something amazing together.",
        isUser: false
    }
];
function TypingChatOverlay() {
    _s();
    const [displayedMessages, setDisplayedMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentMessageIndex, setCurrentMessageIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [currentText, setCurrentText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [currentCharIndex, setCurrentCharIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TypingChatOverlay.useEffect": ()=>{
            if (currentMessageIndex >= messages.length) {
                // Reset animation after a pause
                const timeout = setTimeout({
                    "TypingChatOverlay.useEffect.timeout": ()=>{
                        setDisplayedMessages([]);
                        setCurrentMessageIndex(0);
                        setCurrentText("");
                        setCurrentCharIndex(0);
                        setIsTyping(true);
                    }
                }["TypingChatOverlay.useEffect.timeout"], 3000);
                return ({
                    "TypingChatOverlay.useEffect": ()=>clearTimeout(timeout)
                })["TypingChatOverlay.useEffect"];
            }
            const currentMessage = messages[currentMessageIndex];
            if (currentCharIndex < currentMessage.text.length) {
                const timeout = setTimeout({
                    "TypingChatOverlay.useEffect.timeout": ()=>{
                        setCurrentText({
                            "TypingChatOverlay.useEffect.timeout": (prev)=>prev + currentMessage.text[currentCharIndex]
                        }["TypingChatOverlay.useEffect.timeout"]);
                        setCurrentCharIndex({
                            "TypingChatOverlay.useEffect.timeout": (prev)=>prev + 1
                        }["TypingChatOverlay.useEffect.timeout"]);
                    }
                }["TypingChatOverlay.useEffect.timeout"], 50);
                return ({
                    "TypingChatOverlay.useEffect": ()=>clearTimeout(timeout)
                })["TypingChatOverlay.useEffect"];
            } else {
                // Finished typing current message
                const timeout = setTimeout({
                    "TypingChatOverlay.useEffect.timeout": ()=>{
                        setDisplayedMessages({
                            "TypingChatOverlay.useEffect.timeout": (prev)=>[
                                    ...prev,
                                    currentMessage
                                ]
                        }["TypingChatOverlay.useEffect.timeout"]);
                        setCurrentText("");
                        setCurrentCharIndex(0);
                        setCurrentMessageIndex({
                            "TypingChatOverlay.useEffect.timeout": (prev)=>prev + 1
                        }["TypingChatOverlay.useEffect.timeout"]);
                    }
                }["TypingChatOverlay.useEffect.timeout"], 500);
                return ({
                    "TypingChatOverlay.useEffect": ()=>clearTimeout(timeout)
                })["TypingChatOverlay.useEffect"];
            }
        }
    }["TypingChatOverlay.useEffect"], [
        currentMessageIndex,
        currentCharIndex
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex flex-row gap-4 items-center justify-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    src: "/images/programming_school_student.jpg",
                    alt: "Programming School Student",
                    width: 200,
                    height: 200,
                    className: "rounded-lg"
                }, void 0, false, {
                    fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                    lineNumber: 81,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                lineNumber: 80,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    src: "/images/girl_programmer.jpg",
                    alt: "Girl Programmer",
                    width: 200,
                    height: 200,
                    className: "rounded-lg"
                }, void 0, false, {
                    fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                    lineNumber: 90,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                lineNumber: 89,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    src: "/images/programming_school_boy afro.jpg",
                    alt: "Programming School Boy Afro",
                    width: 200,
                    height: 200,
                    className: "rounded-lg"
                }, void 0, false, {
                    fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                    lineNumber: 99,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                lineNumber: 98,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 flex items-center justify-center pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-transparent rounded-2xl shadow-2xl p-4 max-w-md w-full backdrop-blur-none border-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3 max-h-64 overflow-y-auto",
                        children: [
                            displayedMessages.map((msg, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex ${msg.isUser ? "justify-end" : "justify-start"}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `px-4 py-2 rounded-2xl max-w-[80%] ${msg.isUser ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"}`,
                                        children: msg.text
                                    }, void 0, false, {
                                        fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                                        lineNumber: 117,
                                        columnNumber: 33
                                    }, this)
                                }, idx, false, {
                                    fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                                    lineNumber: 113,
                                    columnNumber: 29
                                }, this)),
                            currentText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex ${messages[currentMessageIndex]?.isUser ? "justify-end" : "justify-start"}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `px-4 py-2 rounded-2xl max-w-[80%] ${messages[currentMessageIndex]?.isUser ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white"}`,
                                    children: [
                                        currentText,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-0.5 h-4 bg-current ml-1 animate-pulse"
                                        }, void 0, false, {
                                            fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                                            lineNumber: 144,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                                    lineNumber: 136,
                                    columnNumber: 33
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                                lineNumber: 129,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                        lineNumber: 111,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                    lineNumber: 110,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
                lineNumber: 109,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/welcome/TypingChatOverlay.tsx",
        lineNumber: 79,
        columnNumber: 9
    }, this);
}
_s(TypingChatOverlay, "4n69kUTEK+yi7tcP+i4a2UczNXo=");
_c = TypingChatOverlay;
var _c;
__turbopack_context__.k.register(_c, "TypingChatOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_welcome_TypingChatOverlay_tsx_6cdcc7e6._.js.map