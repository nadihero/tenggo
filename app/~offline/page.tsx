"use client";

import { Clock, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
      <p className="text-gray-500 text-center max-w-sm mb-6">
        Don&apos;t worry! TimeBlock works offline. Your data is safely stored on your device.
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Clock className="w-4 h-4" />
        <span>Your schedule is still available</span>
      </div>
      <Button onClick={() => window.location.reload()} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
