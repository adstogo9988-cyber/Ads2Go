"use client";

import { useEffect } from "react";

export function DisableDevTools() {
  useEffect(() => {
    // Disable right-click menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable common dev tools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toLowerCase() : "";

      // F12 Inspect Element
      if (e.key === "F12") {
        e.preventDefault();
      }

      // Ctrl+Shift+I / Cmd+Option+I (DevTools Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "i") {
        e.preventDefault();
      }

      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "c") {
        e.preventDefault();
      }

      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "j") {
        e.preventDefault();
      }

      // Ctrl+U / Cmd+Option+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && key === "u") {
        e.preventDefault();
      }
    };

    // Attach listeners globally on document
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
