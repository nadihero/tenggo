"use client";

import { useEffect, useCallback, useRef } from "react";
import { format, parse } from "date-fns";
import { useTaskStore, TimeBlock } from "@/store/useTaskStore";

// Sound notification using Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Second tone
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    oscillator2.frequency.value = 1100;
    oscillator2.type = "sine";
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
    gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.4);
    gainNode2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.9
    );
    oscillator2.start(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 0.9);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

// Show browser notification
const showNotification = (block: TimeBlock) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification("TimeBlock - Time's Up!", {
      body: `"${block.title}" starts now (${block.startTime})`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: `block-${block.id}`,
      requireInteraction: true,
      data: {
        blockId: block.id,
        url: "/",
      },
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 30 seconds
    setTimeout(() => {
      notification.close();
    }, 30000);
  } catch (error) {
    console.error("Error showing notification:", error);
  }
};

// Send push notification via service worker (for background notifications)
const sendPushNotification = async (block: TimeBlock) => {
  try {
    // Try service worker notification first
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: "TimeBlock - Time's Up!",
        body: `"${block.title}" starts now (${block.startTime})`,
        tag: `block-${block.id}`,
        data: {
          blockId: block.id,
          url: '/',
        },
      });
      return;
    }

    // Fallback to registration.showNotification
    if (navigator.serviceWorker?.ready) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("TimeBlock - Time's Up!", {
        body: `"${block.title}" starts now (${block.startTime})`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `block-${block.id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
          blockId: block.id,
          url: "/",
        },
      } as NotificationOptions);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

// Register custom service worker for notifications
const registerCustomSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/custom-sw.js', {
        scope: '/',
      });
      console.log('[TimeBlock] Custom SW registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[TimeBlock] Custom SW registration failed:', error);
    }
  }
  return null;
};

export const useAlarm = () => {
  const { blocks, soundEnabled, markNotified, getActiveBlocksForToday } =
    useTaskStore();
  const checkedBlocksRef = useRef<Set<string>>(new Set());
  const swRegisteredRef = useRef(false);

  const checkAlarms = useCallback(() => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");
    const today = format(now, "yyyy-MM-dd");

    // Get today's active blocks
    const todayBlocks = blocks.filter(
      (block) =>
        block.date === today && !block.completed && !block.notified
    );

    for (const block of todayBlocks) {
      // Check if current time matches block start time (within 1 minute window)
      if (block.startTime === currentTime && !checkedBlocksRef.current.has(block.id)) {
        checkedBlocksRef.current.add(block.id);

        // Play sound if enabled
        if (soundEnabled) {
          playNotificationSound();
        }

        // Show notification
        showNotification(block);
        sendPushNotification(block);

        // Mark as notified
        markNotified(block.id);

        console.log(`Alarm triggered for: ${block.title} at ${currentTime}`);
      }
    }

    // Clean up old checked blocks (keep only last 100 to prevent memory leak)
    if (checkedBlocksRef.current.size > 100) {
      const blocksArray = Array.from(checkedBlocksRef.current);
      checkedBlocksRef.current = new Set(blocksArray.slice(-50));
    }
  }, [blocks, soundEnabled, markNotified]);

  useEffect(() => {
    // Register custom service worker on mount
    if (!swRegisteredRef.current) {
      swRegisteredRef.current = true;
      registerCustomSW();
    }

    // Check immediately on mount
    checkAlarms();

    // Set up interval to check every 10 seconds for more responsive alarms
    const interval = setInterval(checkAlarms, 10000);

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAlarms();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkAlarms]);

  // Test notification function
  const testNotification = useCallback(async () => {
    // Play sound
    if (soundEnabled) {
      playNotificationSound();
    }

    // Request permission if needed
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }

    // Show test notification
    if (Notification.permission === "granted") {
      try {
        // Try service worker first
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: "TimeBlock - Test",
            body: "Notifications are working! 🎉",
            tag: "test-notification",
            data: { url: '/' },
          });
        } else if (navigator.serviceWorker?.ready) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("TimeBlock - Test", {
            body: "Notifications are working! 🎉",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-72x72.png",
            tag: "test-notification",
            vibrate: [200, 100, 200],
          } as NotificationOptions);
        } else {
          // Fallback to regular notification
          new Notification("TimeBlock - Test", {
            body: "Notifications are working! 🎉",
            icon: "/icons/icon-192x192.png",
          });
        }
      } catch (error) {
        console.error("Test notification error:", error);
        // Final fallback
        new Notification("TimeBlock - Test", {
          body: "Notifications are working! 🎉",
        });
      }
    }
  }, [soundEnabled]);

  return { checkAlarms, testNotification };
};

// Hook to handle notification permission
export const useNotificationPermission = () => {
  const { notificationPermission, setNotificationPermission } = useTaskStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    // Set initial permission state
    setNotificationPermission(Notification.permission);
  }, [setNotificationPermission]);

  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, [setNotificationPermission]);

  return {
    permission: notificationPermission,
    requestPermission,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
};
