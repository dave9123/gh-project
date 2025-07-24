"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  secondaryMessage?: string;
  className?: string;
}

export function LoadingScreen({
  message = "Loading...",
  secondaryMessage = "  Please wait while we load your data",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn("min-h-screen flex items-center justify-center", className)}
    >
      <div className="text-center">
        {/* Animated dots */}
        <motion.div
          className="flex justify-center gap-1 mt-4 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-medium text-foreground mb-2">
            {message}
          </h2>
          <p className="text-sm text-muted-foreground">{secondaryMessage}</p>
        </motion.div>
      </div>
    </div>
  );
}

// Compact loading component for smaller areas
export function LoadingSpinner({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn("flex items-center justify-center", className)}
    >
      <Loader2 className={cn("text-primary", sizeClasses[size])} />
    </motion.div>
  );
}
