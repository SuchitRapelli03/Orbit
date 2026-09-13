import { create } from "zustand";

export const useOrbitStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("orbit_user") || "null"),
  workspace: null,
  board: null,
  lists: [],
  notifications: [],
  onlineUsers: [],
  setUser: (user) => set({ user }),
  setWorkspace: (workspace) => set({ workspace }),
  setBoard: (board) => set({ board }),
  setLists: (lists) => set({ lists }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  replaceList: (updated) =>
    set((state) => ({ lists: state.lists.map((l) => l._id === updated._id ? updated : l) })),
  removeList: (id) =>
    set((state) => ({ lists: state.lists.filter((l) => l._id !== id) })),
  upsertCard: (card) =>
    set((state) => {
      const lists = state.lists.map((list) => ({
        ...list,
        cards: list.cards?.filter((c) => c._id !== card._id) || []
      }));
      const target = lists.find((list) => list._id === card.list);
      if (target) target.cards = [...target.cards, card];
      return { lists };
    }),
  removeCard: (id) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        cards: list.cards?.filter((card) => card._id !== id) || []
      }))
    }))
}));
