"use client";

import { useEffect } from "react";
import { initializeNotifications } from "@/lib/notifications";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);

          // Initialize notifications after SW is ready
          if (navigator.serviceWorker.controller) {
            initializeNotifications();
          } else {
            navigator.serviceWorker.addEventListener("controllerchange", () => {
              initializeNotifications();
            });
          }
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  return null;
}
