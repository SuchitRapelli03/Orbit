import { useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

import {
  Plus,
  Search,
  Bell,
  X,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react";

import { useParams } from "react-router-dom";

import api from "../lib/api";
import { connectSocket } from "../lib/socket";

import { useOrbitStore } from "../store/useOrbitStore";


export default function BoardPage() {
  const { boardId } = useParams();

  const board = useOrbitStore((state) => state.board);
  const lists = useOrbitStore((state) => state.lists);

  const setBoard = useOrbitStore((state) => state.setBoard);
  const setLists = useOrbitStore((state) => state.setLists);

  const upsertCard = useOrbitStore(
    (state) => state.upsertCard
  );

  const removeCard = useOrbitStore(
    (state) => state.removeCard
  );

  const addList = useOrbitStore(
    (state) => state.addList
  );

  const addNotification = useOrbitStore(
    (state) => state.addNotification
  );


  const [listTitle, setListTitle] =
    useState("");

  const [creatingList, setCreatingList] =
    useState(false);

  const [creatingCard, setCreatingCard] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [activeCard, setActiveCard] =
    useState(null);

  const [comments, setComments] =
    useState([]);

  const [commentText, setCommentText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [openMenu, setOpenMenu] =
    useState(null);

  const [editingList, setEditingList] =
    useState(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [savingList, setSavingList] =
    useState(false);


  // ============================================================
  // LOAD BOARD
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadBoard() {
      try {
        setLoading(true);
        setError("");

        const { data } =
          await api.get(
            `/boards/${boardId}`
          );

        if (!mounted) return;

        setBoard(data.board);

        setLists(
          data.board.lists || []
        );
      } catch (error) {
        console.error(
          "Board loading error:",
          error
        );

        if (mounted) {
          setError(
            error.response?.data?.message ||
              "Unable to load board."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      mounted = false;
    };
  }, [
    boardId,
    setBoard,
    setLists
  ]);


  // ============================================================
  // SOCKET
  // ============================================================

  useEffect(() => {
    const socket =
      connectSocket();

    function handleConnect() {
      console.log(
        "Orbit Socket connected:",
        socket.id
      );

      socket.emit(
        "board:join",
        boardId
      );
    }

    function handleCardCreated(card) {
      upsertCard(card);
    }

    function handleCardUpdated(card) {
      upsertCard(card);
    }

    function handleCardMoved(card) {
      upsertCard(card);
    }

    function handleCardDeleted({
      cardId
    }) {
      removeCard(cardId);
    }

    function handleNotification(
      notification
    ) {
      addNotification(
        notification
      );
    }

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "card:created",
      handleCardCreated
    );

    socket.on(
      "card:updated",
      handleCardUpdated
    );

    socket.on(
      "card:moved",
      handleCardMoved
    );

    socket.on(
      "card:deleted",
      handleCardDeleted
    );

    socket.on(
      "notification:new",
      handleNotification
    );

    if (socket.connected) {
      socket.emit(
        "board:join",
        boardId
      );
    }

    return () => {
      socket.emit(
        "board:leave",
        boardId
      );

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "card:created",
        handleCardCreated
      );

      socket.off(
        "card:updated",
        handleCardUpdated
      );

      socket.off(
        "card:moved",
        handleCardMoved
      );

      socket.off(
        "card:deleted",
        handleCardDeleted
      );

      socket.off(
        "notification:new",
        handleNotification
      );
    };
  }, [
    boardId,
    upsertCard,
    removeCard,
    addNotification
  ]);


  // ============================================================
  // CREATE LIST
  // ============================================================

  async function handleCreateList(
    event
  ) {
    event.preventDefault();

    const title =
      listTitle.trim();

    if (
      !title ||
      creatingList
    ) {
      return;
    }

    try {
      setCreatingList(true);
      setError("");

      const { data } =
        await api.post(
          "/lists",
          {
            boardId,
            title
          }
        );

      addList(data.list);

      setListTitle("");
    } catch (error) {
      console.error(
        "Create list error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to create list."
      );
    } finally {
      setCreatingList(false);
    }
  }


  // ============================================================
  // CREATE CARD
  // ============================================================

  async function handleCreateCard(
    listId
  ) {
    if (creatingCard) {
      return;
    }

    const title =
      window.prompt(
        "Enter card title"
      );

    if (!title?.trim()) {
      return;
    }

    try {
      setCreatingCard(true);
      setError("");

      const { data } =
        await api.post(
          "/cards",
          {
            listId,
            title: title.trim()
          }
        );

      upsertCard(data.card);
    } catch (error) {
      console.error(
        "Create card error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to create card."
      );
    } finally {
      setCreatingCard(false);
    }
  }


  // ============================================================
  // RENAME LIST
  // ============================================================

  function startEditingList(list) {
    setEditingList(list._id);
    setEditingTitle(list.title);
    setOpenMenu(null);
  }


  async function saveListName(listId) {
    const title =
      editingTitle.trim();

    if (!title || savingList) {
      return;
    }

    try {
      setSavingList(true);
      setError("");

      const { data } =
        await api.patch(
          `/lists/${listId}`,
          {
            title
          }
        );

      setLists(
        lists.map((list) =>
          list._id === listId
            ? {
                ...list,
                title:
                  data.list.title
              }
            : list
        )
      );

      setEditingList(null);
      setEditingTitle("");
    } catch (error) {
      console.error(
        "Rename list error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to rename list."
      );
    } finally {
      setSavingList(false);
    }
  }


  // ============================================================
  // DELETE LIST
  // ============================================================

  async function handleDeleteList(
    list
  ) {
    setOpenMenu(null);

    const hasCards =
      list.cards?.length > 0;

    const message = hasCards
      ? `Delete "${list.title}" and all ${list.cards.length} card(s) inside it?`
      : `Delete "${list.title}"?`;

    const confirmed =
      window.confirm(message);

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/lists/${list._id}`
      );

      setLists(
        lists.filter(
          (item) =>
            item._id !== list._id
        )
      );
    } catch (error) {
      console.error(
        "Delete list error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete list."
      );
    }
  }


  // ============================================================
  // DRAG & DROP
  // ============================================================

  async function handleDragEnd(
    result
  ) {
    const {
      source,
      destination,
      draggableId
    } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId ===
        destination.droppableId &&
      source.index ===
        destination.index
    ) {
      return;
    }

    const currentLists =
      lists.map((list) => ({
        ...list,
        cards: [
          ...(list.cards || [])
        ]
      }));

    const sourceList =
      currentLists.find(
        (list) =>
          list._id ===
          source.droppableId
      );

    const destinationList =
      currentLists.find(
        (list) =>
          list._id ===
          destination.droppableId
      );

    if (
      !sourceList ||
      !destinationList
    ) {
      return;
    }

    const cardIndex =
      sourceList.cards.findIndex(
        (card) =>
          card._id ===
          draggableId
      );

    if (cardIndex === -1) {
      return;
    }

    const [movedCard] =
      sourceList.cards.splice(
        cardIndex,
        1
      );

    const updatedCard = {
      ...movedCard,
      list:
        destinationList._id
    };

    destinationList.cards.splice(
      destination.index,
      0,
      updatedCard
    );

    setLists(currentLists);

    try {
      const { data } =
        await api.patch(
          `/cards/${draggableId}/move`,
          {
            listId:
              destinationList._id,

            position:
              destination.index
          }
        );

      upsertCard(data.card);
    } catch (error) {
      console.error(
        "Move card error:",
        error
      );

      try {
        const { data } =
          await api.get(
            `/boards/${boardId}`
          );

        setLists(
          data.board.lists || []
        );
      } catch {
        setError(
          "Card move failed. Please refresh the board."
        );
      }
    }
  }


  // ============================================================
  // CARD COMMENTS
  // ============================================================

  async function openCard(card) {
    setActiveCard(card);
    setCommentText("");

    try {
      const { data } =
        await api.get(
          `/cards/${card._id}/comments`
        );

      setComments(
        data.comments || []
      );
    } catch (error) {
      console.error(
        "Comments loading error:",
        error
      );

      setComments([]);
    }
  }


  async function handleAddComment() {
    if (
      !activeCard ||
      !commentText.trim()
    ) {
      return;
    }

    try {
      const { data } =
        await api.post(
          `/cards/${activeCard._id}/comments`,
          {
            body:
              commentText.trim()
          }
        );

      setComments(
        (previous) => [
          ...previous,
          data.comment
        ]
      );

      setCommentText("");
    } catch (error) {
      console.error(
        "Comment error:",
        error
      );
    }
  }


  // ============================================================
  // SEARCH
  // ============================================================

  const filteredLists =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return lists;
      }

      return lists.map(
        (list) => ({
          ...list,

          cards:
            (list.cards || []).filter(
              (card) =>
                card.title
                  .toLowerCase()
                  .includes(query)
            )
        })
      );
    }, [
      lists,
      search
    ]);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Loading Orbit board...
        </p>
      </div>
    );
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <main
      className="min-h-screen bg-slate-100"
      onClick={() =>
        setOpenMenu(null)
      }
    >

      {/* HEADER */}
      <header className="border-b bg-white">

        <div className="flex items-center justify-between px-6 py-4">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                ◉
              </div>

              <span className="text-xl font-black">
                Orbit
              </span>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              {board?.workspace?.name ||
                "Workspace"}
              {" / "}
              {board?.name ||
                "Board"}
            </p>

          </div>


          <div className="flex items-center gap-3">

            <div className="flex items-center rounded-xl border bg-slate-50 px-3">

              <Search
                size={17}
                className="text-slate-400"
              />

              <input
                className="w-44 bg-transparent px-2 py-2 text-sm outline-none"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <button
              type="button"
              className="rounded-xl border bg-white p-2.5 hover:bg-slate-50"
            >
              <Bell size={18} />
            </button>

          </div>

        </div>

      </header>


      {/* ERROR */}
      {error && (

        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* BOARD */}
      <section className="overflow-x-auto p-5">

        <div className="flex min-w-max items-start gap-4">

          <DragDropContext
            onDragEnd={
              handleDragEnd
            }
          >

            {filteredLists.map(
              (list) => (

                <Droppable
                  droppableId={
                    String(list._id)
                  }
                  key={list._id}
                >

                  {(provided) => (

                    <div
                      ref={
                        provided.innerRef
                      }
                      {...provided.droppableProps}
                      className="w-80 rounded-2xl bg-slate-200 p-3"
                    >

                      {/* LIST HEADER */}
                      <div className="mb-3 flex items-center justify-between">

                        {editingList ===
                        list._id ? (

                          <div className="flex flex-1 items-center gap-2">

                            <input
                              autoFocus
                              value={
                                editingTitle
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingTitle(
                                  event.target.value
                                )
                              }
                              onKeyDown={(
                                event
                              ) => {

                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  saveListName(
                                    list._id
                                  );
                                }

                                if (
                                  event.key ===
                                  "Escape"
                                ) {
                                  setEditingList(
                                    null
                                  );
                                }

                              }}
                              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none"
                            />

                            <button
                              type="button"
                              disabled={
                                savingList
                              }
                              onClick={() =>
                                saveListName(
                                  list._id
                                )
                              }
                              className="rounded-lg bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Save
                            </button>

                          </div>

                        ) : (

                          <>

                            <div className="flex items-center gap-2">

                              <h2 className="font-bold text-slate-800">
                                {list.title}
                              </h2>

                              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                                {list.cards?.length ||
                                  0}
                              </span>

                            </div>


                            {/* LIST MENU */}
                            <div
                              className="relative"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenu(
                                    openMenu ===
                                      list._id
                                      ? null
                                      : list._id
                                  )
                                }
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
                              >
                                <MoreHorizontal
                                  size={18}
                                />
                              </button>


                              {openMenu ===
                                list._id && (

                                <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditingList(
                                        list
                                      )
                                    }
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                                  >
                                    <Pencil
                                      size={15}
                                    />
                                    Rename
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteList(
                                        list
                                      )
                                    }
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2
                                      size={15}
                                    />
                                    Delete
                                  </button>

                                </div>

                              )}

                            </div>

                          </>

                        )}

                      </div>


                      {/* CARDS */}
                      <div className="space-y-3">

                        {(list.cards || []).map(
                          (card, index) => (

                            <Draggable
                              key={
                                card._id
                              }
                              draggableId={
                                String(
                                  card._id
                                )
                              }
                              index={
                                index
                              }
                            >

                              {(
                                dragProvided,
                                snapshot
                              ) => (

                                <div
                                  ref={
                                    dragProvided.innerRef
                                  }
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() =>
                                    openCard(
                                      card
                                    )
                                  }
                                  className={`cursor-grab rounded-xl bg-white p-4 shadow-sm transition ${
                                    snapshot.isDragging
                                      ? "rotate-1 shadow-xl"
                                      : "hover:shadow-md"
                                  }`}
                                >

                                  <div className="flex items-start justify-between gap-2">

                                    <p className="font-semibold text-slate-800">
                                      {
                                        card.title
                                      }
                                    </p>

                                    <MoreHorizontal
                                      size={17}
                                      className="shrink-0 text-slate-400"
                                    />

                                  </div>


                                  <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-500">
                                    {card.priority ||
                                      "medium"}
                                  </span>

                                </div>

                              )}

                            </Draggable>

                          )
                        )}

                      </div>


                      {provided.placeholder}


                      {/* ADD CARD */}
                      <button
                        type="button"
                        disabled={
                          creatingCard
                        }
                        onClick={() =>
                          handleCreateCard(
                            list._id
                          )
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl p-2 text-sm font-medium text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <Plus
                          size={16}
                        />

                        {creatingCard
                          ? "Creating..."
                          : "Add card"}

                      </button>

                    </div>

                  )}

                </Droppable>

              )
            )}

          </DragDropContext>


          {/* ADD LIST */}
          <form
            onSubmit={
              handleCreateList
            }
            className="w-80 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-3"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <input
              type="text"
              value={listTitle}
              onChange={(event) =>
                setListTitle(
                  event.target.value
                )
              }
              placeholder="New list name"
              disabled={
                creatingList
              }
              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400 disabled:bg-slate-100"
            />

            <button
              type="submit"
              disabled={
                creatingList ||
                !listTitle.trim()
              }
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 p-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Plus size={16} />

              {creatingList
                ? "Adding..."
                : "Add list"}

            </button>

          </form>

        </div>

      </section>


      {/* CARD MODAL */}
      {activeCard && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5"
          onClick={() =>
            setActiveCard(null)
          }
        >

          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  {activeCard.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Card collaboration
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setActiveCard(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>

            </div>


            {/* COMMENTS */}
            <div className="mt-6 border-t pt-5">

              <h3 className="mb-4 font-semibold">
                Comments
              </h3>


              <div className="max-h-64 space-y-3 overflow-y-auto">

                {comments.length === 0 ? (

                  <p className="text-sm text-slate-400">
                    No comments yet.
                  </p>

                ) : (

                  comments.map(
                    (item) => (

                      <div
                        key={
                          item._id
                        }
                        className="rounded-xl bg-slate-50 p-3"
                      >

                        <p className="text-xs font-semibold text-slate-500">
                          {item.author?.name ||
                            "User"}
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {item.body}
                        </p>

                      </div>

                    )
                  )

                )}

              </div>


              <div className="mt-4 flex gap-2">

                <input
                  value={
                    commentText
                  }
                  onChange={(
                    event
                  ) =>
                    setCommentText(
                      event.target.value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {

                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleAddComment();
                    }

                  }}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />


                <button
                  type="button"
                  onClick={
                    handleAddComment
                  }
                  className="rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800"
                >
                  <Send size={18} />
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}