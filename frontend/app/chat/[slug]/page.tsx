"use client";

// import "ios-vibrator-pro-max";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Lightbulb,
  ArrowUp,
  Menu,
  PenSquare,
  RefreshCcw,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { redirect, useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

type ActiveButton = "none" | "add";
type MessageType = "user" | "system";

interface Card {
  id: string;
  title: string;
  description: string;
  icon?: string;
  action?: string;
  metadata?: string;
}

interface Message {
  id: string;
  content: string;
  type: MessageType;
  completed?: boolean;
  newSection?: boolean;
  cards?: Card[];
}

interface MessageSection {
  id: string;
  messages: Message[];
  isNewSection: boolean;
  isActive?: boolean;
  sectionIndex: number;
}

interface StreamingWord {
  id: number;
  text: string;
}

interface FileUpload {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  isDocument: boolean;
}

interface AIResponse {
  success: boolean;
  response?: string;
  availableProducts?: string[];
  businessId?: string;
  error?: string;
}

// Faster word delay for smoother streaming
const WORD_DELAY = 40; // ms per word
const CHUNK_SIZE = 2; // Number of words to add at once

export default function ChatInterface() {
  const { slug } = useParams();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const newSectionRef = useRef<HTMLDivElement>(null);
  const [hasTyped, setHasTyped] = useState(false);
  const [activeButton, setActiveButton] = useState<ActiveButton>("none");
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageSections, setMessageSections] = useState<MessageSection[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [viewportHeight, setViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(
    new Set()
  );
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const shouldFocusAfterStreamingRef = useRef(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Set businessId from slug param when component mounts
  useEffect(() => {
    if (typeof slug === "string") {
      setBusinessId(slug);
    }
    const initializeChat = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessSlug: slug,
          }),
        });
        if (response.status == 404) {
          console.log("redirect");
          router.push("/404");
        }
        console.log(response);

        // If you need to set any state based on the response
        // setInitialChatData(data);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };

    initializeChat();
  }, [slug]);
  // Store selection state
  const selectionStateRef = useRef<{
    start: number | null;
    end: number | null;
  }>({ start: null, end: null });

  // Add conversation history state
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  // Constants for layout calculations to account for the padding values
  const HEADER_HEIGHT = 48; // 12px height + padding
  const INPUT_AREA_HEIGHT = 100; // Approximate height of input area with padding
  const TOP_PADDING = 48; // pt-12 (3rem = 48px)
  const BOTTOM_PADDING = 128; // pb-32 (8rem = 128px)
  const ADDITIONAL_OFFSET = 16; // Reduced offset for fine-tuning

  // Check if device is mobile and get viewport height
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);

      // Capture the viewport height
      const vh = window.innerHeight;
      setViewportHeight(vh);

      // Apply fixed height to main container on mobile
      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`;
      }
    };

    checkMobileAndViewport();

    // Set initial height
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile
        ? `${viewportHeight}px`
        : "100svh";
    }

    // Update on resize
    window.addEventListener("resize", checkMobileAndViewport);

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport);
    };
  }, [isMobile, viewportHeight]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content:
          "Halo! Saya asisten AI layanan pencetakan Anda. Saya bisa membantu Anda dengan penawaran harga, informasi produk, unggah berkas, dan pertanyaan umum seputar layanan pencetakan kami. Ada yang bisa saya bantu hari ini?",
        type: "system",
        completed: true,
      };
      setMessages([welcomeMessage]);
      setCompletedMessages(new Set(["welcome"]));
    }
  }, []);

  // Update conversation history whenever messages change
  useEffect(() => {
    // Filter out incomplete streaming messages and welcome message for conversation history
    const historyMessages = messages.filter(
      (msg) => msg.completed && msg.id !== "welcome"
    );
    setConversationHistory(historyMessages);
  }, [messages]);

  // Organize messages into sections
  useEffect(() => {
    if (messages.length === 0) {
      setMessageSections([]);
      setActiveSectionId(null);
      return;
    }

    const sections: MessageSection[] = [];
    let currentSection: MessageSection = {
      id: `section-${Date.now()}-0`,
      messages: [],
      isNewSection: false,
      sectionIndex: 0,
    };

    messages.forEach((message) => {
      if (message.newSection) {
        if (currentSection.messages.length > 0) {
          sections.push({
            ...currentSection,
            isActive: false,
          });
        }

        const newSectionId = `section-${Date.now()}-${sections.length}`;
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        };

        setActiveSectionId(newSectionId);
      } else {
        currentSection.messages.push(message);
      }
    });

    if (currentSection.messages.length > 0) {
      sections.push(currentSection);
    }

    setMessageSections(sections);
  }, [messages]);

  useEffect(() => {
    if (messageSections.length > 1) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current;

        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [messageSections]);

  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current && !isMobile) {
      focusTextarea();
      shouldFocusAfterStreamingRef.current = false;
    }
  }, [isStreaming, isMobile]);

  const getContentHeight = () => {
    return viewportHeight - TOP_PADDING - BOTTOM_PADDING - ADDITIONAL_OFFSET;
  };

  const saveSelectionState = () => {
    if (textareaRef.current) {
      selectionStateRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

  const restoreSelectionState = () => {
    const textarea = textareaRef.current;
    const { start, end } = selectionStateRef.current;

    if (textarea && start !== null && end !== null) {
      // Focus first, then set selection range
      textarea.focus();
      textarea.setSelectionRange(start, end);
    } else if (textarea) {
      // If no selection was saved, just focus
      textarea.focus();
    }
  };

  const focusTextarea = () => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  };

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking directly on the container, not on buttons or other interactive elements
    if (
      e.target === e.currentTarget ||
      (e.currentTarget === inputContainerRef.current &&
        !(e.target as HTMLElement).closest("button"))
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const simulateTextStreaming = async (text: string) => {
    // Split text into words
    const words = text.split(" ");
    let currentIndex = 0;
    setStreamingWords([]);
    setIsStreaming(true);

    return new Promise<void>((resolve) => {
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          // Add a few words at a time
          const nextIndex = Math.min(currentIndex + CHUNK_SIZE, words.length);
          const newWords = words.slice(currentIndex, nextIndex);

          setStreamingWords((prev) => [
            ...prev,
            {
              id: Date.now() + currentIndex,
              text: newWords.join(" ") + " ",
            },
          ]);

          currentIndex = nextIndex;
        } else {
          clearInterval(streamInterval);
          resolve();
        }
      }, WORD_DELAY);
    });
  };

  // File upload function
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("businessSlug", businessId);
      formData.append("chatId", "general");
      formData.append(
        "conversationHistory",
        JSON.stringify(conversationHistory)
      );

      const response = await fetch(`http://localhost:4000/api/ai/upload`, {
        method: "POST",

        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      if (result.success) {
        const newFile: FileUpload = {
          id: result.file.id,
          originalName: result.file.originalName,
          url: result.file.url,
          mimeType: result.file.mimeType,
          size: result.file.size,
          isImage: result.file.isImage,
          isDocument: result.file.isDocument,
        };

        setUploadedFiles((prev) => [...prev, newFile]);

        // Add a message about the uploaded file
        const fileMessage = {
          id: `file-${Date.now()}`,
          content: `📎 Uploaded: ${file.name} (${(
            file.size /
            1024 /
            1024
          ).toFixed(2)} MB)`,
          type: "user" as MessageType,
          newSection: messages.length > 0,
          completed: true, // Mark file upload messages as completed
        };

        setMessages((prev) => [...prev, fileMessage]);

        // Mark file message as completed
        setCompletedMessages((prev) => new Set(prev).add(fileMessage.id));

        // Add AI response about the uploaded file if available
        if (result.file.response) {
          const aiResponseMessage = {
            id: `ai-upload-${Date.now()}`,
            content: result.file.response,
            type: "system" as MessageType,
            completed: true,
          };

          setMessages((prev) => [...prev, aiResponseMessage]);
          setCompletedMessages((prev) =>
            new Set(prev).add(aiResponseMessage.id)
          );
        }

        return result.file;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Real AI API call
  const callAIAPI = async (userMessage: string): Promise<string> => {
    try {
      // Debug: Log conversation history being sent
      console.log("Sending conversation history:", conversationHistory);

      const response = await fetch(`http://localhost:4000/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFAYS5jb20iLCJpYXQiOjE3NTM0MDg5NDh9.Pk7W7YSmJSY8maYxDaZIIuQdVGNfMNTtnJFieVDAfBQ`,
        },
        body: JSON.stringify({
          message: userMessage,
          businessSlug: businessId,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AIResponse = await response.json();

      if (result.success && result.response) {
        return result.response;
      } else {
        throw new Error(result.error || "No response from AI");
      }
    } catch (error) {
      console.error("AI API call error:", error);
      return "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.";
    }
  };

  const simulateAIResponse = async (userMessage: string) => {
    // Create a new message with empty content first
    const messageId = Date.now().toString();
    setStreamingMessageId(messageId);

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        content: "",
        type: "system",
      },
    ]);

    // Add a delay before the second vibration
    setTimeout(() => {
      // Add vibration when streaming begins
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 200);

    try {
      // Call the real AI API
      const response = await callAIAPI(userMessage);

      // Stream the text
      await simulateTextStreaming(response);

      // Update with complete message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: response, completed: true }
            : msg
        )
      );

      // Add to completed messages set to prevent re-animation
      setCompletedMessages((prev) => new Set(prev).add(messageId));

      // Add vibration when streaming ends
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Update with error message
      const errorMessage =
        "I apologize, but I encountered an error. Please try again.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: errorMessage, completed: true }
            : msg
        )
      );

      setCompletedMessages((prev) => new Set(prev).add(messageId));
    }

    // Reset streaming state
    setStreamingWords([]);
    setStreamingMessageId(null);
    setIsStreaming(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Only allow input changes when not streaming
    if (!isStreaming) {
      setInputValue(newValue);

      if (newValue.trim() !== "" && !hasTyped) {
        setHasTyped(true);
      } else if (newValue.trim() === "" && hasTyped) {
        setHasTyped(false);
      }

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 160));
        textarea.style.height = `${newHeight}px`;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming && !isUploading) {
      // Add vibration when message is submitted
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      const userMessage = inputValue.trim();

      // Add as a new section if messages already exist
      const shouldAddNewSection = messages.length > 0;

      const newUserMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        type: "user" as MessageType,
        newSection: shouldAddNewSection,
        completed: true, // Mark user messages as completed immediately
      };

      // Reset input before starting the AI response
      setInputValue("");
      setHasTyped(false);
      setActiveButton("none");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Add the message after resetting input
      setMessages((prev) => [...prev, newUserMessage]);

      // Mark user message as completed
      setCompletedMessages((prev) => new Set(prev).add(newUserMessage.id));

      // Only focus the textarea on desktop, not on mobile
      if (!isMobile) {
        focusTextarea();
      } else {
        // On mobile, blur the textarea to dismiss the keyboard
        if (textareaRef.current) {
          textareaRef.current.blur();
        }
      }

      // Start AI response
      simulateAIResponse(userMessage);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const triggerFileUpload = () => {
    if (!isStreaming && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    setCompletedMessages(new Set());
    setMessageSections([]);
    setActiveSectionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Cmd+Enter on both mobile and desktop
    if (!isStreaming && e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    // Only handle regular Enter key (without Shift) on desktop
    if (!isStreaming && !isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleButton = (button: ActiveButton) => {
    if (!isStreaming) {
      // Save the current selection state before toggling
      saveSelectionState();

      setActiveButton((prev) => (prev === button ? "none" : button));

      // Restore the selection state after toggling
      setTimeout(() => {
        restoreSelectionState();
      }, 0);
    }
  };

  const renderMessage = (message: Message) => {
    const isCompleted = completedMessages.has(message.id);

    return (
      <div
        key={message.id}
        className={cn(
          "flex flex-col",
          message.type === "user" ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl",
            message.type === "user"
              ? "bg-white border border-gray-200 rounded-br-none"
              : "text-gray-900"
          )}
        >
          {/* For user messages or completed system messages, render without animation */}
          {message.content && (
            <div
              className={
                message.type === "system" && !isCompleted
                  ? "animate-fade-in"
                  : ""
              }
            >
              {message.type === "system" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <span>{message.content}</span>
              )}
            </div>
          )}

          {/* For streaming messages, render with animation */}
          {message.id === streamingMessageId && (
            <div className="inline">
              <div className="prose prose-sm max-w-none inline">
                <ReactMarkdown>
                  {streamingWords
                    .map((word) => (
                      <span key={word.id} className="animate-fade-in inline">
                        {word.text}
                      </span>
                    ))
                    .join("")}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Render cards if they exist and message is completed */}
        {message.cards && message.completed && (
          <div className="w-full max-w-[80%] mt-3 space-y-3">
            {message.cards.map((card, index) => (
              <div
                key={card.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {card.icon && <span className="text-lg">{card.icon}</span>}
                    <h3 className="font-medium text-gray-900">{card.title}</h3>
                  </div>
                  {card.metadata && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {card.metadata}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {card.description}
                </p>
                {card.action && (
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                    {card.action} →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message actions */}
        {message.type === "system" && message.completed && (
          <div className="flex items-center gap-2 px-4 mt-1 mb-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Determine if a section should have fixed height (only for sections after the first)
  const shouldApplyHeight = (sectionIndex: number) => {
    return sectionIndex > 0;
  };

  return (
    <div
      ref={mainContainerRef}
      className="bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: isMobile ? `${viewportHeight}px` : "100svh" }}
    >
      <header className="fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-20 bg-gray-50">
        <div className="w-full flex items-center justify-between px-2">
          <h1 className="text-base font-medium text-gray-800">Asisten AI</h1>
        </div>
      </header>

      <div
        ref={chatContainerRef}
        className="flex-grow pb-32 pt-12 px-4 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messageSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              ref={
                sectionIndex === messageSections.length - 1 &&
                section.isNewSection
                  ? newSectionRef
                  : null
              }
            >
              {section.isNewSection && (
                <div
                  style={
                    section.isActive && shouldApplyHeight(section.sectionIndex)
                      ? { height: `${getContentHeight()}px` }
                      : {}
                  }
                  className="pt-4 flex flex-col justify-start"
                >
                  {section.messages.map((message) => renderMessage(message))}
                </div>
              )}

              {!section.isNewSection && (
                <div>
                  {section.messages.map((message) => renderMessage(message))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx,.xls,.xlsx"
            onChange={handleFileInputChange}
          />

          <div
            ref={inputContainerRef}
            className={cn(
              "relative w-full rounded-3xl border border-gray-200 bg-white p-3 cursor-text",
              (isStreaming || isUploading) && "opacity-80"
            )}
            onClick={handleInputContainerClick}
          >
            <div className="pb-9">
              <Textarea
                ref={textareaRef}
                placeholder={
                  isStreaming
                    ? "Waiting for response..."
                    : isUploading
                    ? "Uploading file..."
                    : "Ask about printing services..."
                }
                className="min-h-[24px] max-h-[160px] w-full rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-base pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isStreaming || isUploading}
                onFocus={() => {
                  // Ensure the textarea is scrolled into view when focused
                  if (textareaRef.current) {
                    textareaRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              />
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                      activeButton === "add" && "bg-gray-100 border-gray-300"
                    )}
                    onClick={triggerFileUpload}
                    disabled={isStreaming || isUploading}
                  >
                    <Paperclip
                      className={cn(
                        "h-4 w-4 text-gray-500",
                        isUploading && "animate-spin",
                        activeButton === "add" && "text-gray-700"
                      )}
                    />
                    <span className="sr-only">Upload File</span>
                  </Button>
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200",
                    hasTyped ? "bg-black scale-110" : "bg-gray-200"
                  )}
                  disabled={!inputValue.trim() || isStreaming || isUploading}
                >
                  <ArrowUp
                    className={cn(
                      "h-4 w-4 transition-colors",
                      hasTyped ? "text-white" : "text-gray-500"
                    )}
                  />
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
