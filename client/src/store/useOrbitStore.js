import { create } from "zustand";

export const useOrbitStore = create(
  (set) => ({
    user: JSON.parse(
      localStorage.getItem(
        "orbit_user"
      ) || "null"
    ),

    workspace: null,

    board: null,

    lists: [],

    notifications: [],

    onlineUsers: [],

    /*
      ========================================================
      BASIC SETTERS
      ========================================================
    */

    setUser: (user) =>
      set({ user }),

    setWorkspace: (workspace) =>
      set({ workspace }),

    setBoard: (board) =>
      set({ board }),

    setLists: (lists) =>
      set({ lists }),

    setNotifications:
      (notifications) =>
        set({
          notifications,
        }),

    setOnlineUsers:
      (onlineUsers) =>
        set({
          onlineUsers,
        }),

    /*
      ========================================================
      NOTIFICATIONS
      ========================================================
    */

    addNotification:
      (notification) =>
        set((state) => ({
          notifications: [
            notification,
            ...state.notifications,
          ],
        })),

    /*
      ========================================================
      LISTS
      ========================================================
    */

    addList: (list) =>
      set((state) => ({
        lists: [
          ...state.lists,
          {
            ...list,
            cards:
              list.cards || [],
          },
        ],
      })),

    replaceList: (updated) =>
      set((state) => ({
        lists: state.lists.map(
          (list) =>
            String(list._id) ===
            String(updated._id)
              ? {
                  ...list,
                  ...updated,
                  cards:
                    updated.cards ||
                    list.cards ||
                    [],
                }
              : list
        ),
      })),

    removeList: (id) =>
      set((state) => ({
        lists:
          state.lists.filter(
            (list) =>
              String(list._id) !==
              String(id)
          ),
      })),

    /*
      ========================================================
      REALTIME CARD UPSERT
      ========================================================
    */

    upsertCard: (card) =>
      set((state) => {
        const lists =
          state.lists.map(
            (list) => ({
              ...list,
              cards: [
                ...(list.cards || []),
              ],
            })
          );

        let existingListIndex =
          -1;

        let existingCardIndex =
          -1;

        /*
          Find existing card
        */

        for (
          let i = 0;
          i < lists.length;
          i++
        ) {
          const index =
            lists[i].cards.findIndex(
              (existingCard) =>
                String(
                  existingCard._id
                ) ===
                String(card._id)
            );

          if (index !== -1) {
            existingListIndex =
              i;

            existingCardIndex =
              index;

            break;
          }
        }

        /*
          Remove existing card
        */

        if (
          existingListIndex !==
          -1
        ) {
          lists[
            existingListIndex
          ].cards.splice(
            existingCardIndex,
            1
          );
        }

        /*
          Find destination list
        */

        const destinationIndex =
          lists.findIndex(
            (list) =>
              String(list._id) ===
              String(card.list)
          );

        if (
          destinationIndex ===
          -1
        ) {
          return {
            lists,
          };
        }

        /*
          If this is a card update
          in the same list, try to
          preserve its previous position.
        */

        let insertIndex =
          lists[
            destinationIndex
          ].cards.length;

        if (
          existingListIndex ===
            destinationIndex &&
          existingCardIndex !==
            -1
        ) {
          insertIndex =
            Math.min(
              existingCardIndex,
              lists[
                destinationIndex
              ].cards.length
            );
        }

        lists[
          destinationIndex
        ].cards.splice(
          insertIndex,
          0,
          card
        );

        return {
          lists,
        };
      }),

    /*
      ========================================================
      REMOVE CARD
      ========================================================
    */

    removeCard: (id) =>
      set((state) => ({
        lists:
          state.lists.map(
            (list) => ({
              ...list,

              cards:
                (
                  list.cards ||
                  []
                ).filter(
                  (card) =>
                    String(
                      card._id
                    ) !==
                    String(id)
                ),
            })
          ),
      })),
  })
);