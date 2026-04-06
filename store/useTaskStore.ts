import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { format, parseISO, isSameDay, isAfter, isBefore } from "date-fns";

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  color: string;
  date: string; // ISO date string YYYY-MM-DD
  notified: boolean;
  completed: boolean;
  description?: string;
}

export type CategoryColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "pink"
  | "indigo"
  | "orange"
  | "teal"
  | "cyan";

export const CATEGORY_COLORS: Record<CategoryColor, string> = {
  blue: "#3B82F6",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
  pink: "#EC4899",
  indigo: "#6366F1",
  orange: "#F97316",
  teal: "#14B8A6",
  cyan: "#06B6D4",
};

interface TaskStore {
  blocks: TimeBlock[];
  selectedDate: string;
  notificationPermission: NotificationPermission | null;
  soundEnabled: boolean;

  // Actions
  addBlock: (block: Omit<TimeBlock, "id" | "notified" | "completed">) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  toggleComplete: (id: string) => void;
  markNotified: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setNotificationPermission: (permission: NotificationPermission) => void;
  setSoundEnabled: (enabled: boolean) => void;

  // Getters
  getBlocksForDate: (date: string) => TimeBlock[];
  getActiveBlocksForToday: () => TimeBlock[];
  getUpcomingBlocks: (date: string, currentTime: string) => TimeBlock[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      blocks: [],
      selectedDate: format(new Date(), "yyyy-MM-dd"),
      notificationPermission: null,
      soundEnabled: true,

      addBlock: (block) => {
        const newBlock: TimeBlock = {
          ...block,
          id: crypto.randomUUID(),
          notified: false,
          completed: false,
        };
        set((state) => ({
          blocks: [...state.blocks, newBlock],
        }));
      },

      updateBlock: (id, updates) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, ...updates } : block
          ),
        }));
      },

      deleteBlock: (id) => {
        set((state) => ({
          blocks: state.blocks.filter((block) => block.id !== id),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, completed: !block.completed } : block
          ),
        }));
      },

      markNotified: (id) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, notified: true } : block
          ),
        }));
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      setNotificationPermission: (permission) => {
        set({ notificationPermission: permission });
      },

      setSoundEnabled: (enabled) => {
        set({ soundEnabled: enabled });
      },

      getBlocksForDate: (date) => {
        return get().blocks
          .filter((block) => block.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      },

      getActiveBlocksForToday: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        return get().blocks.filter(
          (block) => block.date === today && !block.completed
        );
      },

      getUpcomingBlocks: (date, currentTime) => {
        return get()
          .getBlocksForDate(date)
          .filter(
            (block) =>
              !block.completed &&
              !block.notified &&
              block.startTime > currentTime
          );
      },
    }),
    {
      name: "timeblock-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        blocks: state.blocks,
        selectedDate: state.selectedDate,
        soundEnabled: state.soundEnabled,
        notificationPermission: state.notificationPermission,
      }),
    }
  )
);
