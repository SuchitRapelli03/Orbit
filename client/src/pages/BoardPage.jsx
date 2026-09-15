import { useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

import {
  Plus,
  Search,
  Bell,
  X,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutDashboard,
  Settings,
  LogOut,
  FolderKanban,
  Users,
  ChevronRight,
  Circle,
  MessageSquare,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../lib/api";
import { connectSocket } from "../lib/socket";

import { useOrbitStore } from "../store/useOrbitStore";

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const board = useOrbitStore((state) => state.board);
  const lists = useOrbitStore((state) => state.lists);
  const user = useOrbitStore((state) => state.user);

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

  const [listTitle, setListTitle] = useState("");
  const [creatingList, setCreatingList] =
    useState(false);

  const [creatingCard, setCreatingCard] =
    useState(false);

  const [search, setSearch] = useState("");

  const [activeCard, setActiveCard] =
    useState(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openMenu, setOpenMenu] = useState(null);

  const [editingList, setEditingList] =
    useState(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [savingList, setSavingList] =
    useState(false);

  /* =========================================================
     LOAD BOARD
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadBoard() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(
          `/boards/${boardId}`
        );

        if (!mounted) return;

        setBoard(data.board);

        setLists(data.board.lists || []);
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
  }, [boardId, setBoard, setLists]);

  /* =========================================================
     SOCKET.IO
  ========================================================= */

  useEffect(() => {
    const socket = connectSocket();

    function handleConnect() {
      console.log(
        "Orbit Socket connected:",
        socket.id
      );

      socket.emit("board:join", boardId);
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

    function handleCardDeleted({ cardId }) {
      removeCard(cardId);
    }

    function handleNotification(notification) {
      addNotification(notification);
    }

    socket.on("connect", handleConnect);

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
      socket.emit("board:join", boardId);
    }

    return () => {
      socket.emit("board:leave", boardId);

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
    addNotification,
  ]);

  /* =========================================================
     CREATE LIST
  ========================================================= */

  async function handleCreateList(event) {
    event.preventDefault();

    const title = listTitle.trim();

    if (!title || creatingList) return;

    try {
      setCreatingList(true);
      setError("");

      const { data } = await api.post(
        "/lists",
        {
          boardId,
          title,
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

  /* =========================================================
     CREATE CARD
  ========================================================= */

  async function handleCreateCard(listId) {
    if (creatingCard) return;

    const title = window.prompt(
      "Enter card title"
    );

    if (!title?.trim()) return;

    try {
      setCreatingCard(true);
      setError("");

      const { data } = await api.post(
        "/cards",
        {
          listId,
          title: title.trim(),
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

  /* =========================================================
     RENAME LIST
  ========================================================= */

  function startEditingList(list) {
    setEditingList(list._id);
    setEditingTitle(list.title);
    setOpenMenu(null);
  }

  async function saveListName(listId) {
    const title = editingTitle.trim();

    if (!title || savingList) return;

    try {
      setSavingList(true);
      setError("");

      const { data } = await api.patch(
        `/lists/${listId}`,
        {
          title,
        }
      );

      setLists(
        lists.map((list) =>
          list._id === listId
            ? {
                ...list,
                title: data.list.title,
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

  /* =========================================================
     DELETE LIST
  ========================================================= */

  async function handleDeleteList(list) {
    setOpenMenu(null);

    const hasCards =
      list.cards?.length > 0;

    const message = hasCards
      ? `Delete "${list.title}" and all ${list.cards.length} card(s) inside it?`
      : `Delete "${list.title}"?`;

    const confirmed =
      window.confirm(message);

    if (!confirmed) return;

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

  /* =========================================================
     DRAG & DROP
  ========================================================= */

  async function handleDragEnd(result) {
    const {
      source,
      destination,
      draggableId,
    } = result;

    if (!destination) return;

    if (
      source.droppableId ===
        destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const currentLists = lists.map(
      (list) => ({
        ...list,
        cards: [
          ...(list.cards || []),
        ],
      })
    );

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
          card._id === draggableId
      );

    if (cardIndex === -1) return;

    const [movedCard] =
      sourceList.cards.splice(
        cardIndex,
        1
      );

    const updatedCard = {
      ...movedCard,
      list: destinationList._id,
    };

    destinationList.cards.splice(
      destination.index,
      0,
      updatedCard
    );

    setLists(currentLists);

    try {
      const { data } = await api.patch(
        `/cards/${draggableId}/move`,
        {
          listId:
            destinationList._id,
          position:
            destination.index,
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

  /* =========================================================
     COMMENTS
  ========================================================= */

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
              commentText.trim(),
          }
        );

      setComments(
        (previous) => [
          ...previous,
          data.comment,
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

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredLists = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) return lists;

    return lists.map((list) => ({
      ...list,
      cards: (list.cards || []).filter(
        (card) =>
          card.title
            ?.toLowerCase()
            .includes(query)
      ),
    }));
  }, [lists, search]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  function logout() {
    localStorage.removeItem(
      "orbit_token"
    );

    localStorage.removeItem(
      "orbit_user"
    );

    navigate("/login");
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          <p className="text-slate-400">
            Loading Orbit board...
          </p>
        </div>
      </div>
    );
  }

  const workspaceName =
    board?.workspace?.name ||
    "Workspace";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        {/* BRAND */}

        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold">
              O
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Orbit
              </h1>

              <p className="text-xs text-slate-500">
                Collaborative Workspace
              </p>
            </div>
          </div>
        </div>

        {/* WORKSPACE */}

        <div className="border-b border-slate-800 p-4">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
              <FolderKanban size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {workspaceName}
              </p>

              <p className="text-xs text-slate-500">
                Current workspace
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="space-y-1 px-4 py-5">
          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-lg bg-indigo-600/15 px-3 py-2.5 text-sm font-medium text-indigo-400"
          >
            <FolderKanban size={18} />
            Boards
          </button>

          {board?.workspace?._id && (
            <button
              onClick={() =>
                navigate(
                  `/workspaces/${board.workspace._id}/settings`
                )
              }
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <Settings size={18} />
              Workspace Settings
            </button>
          )}
        </nav>

        {/* BOARD INFO */}

        <div className="px-4">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Current Board
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-400">
                <FolderKanban size={17} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {board?.name ||
                    "Board"}
                </p>

                <p className="text-xs text-slate-500">
                  {lists.length} lists
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* USER */}

        <div className="mt-auto border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name ||
                  "User"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-red-400"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        className="flex min-w-0 flex-1 flex-col"
        onClick={() => setOpenMenu(null)}
      >
        {/* HEADER */}

        <header className="shrink-0 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex min-h-[76px] items-center justify-between gap-5 px-5 lg:px-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {workspaceName}
                </span>

                <ChevronRight size={13} />

                <span className="text-slate-400">
                  Boards
                </span>

                <ChevronRight size={13} />

                <span className="text-indigo-400">
                  {board?.name ||
                    "Board"}
                </span>
              </div>

              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">
                {board?.name ||
                  "Board"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* ONLINE */}

              <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 sm:flex">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-medium text-slate-400">
                  Live
                </span>
              </div>

              {/* SEARCH */}

              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3">
                <Search
                  size={17}
                  className="text-slate-500"
                />

                <input
                  className="w-32 bg-transparent px-2.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 sm:w-48"
                  placeholder="Search cards..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="text-slate-500 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <button
                className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white sm:block"
                title="Notifications"
              >
                <Bell size={18} />
              </button>
            </div>
          </div>

          {/* BOARD TOOLBAR */}

          <div className="flex items-center justify-between border-t border-slate-900 px-5 py-3 lg:px-7">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={16} />
              <span>
                Collaborative board
              </span>
            </div>

            <span className="text-xs text-slate-600">
              {lists.length}{" "}
              {lists.length === 1
                ? "list"
                : "lists"}
            </span>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 lg:mx-7">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ===================================================
            KANBAN BOARD
        =================================================== */}

        <section className="flex-1 overflow-x-auto overflow-y-hidden p-5 lg:p-7">
          <DragDropContext
            onDragEnd={handleDragEnd}
          >
            <div className="flex min-h-full min-w-max items-start gap-4 pb-5">
              {filteredLists.map(
                (list) => (
                  <Droppable
                    droppableId={String(
                      list._id
                    )}
                    key={list._id}
                  >
                    {(
                      provided,
                      snapshot
                    ) => (
                      <div
                        ref={
                          provided.innerRef
                        }
                        {...provided.droppableProps}
                        className={`flex w-[310px] max-h-[calc(100vh-190px)] flex-col rounded-2xl border transition ${
                          snapshot.isDraggingOver
                            ? "border-indigo-500/50 bg-indigo-950/20"
                            : "border-slate-800 bg-slate-900/80"
                        }`}
                      >
                        {/* LIST HEADER */}

                        <div className="shrink-0 border-b border-slate-800 px-4 py-3">
                          {editingList ===
                          list._id ? (
                            <div className="flex gap-2">
                              <input
                                autoFocus
                                value={
                                  editingTitle
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditingTitle(
                                    event.target
                                      .value
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
                                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
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
                                className="rounded-lg bg-indigo-600 px-3 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <Circle
                                  size={9}
                                  fill="currentColor"
                                  className="shrink-0 text-indigo-500"
                                />

                                <h2 className="truncate text-sm font-bold text-white">
                                  {list.title}
                                </h2>

                                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                                  {list.cards
                                    ?.length ||
                                    0}
                                </span>
                              </div>

                              <div
                                className="relative"
                                onClick={(event) =>
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
                                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                                >
                                  <MoreHorizontal
                                    size={18}
                                  />
                                </button>

                                {openMenu ===
                                  list._id && (
                                  <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditingList(
                                          list
                                        )
                                      }
                                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
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
                                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                                    >
                                      <Trash2
                                        size={15}
                                      />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CARDS */}

                        <div className="min-h-[80px] flex-1 overflow-y-auto p-3">
                          <div className="space-y-3">
                            {(list.cards || []).map(
                              (
                                card,
                                index
                              ) => (
                                <Draggable
                                  key={
                                    card._id
                                  }
                                  draggableId={String(
                                    card._id
                                  )}
                                  index={index}
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
                                      className={`group cursor-grab rounded-xl border bg-slate-800 p-4 transition active:cursor-grabbing ${
                                        snapshot.isDragging
                                          ? "rotate-1 border-indigo-500/50 bg-slate-700 shadow-2xl"
                                          : "border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/90"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold leading-5 text-slate-100">
                                          {
                                            card.title
                                          }
                                        </p>

                                        <MoreHorizontal
                                          size={
                                            16
                                          }
                                          className="shrink-0 text-slate-600 transition group-hover:text-slate-400"
                                        />
                                      </div>

                                      <div className="mt-4 flex items-center justify-between">
                                        <span className="rounded-md bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                                          {card.priority ||
                                            "Medium"}
                                        </span>

                                        <div className="flex items-center gap-1 text-slate-600">
                                          <MessageSquare
                                            size={
                                              14
                                            }
                                          />

                                          <span className="text-[11px]">
                                            Open
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            )}
                          </div>

                          {provided.placeholder}

                          {(list.cards || [])
                            .length ===
                            0 && (
                            <div className="flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
                              <p className="text-xs text-slate-600">
                                No cards yet
                              </p>
                            </div>
                          )}
                        </div>

                        {/* ADD CARD */}

                        <div className="shrink-0 border-t border-slate-800 p-3">
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
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                          >
                            <Plus size={16} />

                            {creatingCard
                              ? "Creating..."
                              : "Add card"}
                          </button>
                        </div>
                      </div>
                    )}
                  </Droppable>
                )
              )}

              {/* ADD LIST */}

              <form
                onSubmit={
                  handleCreateList
                }
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="w-[310px] shrink-0 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4"
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-400">
                  <Plus size={17} />
                  New list
                </div>

                <input
                  type="text"
                  value={listTitle}
                  onChange={(event) =>
                    setListTitle(
                      event.target.value
                    )
                  }
                  placeholder="List name"
                  disabled={creatingList}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

                <button
                  type="submit"
                  disabled={
                    creatingList ||
                    !listTitle.trim()
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />

                  {creatingList
                    ? "Adding..."
                    : "Add list"}
                </button>
              </form>
            </div>
          </DragDropContext>
        </section>
      </main>

      {/* =====================================================
          CARD DETAILS MODAL
      ===================================================== */}

      {activeCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() =>
            setActiveCard(null)
          }
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Card Details
                </p>

                <h2 className="break-words text-xl font-bold text-white">
                  {activeCard.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Collaborate with your team
                  on this card.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveCard(null)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            {/* COMMENTS */}

            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare
                  size={18}
                  className="text-indigo-400"
                />

                <h3 className="font-semibold">
                  Comments
                </h3>

                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                  {comments.length}
                </span>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {comments.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center">
                    <MessageSquare
                      size={28}
                      className="mx-auto mb-2 text-slate-700"
                    />

                    <p className="text-sm text-slate-500">
                      No comments yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Start the conversation.
                    </p>
                  </div>
                ) : (
                  comments.map(
                    (item) => (
                      <div
                        key={item._id}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold">
                            {item.author?.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <p className="text-xs font-semibold text-slate-300">
                            {item.author
                              ?.name ||
                              "User"}
                          </p>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {item.body}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>

              {/* COMMENT INPUT */}

              <div className="mt-5 flex gap-2">
                <input
                  value={
                    commentText
                  }
                  onChange={(event) =>
                    setCommentText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleAddComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

                <button
                  type="button"
                  onClick={
                    handleAddComment
                  }
                  disabled={
                    !commentText.trim()
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}