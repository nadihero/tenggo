"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskStore, CATEGORY_COLORS, CategoryColor } from "@/store/useTaskStore";
import { format, parseISO, addDays, subDays, isToday } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Bell,
  Check,
  Trash2,
  Pencil,
  Volume2,
  VolumeX,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Sunrise
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlarm, useNotificationPermission } from "@/hooks/useAlarm";
import { BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

// Beautiful gradient backgrounds based on time of day
const getTimeOfDayGradient = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "from-amber-50 via-orange-50 to-rose-50"; // Morning
  } else if (hour >= 12 && hour < 17) {
    return "from-sky-50 via-blue-50 to-indigo-50"; // Afternoon
  } else if (hour >= 17 && hour < 20) {
    return "from-orange-50 via-rose-50 to-purple-50"; // Evening
  }
  return "from-slate-100 via-indigo-50 to-slate-100"; // Night
};

const getTimeOfDayIcon = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return <Sunrise className="w-5 h-5 text-amber-500" />;
  if (hour >= 12 && hour < 17) return <Sun className="w-5 h-5 text-yellow-500" />;
  if (hour >= 17 && hour < 20) return <Sun className="w-5 h-5 text-orange-500" />;
  return <Moon className="w-5 h-5 text-indigo-400" />;
};

// Progress Ring Component
function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-black transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Time Block Form Component with Apple-style design
function BlockForm({
  onClose,
  initialData
}: {
  onClose: () => void;
  initialData?: {
    id?: string;
    title: string;
    startTime: string;
    endTime: string;
    color: CategoryColor;
    description?: string;
  };
}) {
  const { addBlock, updateBlock, selectedDate } = useTaskStore();
  const [title, setTitle] = useState(initialData?.title || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "10:00");
  const [color, setColor] = useState<CategoryColor>(initialData?.color || "blue");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (initialData?.id) {
      updateBlock(initialData.id, {
        title: title.trim(),
        startTime,
        endTime,
        color,
        description: description.trim(),
      });
    } else {
      addBlock({
        title: title.trim(),
        startTime,
        endTime,
        color,
        date: selectedDate,
        description: description.trim(),
      });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">Task Name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="What are you working on?"
          className="h-14 text-base rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 transition-all placeholder:text-gray-400"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Notes</Label>
        <Input
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          placeholder="Add details (optional)"
          className="h-14 text-base rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 transition-all placeholder:text-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Start</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
            className="h-14 text-base rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 transition-all text-center font-medium"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">End</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
            className="h-14 text-base rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 transition-all text-center font-medium"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Color</Label>
        <div className="flex flex-wrap gap-3 justify-center p-3 bg-gray-50/50 rounded-2xl">
          {(Object.keys(CATEGORY_COLORS) as CategoryColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-11 h-11 rounded-full transition-all duration-200 shadow-sm hover:scale-110 active:scale-95",
                color === c && "ring-[3px] ring-offset-2 ring-black scale-110 shadow-lg"
              )}
              style={{ backgroundColor: CATEGORY_COLORS[c] }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          className="flex-1 h-14 text-base font-semibold rounded-2xl bg-black hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-black/20"
        >
          {initialData?.id ? "Save Changes" : "Add Task"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-14 px-6 text-base font-medium rounded-2xl border-2 border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Visual Timeline Block Component
function TimelineBlock({
  block,
  onEdit,
  isActive
}: {
  block: import("@/store/useTaskStore").TimeBlock;
  onEdit: () => void;
  isActive: boolean;
}) {
  const { toggleComplete, deleteBlock } = useTaskStore();
  const [showActions, setShowActions] = useState(false);

  const duration = () => {
    const [startHour, startMin] = block.startTime.split(":").map(Number);
    const [endHour, endMin] = block.endTime.split(":").map(Number);
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    const diff = end - start;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + "m" : ""}` : `${mins}m`;
  };

  const getBlockHeight = () => {
    const [startHour, startMin] = block.startTime.split(":").map(Number);
    const [endHour, endMin] = block.endTime.split(":").map(Number);
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    const diff = Math.max(end - start, 30);
    return Math.max(diff * 1.2, 72);
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl transition-all duration-300 overflow-hidden",
        "shadow-sm hover:shadow-xl hover:shadow-black/10",
        "border border-white/50",
        block.completed && "opacity-60",
        isActive && "ring-2 ring-black ring-offset-2 shadow-lg"
      )}
      style={{
        backgroundColor: block.color + "20",
        minHeight: getBlockHeight(),
      }}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: block.color }}
      />

      {/* Content */}
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Time badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: block.color + "30", color: block.color }}
              >
                <Clock className="w-3 h-3" />
                {block.startTime} - {block.endTime}
              </span>
              <span className="text-xs text-gray-500 font-medium">{duration()}</span>
              {isActive && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Now
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className={cn(
              "font-bold text-lg text-gray-900 leading-tight",
              block.completed && "line-through text-gray-500"
            )}>
              {block.title}
            </h3>

            {/* Description */}
            {block.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{block.description}</p>
            )}

            {/* Notification badge */}
            {block.notified && !block.completed && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 font-medium">
                <Bell className="w-3 h-3" />
                Notified
              </div>
            )}
          </div>

          {/* Quick complete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(block.id);
            }}
            className={cn(
              "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200",
              "active:scale-90",
              block.completed
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-white/80 text-gray-400 hover:bg-white hover:text-gray-600 shadow-sm"
            )}
          >
            <Check className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Action buttons - shown on click */}
        <div className={cn(
          "flex items-center gap-2 mt-3 pt-3 border-t border-black/5 transition-all duration-200",
          showActions ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden mt-0 pt-0 border-0"
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-white/80 hover:bg-white text-gray-700 font-medium text-sm transition-all active:scale-95 shadow-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(block.id);
            }}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Beautiful Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Your day is clear</h3>
      <p className="text-base text-gray-500 max-w-[240px] leading-relaxed">
        Start planning your day by adding your first time block
      </p>
    </div>
  );
}

// Main Timeline Component
export function Timeline() {
  const { selectedDate, setSelectedDate, getBlocksForDate, soundEnabled, setSoundEnabled } = useTaskStore();
  const { permission, requestPermission, isSupported } = useNotificationPermission();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBlock, setEditBlock] = useState<Parameters<typeof BlockForm>[0]["initialData"] | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize alarm system
  const { testNotification } = useAlarm();

  // Handle hydration and time updates
  useEffect(() => {
    setIsMounted(true);
    const updateTime = () => setCurrentTime(format(new Date(), "HH:mm"));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const blocks = isMounted ? getBlocksForDate(selectedDate) : [];
  const currentDate = isMounted ? parseISO(selectedDate) : new Date();
  const isTodaySelected = isMounted && isToday(currentDate);

  // Calculate progress
  const completedBlocks = blocks.filter(b => b.completed).length;
  const progress = blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;

  // Check if a block is currently active
  const isBlockActive = (block: import("@/store/useTaskStore").TimeBlock) => {
    if (!isTodaySelected || block.completed) return false;
    return currentTime >= block.startTime && currentTime < block.endTime;
  };

  const goToPreviousDay = () => {
    setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleEdit = (block: import("@/store/useTaskStore").TimeBlock) => {
    setEditBlock({
      id: block.id,
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      color: block.color as CategoryColor,
      description: block.description,
    });
  };

  if (!isMounted) {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br flex items-center justify-center", getTimeOfDayGradient())}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-xl">
            <Clock className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-sm font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-28 transition-colors duration-500 bg-gradient-to-br", getTimeOfDayGradient())}>
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-lg mx-auto px-5 py-4">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">TimeBlock</h1>
                {isTodaySelected && (
                  <p className="text-xs text-gray-500 font-medium">{currentTime}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Progress ring */}
              {blocks.length > 0 && (
                <ProgressRing progress={progress} size={44} />
              )}

              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90",
                  soundEnabled ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Test notification button - shown when permission granted */}
              {isSupported && permission === "granted" && (
                <button
                  onClick={testNotification}
                  className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center transition-all active:scale-90"
                  title="Test notification"
                >
                  <BellRing className="w-5 h-5" />
                </button>
              )}

              {/* Notification permission */}
              {isSupported && permission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center transition-all active:scale-90"
                >
                  <Bell className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between mt-4 bg-white/50 rounded-2xl p-2">
            <button
              onClick={goToPreviousDay}
              className="w-11 h-11 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={goToToday}
              className="flex-1 mx-3 py-2 text-center rounded-xl hover:bg-white/50 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-2">
                {getTimeOfDayIcon()}
                <div>
                  <p className="text-base font-bold text-gray-900">
                    {format(currentDate, "EEEE")}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {format(currentDate, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              {!isTodaySelected && (
                <p className="text-xs text-blue-600 font-semibold mt-1">Tap to go to today</p>
              )}
            </button>

            <button
              onClick={goToNextDay}
              className="w-11 h-11 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Stats bar */}
          {blocks.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-3 text-sm">
              <span className="text-gray-600">
                <span className="font-bold text-gray-900">{blocks.length}</span> tasks
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-green-600">
                <span className="font-bold">{completedBlocks}</span> done
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-gray-600">
                <span className="font-bold text-gray-900">{blocks.length - completedBlocks}</span> left
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Timeline Content */}
      <main ref={scrollRef} className="max-w-lg mx-auto px-5 py-6">
        {blocks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {blocks.map((block) => (
              <TimelineBlock
                key={block.id}
                block={block}
                onEdit={() => handleEdit(block)}
                isActive={isBlockActive(block)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button - Apple style */}
      <div className="fixed bottom-8 right-6 z-20">
        <button
          onClick={() => setIsAddOpen(true)}
          className={cn(
            "w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center",
            "shadow-2xl shadow-black/30 hover:shadow-black/40",
            "transition-all duration-200 hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-4 focus:ring-black/20"
          )}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Task</DialogTitle>
          </DialogHeader>
          <BlockForm onClose={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={editBlock !== undefined} onOpenChange={() => setEditBlock(undefined)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Task</DialogTitle>
          </DialogHeader>
          {editBlock && (
            <BlockForm
              initialData={editBlock}
              onClose={() => setEditBlock(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
