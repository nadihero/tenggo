"use client";

import { useState, useEffect } from "react";
import { useTaskStore, CATEGORY_COLORS, CategoryColor } from "@/store/useTaskStore";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Bell,
  Check,
  Trash2,
  Edit2,
  Volume2,
  VolumeX,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlarm, useNotificationPermission } from "@/hooks/useAlarm";
import { cn } from "@/lib/utils";

// Time Block Form Component
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="e.g., Morning Workout"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          placeholder="Add details..."
          className="h-12"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category Color</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_COLORS) as CategoryColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-10 h-10 rounded-full transition-all",
                color === c && "ring-2 ring-offset-2 ring-gray-400 scale-110"
              )}
              style={{ backgroundColor: CATEGORY_COLORS[c] }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1 h-12">
          {initialData?.id ? "Update Block" : "Add Block"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Time Block Card Component
function BlockCard({
  block,
  onEdit
}: {
  block: import("@/store/useTaskStore").TimeBlock;
  onEdit: () => void;
}) {
  const { toggleComplete, deleteBlock } = useTaskStore();

  const duration = () => {
    const [startHour, startMin] = block.startTime.split(":").map(Number);
    const [endHour, endMin] = block.endTime.split(":").map(Number);
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    const diff = end - start;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        block.completed && "opacity-50"
      )}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: block.color }}
      />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold text-base",
                block.completed && "line-through"
              )}>
                {block.title}
              </h3>
              {block.notified && !block.completed && (
                <Bell className="w-4 h-4 text-amber-500" />
              )}
            </div>
            {block.description && (
              <p className="text-sm text-gray-500 mt-1">{block.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {block.startTime} - {block.endTime}
              </span>
              <span className="text-gray-400">|</span>
              <span>{duration()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleComplete(block.id)}
              className={cn(
                "h-9 w-9",
                block.completed && "bg-green-100 text-green-600"
              )}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-9 w-9">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteBlock(block.id)}
              className="h-9 w-9 text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">No blocks scheduled</h3>
      <p className="text-sm text-gray-500 mt-1">
        Add your first time block to get started
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

  // Initialize alarm system
  useAlarm();

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const blocks = isMounted ? getBlocksForDate(selectedDate) : [];
  const currentDate = isMounted ? parseISO(selectedDate) : new Date();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">TimeBlock</h1>
              {isSupported && permission !== "granted" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={requestPermission}
                  className="text-amber-600"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  Enable
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-9 w-9"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-9 w-9">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {format(currentDate, "EEEE")}
              </p>
              <p className="text-sm text-gray-500">
                {format(currentDate, "MMM d, yyyy")}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextDay} className="h-9 w-9">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Today Button */}
          {selectedDate !== format(new Date(), "yyyy-MM-dd") && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="w-full mt-3"
            >
              Go to Today
            </Button>
          )}
        </div>
      </header>

      {/* Timeline Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {blocks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onEdit={() => handleEdit(block)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Button
          size="lg"
          onClick={() => setIsAddOpen(true)}
          className="h-14 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Block
        </Button>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Time Block</DialogTitle>
          </DialogHeader>
          <BlockForm onClose={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={editBlock !== undefined} onOpenChange={() => setEditBlock(undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Time Block</DialogTitle>
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
