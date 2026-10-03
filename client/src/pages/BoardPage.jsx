import { useEffect, useMemo, useRef, useState } from "react";
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
  ArrowLeft,
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
  const [creatingList, setCreatingList] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);

  const [search, setSearch] = useState("");

  const [activeCard, setActiveCard] = useState(null);
  const activeCardRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);

  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openMenu, setOpenMenu] = useState(null);

  const [editingList, setEditingList] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingList, setSavingList] = useState(false);

  const [editingCard, setEditingCard] = useState(null);
  const [editingCardTitle, setEditingCardTitle] = useState("");
  const [editingCardDescription, setEditingCardDescription] =
    useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);

  /*
   * =========================================================
   * ORBIT PLANET NAVIGATION
   * =========================================================
   */

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [planetLaunching, setPlanetLaunching] = useState(false);
  const [planetLanding, setPlanetLanding] = useState(false);

  function openSidebar() {
    if (planetLaunching || planetLanding || sidebarOpen) {
      return;
    }

    setPlanetLaunching(true);

    window.setTimeout(() => {
      setSidebarOpen(true);
    }, 420);

    window.setTimeout(() => {
      setPlanetLaunching(false);
    }, 820);
  }

  function closeSidebar() {
    if (planetLanding) {
      return;
    }

    setSidebarOpen(false);
    setPlanetLanding(true);

    window.setTimeout(() => {
      setPlanetLanding(false);
    }, 820);
  }

  /*
   * =========================================================
   * TYPING
   * =========================================================
   */

  function stopTyping() {
    const socket = connectSocket();

    if (socket?.connected) {
      socket.emit("typing:stop", { boardId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function handleCommentInputChange(event) {
    const value = event.target.value;

    setCommentText(value);

    if (!activeCard) {
      return;
    }

    const socket = connectSocket();

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (socket?.connected) {
      socket.emit("typing:start", {
        boardId,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1500);
  }

          useEffect(() => {
  function handleDashboardShortcut(event) {
    const activeElement = document.activeElement;

    const isTyping =
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA" ||
      activeElement?.tagName === "SELECT" ||
      activeElement?.isContentEditable;

    if (isTyping) {
      return;
    }

    if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      navigate("/dashboard");
    }
  }

  window.addEventListener(
    "keydown",
    handleDashboardShortcut
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleDashboardShortcut
    );
  };
}, [navigate]);

  useEffect(() => {
    if (board?.name) {
      document.title = `Orbit • ${board.name}`;
    }

    return () => {
      document.title = "Orbit";
    };
  }, [board?.name]);

  /*
   * =========================================================
   * LOAD BOARD
   * =========================================================
   */

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
        console.error("Board loading error:", error);

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

  /*
   * =========================================================
   * SOCKET.IO
   * =========================================================
   */

  useEffect(() => {
    const socket = connectSocket();

    function handleConnect() {
      const currentUserId = String(
        user?._id || user?.id || ""
      );

      if (currentUserId) {
        setOnlineUsers((previous) => ({
          ...previous,
          [currentUserId]: {
            userId: currentUserId,
            name: user?.name || "You",
          },
        }));
      }

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

    function handlePresenceList(payload) {
      if (!Array.isArray(payload)) return;

      const next = {};

      payload.forEach((member) => {
        if (!member?.userId) return;

        const userId = String(member.userId);

        next[userId] = {
          userId,
          name: member.name || "User",
        };
      });

      setOnlineUsers(next);
    }

    function handlePresenceJoined(payload) {
      if (!payload?.userId) return;

      const userId = String(payload.userId);

      setOnlineUsers((previous) => ({
        ...previous,
        [userId]: {
          userId,
          name: payload.name || "User",
        },
      }));
    }

    function handlePresenceLeft(payload) {
      if (!payload?.userId) return;

      setOnlineUsers((previous) => {
        const next = { ...previous };

        delete next[String(payload.userId)];

        return next;
      });
    }

    function handleTypingStart(payload) {
      if (!payload?.userId) return;

      if (
        String(payload.userId) ===
        String(user?._id || user?.id)
      ) {
        return;
      }

      setTypingUsers((previous) => ({
        ...previous,
        [String(payload.userId)]: {
          userId: String(payload.userId),
          name: payload.name || "Someone",
        },
      }));
    }

    function handleTypingStop(payload) {
      if (!payload?.userId) return;

      setTypingUsers((previous) => {
        const next = { ...previous };

        delete next[String(payload.userId)];

        return next;
      });
    }

    function handleCommentCreated(comment) {
      if (!comment?._id || !comment?.card) return;

      const currentCard = activeCardRef.current;

      if (
        !currentCard ||
        String(comment.card) !==
          String(currentCard._id)
      ) {
        return;
      }

      setComments((previous) => {
        const alreadyExists = previous.some(
          (item) =>
            String(item._id) ===
            String(comment._id)
        );

        if (alreadyExists) {
          return previous;
        }

        return [...previous, comment];
      });
    }

    socket.on("connect", handleConnect);
    socket.on("card:created", handleCardCreated);
    socket.on("card:updated", handleCardUpdated);
    socket.on("card:moved", handleCardMoved);
    socket.on("card:deleted", handleCardDeleted);
    socket.on("notification:new", handleNotification);
    socket.on("presence:list", handlePresenceList);
    socket.on("presence:joined", handlePresenceJoined);
    socket.on("presence:left", handlePresenceLeft);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("comment:created", handleCommentCreated);
    socket.on(
      "comment:updated",
      handleCommentUpdated
    );

    socket.on(
      "comment:deleted",
      handleCommentDeleted
    );

    if (socket.connected) {
      socket.emit("board:join", boardId);
    }

    return () => {
      socket.emit("board:leave", boardId);

      socket.off("connect", handleConnect);
      socket.off("card:created", handleCardCreated);
      socket.off("card:updated", handleCardUpdated);
      socket.off("card:moved", handleCardMoved);
      socket.off("card:deleted", handleCardDeleted);
      socket.off("notification:new", handleNotification);
      socket.off("presence:list", handlePresenceList);
      socket.off("presence:joined", handlePresenceJoined);
      socket.off("presence:left", handlePresenceLeft);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("comment:created", handleCommentCreated);
      socket.off(
        "comment:updated",
        handleCommentUpdated
      );

      socket.off(
        "comment:deleted",
        handleCommentDeleted
      );

      stopTyping();
      setTypingUsers({});
      setOnlineUsers({});
    };
  }, [
    boardId,
    upsertCard,
    removeCard,
    addNotification,
    user,
  ]);

  function handleCommentUpdated(comment) {
  if (!comment?._id || !comment?.card) return;

  const currentCard = activeCardRef.current;

  if (
    !currentCard ||
    String(comment.card) !== String(currentCard._id)
  ) {
    return;
  }

  setComments((previous) =>
    previous.map((item) =>
      String(item._id) === String(comment._id)
        ? comment
        : item
    )
  );
}

function handleCommentDeleted(payload) {
  if (!payload?.commentId) return;

  const currentCard = activeCardRef.current;

  if (
    payload.cardId &&
    currentCard &&
    String(payload.cardId) !== String(currentCard._id)
  ) {
    return;
  }

  setComments((previous) =>
    previous.filter(
      (item) =>
        String(item._id) !== String(payload.commentId)
    )
  );
}

  /*
   * =========================================================
   * CREATE LIST
   * =========================================================
   */

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
      console.error("Create list error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to create list."
      );
    } finally {
      setCreatingList(false);
    }
  }

  /*
   * =========================================================
   * CREATE CARD
   * =========================================================
   */

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
      console.error("Create card error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to create card."
      );
    } finally {
      setCreatingCard(false);
    }
  }

  /*
   * =========================================================
   * EDIT CARD
   * =========================================================
   */

  function startEditingCard(card) {
    setEditingCard(card);
    setEditingCardTitle(card.title || "");
    setEditingCardDescription(
      card.description || ""
    );
    setActiveCard(null);
  }

  async function saveCardChanges() {
    const title = editingCardTitle.trim();

    if (
      !editingCard ||
      !title ||
      savingCard
    ) {
      return;
    }

    try {
      setSavingCard(true);
      setError("");

      const { data } = await api.patch(
        `/cards/${editingCard._id}`,
        {
          title,
          description:
            editingCardDescription.trim(),
        }
      );

      upsertCard(data.card);

      setEditingCard(null);
      setEditingCardTitle("");
      setEditingCardDescription("");
    } catch (error) {
      console.error(
        "Edit card error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update card."
      );
    } finally {
      setSavingCard(false);
    }
  }

  /*
   * =========================================================
   * PRIORITY
   * =========================================================
   */

  async function handlePriorityChange(event) {
    const priority = event.target.value;

    if (!activeCard || savingPriority) {
      return;
    }

    try {
      setSavingPriority(true);
      setError("");

      const { data } = await api.patch(
        `/cards/${activeCard._id}`,
        {
          priority,
        }
      );

      upsertCard(data.card);

      setActiveCard((previous) =>
        previous
          ? {
              ...previous,
              priority: data.card.priority,
            }
          : previous
      );
    } catch (error) {
      console.error(
        "Priority update error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update priority."
      );
    } finally {
      setSavingPriority(false);
    }
  }

  /*
   * =========================================================
   * DELETE CARD
   * =========================================================
   */

  async function handleDeleteCard(card) {
    const confirmed = window.confirm(
      `Delete "${card.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/cards/${card._id}`
      );

      removeCard(card._id);

      if (
        activeCard?._id === card._id
      ) {
        setActiveCard(null);
      }
    } catch (error) {
      console.error(
        "Delete card error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete card."
      );
    }
  }

  /*
   * =========================================================
   * RENAME LIST
   * =========================================================
   */

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

  /*
   * =========================================================
   * DELETE LIST
   * =========================================================
   */

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

  /*
   * =========================================================
   * DRAG & DROP
   * =========================================================
   */

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
      source.index ===
        destination.index
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

  /*
   * =========================================================
   * COMMENTS
   * =========================================================
   */

  async function openCard(card) {
    stopTyping();
    setTypingUsers({});
    setEditingComment(null);
    setEditingCommentText("");
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

      setComments((previous) => {
        const alreadyExists =
          previous.some(
            (item) =>
              String(item._id) ===
              String(data.comment._id)
          );

        if (alreadyExists) {
          return previous;
        }

        return [
          ...previous,
          data.comment,
        ];
      });

      stopTyping();
      setCommentText("");
    } catch (error) {
      console.error(
        "Comment error:",
        error
      );
    }
  }

   function startEditingComment(comment) {
  const currentUserId = String(
    user?._id || user?.id || ""
  );

  const authorId = String(
    comment.author?._id || comment.author?.id || comment.author || ""
  );

  if (!currentUserId || currentUserId !== authorId) {
    return;
  }

  setEditingComment(comment._id);
  setEditingCommentText(comment.body || "");
}

function cancelEditingComment() {
  if (savingComment) return;

  setEditingComment(null);
  setEditingCommentText("");
}

async function saveCommentEdit(comment) {
  const body = editingCommentText.trim();

  if (
    !activeCard ||
    !comment ||
    !body ||
    savingComment
  ) {
    return;
  }

  try {
    setSavingComment(true);

    const { data } = await api.patch(
      `/cards/${activeCard._id}/comments/${comment._id}`,
      {
        body,
      }
    );

    setComments((previous) =>
      previous.map((item) =>
        String(item._id) === String(comment._id)
          ? data.comment
          : item
      )
    );

    setEditingComment(null);
    setEditingCommentText("");
  } catch (error) {
    console.error(
      "Edit comment error:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Unable to update comment."
    );
  } finally {
    setSavingComment(false);
  }
}

async function handleDeleteComment(comment) {
  if (!activeCard || !comment || deletingComment) {
    return;
  }

  const currentUserId = String(
    user?._id || user?.id || ""
  );

  const authorId = String(
    comment.author?._id ||
      comment.author?.id ||
      comment.author ||
      ""
  );

  if (
    !currentUserId ||
    currentUserId !== authorId
  ) {
    return;
  }

  const confirmed = window.confirm(
    "Delete this comment?"
  );

  if (!confirmed) return;

  try {
    setDeletingComment(comment._id);

    await api.delete(
      `/cards/${activeCard._id}/comments/${comment._id}`
    );

    setComments((previous) =>
      previous.filter(
        (item) =>
          String(item._id) !==
          String(comment._id)
      )
    );

    if (
      String(editingComment) ===
      String(comment._id)
    ) {
      setEditingComment(null);
      setEditingCommentText("");
    }
  } catch (error) {
    console.error(
      "Delete comment error:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Unable to delete comment."
    );
  } finally {
    setDeletingComment(null);
  }
} 

  /*
   * =========================================================
   * SEARCH
   * =========================================================
   */

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

  const searchResultCount =
    filteredLists.reduce(
      (count, list) =>
        count + (list.cards || []).length,
      0
    );

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  function logout() {
    localStorage.removeItem(
      "orbit_token"
    );

    localStorage.removeItem(
      "orbit_user"
    );

    navigate("/login");
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-[#F4F0E7] text-[#203C35]">
          <div className="relative flex flex-col items-center">
            <div className="orbit-loading-planet">
              <div className="orbit-loading-ring" />
              <div className="orbit-loading-dot" />
            </div>

            <p className="mt-6 text-sm font-semibold tracking-wide text-[#60736C]">
              Preparing your orbit...
            </p>
          </div>
        </div>

        <style>{`
          .orbit-loading-planet {
            position: relative;
            width: 58px;
            height: 58px;
            border-radius: 999px;
            background:
              radial-gradient(circle at 30% 25%, #F7EEDC 0 7%, transparent 8%),
              radial-gradient(circle at 65% 68%, #B7D2C6 0 11%, transparent 12%),
              linear-gradient(145deg, #315C50, #19372F);
            box-shadow:
              0 14px 30px rgba(25, 55, 47, 0.2),
              inset -8px -8px 18px rgba(8, 28, 23, 0.22);
            animation: orbitLoadingFloat 1.7s ease-in-out infinite;
          }

          .orbit-loading-ring {
            position: absolute;
            inset: -10px;
            border: 1px solid rgba(49, 92, 80, 0.28);
            border-radius: 999px;
            border-top-color: #D58C70;
            animation: orbitLoadingSpin 1.5s linear infinite;
          }

          .orbit-loading-dot {
            position: absolute;
            width: 7px;
            height: 7px;
            right: -4px;
            top: 12px;
            border-radius: 999px;
            background: #D58C70;
            box-shadow: 0 0 14px rgba(213, 140, 112, 0.5);
          }

          @keyframes orbitLoadingFloat {
            0%, 100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-7px);
            }
          }

          @keyframes orbitLoadingSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  const workspaceName =
    board?.workspace?.name ||
    "Workspace";

  const onlineCount =
    Object.keys(onlineUsers).length;

  const totalCardCount = lists.reduce(
    (count, list) => count + (list.cards || []).length,
    0
  );

  return (
    <>
      <div
        className="min-h-screen overflow-hidden bg-[#F4F0E7] text-[#203C35]"
        onClick={() => setOpenMenu(null)}
      >

        {/* =====================================================
            PLANET NAVIGATION
        ===================================================== */}

        {!sidebarOpen && (
          <>
            <button
              type="button"
              onClick={openSidebar}
              aria-label="Open Orbit navigation"
              title="Open navigation"
              className={`orbit-planet-trigger fixed bottom-6 left-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full outline-none ${
                planetLaunching
                  ? "planet-launching"
                  : planetLanding
                    ? "planet-landing"
                    : ""
              }`}
            >
              <span className="orbit-planet-shadow" />

              <span className="orbit-planet group">
                <span className="orbit-planet-land land-one" />
                <span className="orbit-planet-land land-two" />
                <span className="orbit-planet-land land-three" />

                <span className="orbit-planet-atmosphere" />

                <span className="orbit-satellite satellite-one" />
                <span className="orbit-satellite satellite-two" />
              </span>
            </button>
          </>
        )}

        {/* =====================================================
            SIDEBAR BACKDROP
        ===================================================== */}

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="fixed inset-0 z-[50] bg-[#172E28]/10 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside
          className={`orbit-sidebar fixed left-0 top-0 z-[60] flex h-screen w-[292px] flex-col overflow-hidden border-r border-[#31574D] bg-[#203C35] text-[#F7EEDC] shadow-[24px_0_70px_rgba(28,55,47,0.18)] ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-[calc(100%-1px)]"
          }`}
        >

          {/* Sidebar atmosphere */}

          <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#A8CFC1]/[0.07] blur-2xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#D58C70]/[0.08] blur-3xl" />

          {/* BRAND */}

          <div className="relative border-b border-[#31574D] px-5 py-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="orbit-mini-planet">
                  <span />
                </div>

                <div>
                  <h1 className="text-lg font-bold tracking-tight text-[#F7EEDC]">
                    Orbit
                  </h1>

                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#AFC2BA]">
                    Collaborative space
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeSidebar}
                aria-label="Close navigation"
                className="rounded-xl p-2 text-[#AFC2BA] transition hover:bg-[#31574D] hover:text-[#F7EEDC]"
              >
                <X size={18} />
              </button>

            </div>

          </div>

          {/* WORKSPACE */}

          <div className="relative border-b border-[#31574D] p-4">

            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8EA79E]">
              Workspace
            </p>

            <div className="flex items-center gap-3 rounded-2xl border border-[#3B6258] bg-[#26483F] px-3 py-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B7D2C6]/10 text-[#B7D2C6]">
                <FolderKanban size={17} />
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-[#F7EEDC]">
                  {workspaceName}
                </p>

                <p className="mt-0.5 text-[11px] text-[#9DB3AA]">
                  Current workspace
                </p>

              </div>

            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="relative space-y-1 px-4 py-5">

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#AFC2BA] transition hover:bg-[#31574D] hover:text-[#F7EEDC]"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-[#55786D] bg-[#31574D] px-3 py-3 text-sm font-semibold text-[#F7EEDC] shadow-sm"
            >
              <FolderKanban
                size={18}
                className="text-[#B7D2C6]"
              />
              Boards

              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D58C70]" />
            </button>

            {board?.workspace?._id && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/workspaces/${board.workspace._id}/settings`
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#AFC2BA] transition hover:bg-[#31574D] hover:text-[#F7EEDC]"
              >
                <Settings size={18} />
                Workspace Settings
              </button>
            )}

          </nav>

          {/* CURRENT BOARD */}

          <div className="relative px-4">

            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8EA79E]">
              Current board
            </p>

            <div className="rounded-2xl border border-[#3B6258] bg-[#19352F] p-3.5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D58C70]/10 text-[#DFA18A]">
                  <FolderKanban size={17} />
                </div>

                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-[#F7EEDC]">
                    {board?.name || "Board"}
                  </p>

                  <p className="mt-1 text-[11px] text-[#8FA9A0]">
                    {lists.length}{" "}
                    {lists.length === 1
                      ? "list"
                      : "lists"}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* SIDEBAR FOOTER */}

          <div className="relative mt-auto border-t border-[#31574D] p-4">

            <div className="flex items-center gap-3">

              <div className="orbit-user-avatar">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-[#F7EEDC]">
                  {user?.name || "User"}
                </p>

                <p className="truncate text-[11px] text-[#91AAA1]">
                  {user?.email || ""}
                </p>

              </div>

              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="rounded-xl p-2 text-[#91AAA1] transition hover:bg-[#31574D] hover:text-[#DFA18A]"
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
          className="flex min-h-screen min-w-0 flex-col"
          onClick={() => setOpenMenu(null)}
        >

          {/* ===================================================
              HEADER
          =================================================== */}

          <header className="relative shrink-0 border-b border-[#DED8CA] bg-[#F8F5ED]/95 backdrop-blur-xl">

            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D58C70]/30 to-transparent" />

            <div className="flex min-h-[84px] items-center justify-between gap-5 px-5 lg:px-8">

              <div className="flex min-w-0 items-center gap-4">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                  title="Back to dashboard"
                  className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DED8CA] bg-[#F4F0E7] text-[#60736C] transition hover:border-[#B9C9C1] hover:bg-white hover:text-[#203C35] sm:flex"
                >
                  <ArrowLeft size={17} />
                </button>

                <div className="min-w-0">

                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#8A9892]">

                    <span className="truncate">
                      {workspaceName}
                    </span>

                    <ChevronRight size={12} />

                    <span>
                      Boards
                    </span>

                    <ChevronRight size={12} />

                    <span className="truncate font-semibold text-[#55736A]">
                      {board?.name || "Board"}
                    </span>

                  </div>

                  <h1 className="mt-1 truncate text-[25px] font-bold tracking-[-0.025em] text-[#203C35]">
                    {board?.name || "Board"}
                  </h1>

                </div>

              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">

                {/* ONLINE */}

                <div className="hidden items-center gap-2 rounded-full border border-[#D8E0DB] bg-[#EEF3EF] px-3 py-2 sm:flex">

                  <span className="relative flex h-2.5 w-2.5">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#79B69F] opacity-50" />

                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4D997E]" />

                  </span>

                  <span className="text-[11px] font-semibold text-[#60736C]">
                    {onlineCount}{" "}
                    {onlineCount === 1
                      ? "collaborator"
                      : "collaborators"}{" "}
                    online
                  </span>

                </div>

                {/* SEARCH */}

                <div className="flex h-11 items-center rounded-2xl border border-[#DCD6C9] bg-white px-3 shadow-[0_4px_18px_rgba(48,61,54,0.04)]">

                  <Search
                    size={17}
                    className="shrink-0 text-[#8B9892]"
                  />

                  <input
                    className="w-28 bg-transparent px-2.5 text-sm text-[#203C35] outline-none placeholder:text-[#A6ADA8] sm:w-48"
                    placeholder="Search cards..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Escape"
                      ) {
                        setSearch("");
                      }
                    }}
                  />

                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="rounded-lg p-1.5 text-[#89958F] transition hover:bg-[#F0ECE3] hover:text-[#203C35]"
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}

                </div>

                {search.trim() && (
                  <span className="hidden whitespace-nowrap text-[11px] font-semibold text-[#75847D] md:inline">
                    {searchResultCount}{" "}
                    {searchResultCount === 1
                      ? "card"
                      : "cards"}{" "}
                    found
                  </span>
                )}

                <button
                  type="button"
                  className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[#DCD6C9] bg-white text-[#718079] shadow-[0_4px_18px_rgba(48,61,54,0.04)] transition hover:border-[#BFCBC5] hover:bg-[#F7F4EC] hover:text-[#203C35] sm:flex"
                  title="Notifications"
                >
                  <Bell size={18} />
                </button>

              </div>

            </div>

            {/* BOARD TOOLBAR */}

            <div className="flex items-center justify-between border-t border-[#E8E3D9] px-5 py-3 lg:px-8">

              <div className="flex items-center gap-2.5 text-xs font-medium text-[#77857F]">

                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8EFEA] text-[#5E8375]">
                  <Users size={14} />
                </div>

                <span>
                  Collaborative board
                </span>

              </div>

              <div className="flex items-center gap-3">

                <span className="hidden text-[11px] font-medium text-[#9AA49F] sm:inline">
                  Drag cards to move them
                </span>

                <span className="rounded-full bg-[#E8E3D9] px-2.5 py-1 text-[10px] font-bold text-[#66756E]">
                  {lists.length}{" "}
                  {lists.length === 1 ? "list" : "lists"}
                  {" • "}
                  {totalCardCount}{" "}
                  {totalCardCount === 1 ? "card" : "cards"}
                </span>

              </div>

            </div>

          </header>

          {/* ===================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="mx-5 mt-4 flex items-center justify-between rounded-2xl border border-[#E5B6A7] bg-[#FFF0EB] px-4 py-3 text-sm text-[#A95842] shadow-sm lg:mx-8">

              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="rounded-lg p-1 transition hover:bg-[#F8DCD3]"
              >
                <X size={17} />
              </button>

            </div>
          )}

          {/* ===================================================
              KANBAN
          =================================================== */}

          <section className="flex-1 overflow-x-auto overflow-y-hidden bg-[#F4F0E7] p-5 lg:p-8">

            <DragDropContext
              onDragEnd={handleDragEnd}
            >

              <div className="flex min-h-full min-w-max items-start gap-5 pb-5">

                {/* SEARCH EMPTY STATE */}

                {search.trim() &&
                filteredLists.every(
                  (list) =>
                    (list.cards || [])
                      .length === 0
                ) ? (

                  <div className="flex min-h-[420px] w-full min-w-[620px] items-center justify-center">

                    <div className="max-w-md text-center">

                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#D9D4C8] bg-[#FAF8F2] text-[#81928A] shadow-[0_8px_30px_rgba(40,55,48,0.05)]">
                        <Search size={25} />
                      </div>

                      <h2 className="text-xl font-bold text-[#203C35]">
                        No cards found
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-[#7A8882]">
                        Nothing in this board matches{" "}
                        <span className="font-semibold text-[#526A61]">
                          "{search.trim()}"
                        </span>
                        .
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setSearch("")
                        }
                        className="mt-5 rounded-xl bg-[#31574D] px-5 py-2.5 text-sm font-semibold text-[#F7EEDC] shadow-[0_8px_20px_rgba(49,87,77,0.16)] transition hover:-translate-y-0.5 hover:bg-[#284C43]"
                      >
                        Clear search
                      </button>

                    </div>

                  </div>

                ) : (

                  filteredLists.map(
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
                            className={`orbit-list flex w-[318px] max-h-[calc(100vh-185px)] shrink-0 flex-col overflow-hidden rounded-[22px] border transition-all duration-200 ${
                              snapshot.isDraggingOver
                                ? "border-[#82AA9C] bg-[#EEF4F0] shadow-[0_12px_35px_rgba(55,88,76,0.10)]"
                                : "border-[#DAD5C9] bg-[#EEEAE1]"
                            }`}
                          >

                            {/* LIST HEADER */}

                            <div className="shrink-0 border-b border-[#DAD5C9] px-4 py-4">

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
                                    className="min-w-0 flex-1 rounded-xl border border-[#BFCBC5] bg-white px-3 py-2 text-sm font-medium text-[#203C35] outline-none focus:border-[#6F988A] focus:ring-2 focus:ring-[#A8CFC1]/20"
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
                                    className="rounded-xl bg-[#31574D] px-3 text-xs font-bold text-[#F7EEDC] transition hover:bg-[#284C43] disabled:opacity-50"
                                  >
                                    Save
                                  </button>

                                </div>

                              ) : (

                                <div className="flex items-center justify-between gap-3">

                                  <div className="flex min-w-0 items-center gap-2.5">

                                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#DCE8E2] text-[#527B6D]">
                                      <Circle
                                        size={8}
                                        fill="currentColor"
                                      />

                                      <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[#D58C70]" />
                                    </span>

                                    <div className="min-w-0">

                                      <h2 className="truncate text-sm font-bold text-[#29453D]">
                                        {list.title}
                                      </h2>

                                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8A9892]">
                                        {list.cards
                                          ?.length ||
                                          0}{" "}
                                        {list.cards
                                          ?.length === 1
                                          ? "card"
                                          : "cards"}
                                      </p>

                                    </div>

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
                                      className="rounded-xl p-2 text-[#7B8983] transition hover:bg-[#DDD8CC] hover:text-[#29453D]"
                                    >
                                      <MoreHorizontal
                                        size={18}
                                      />
                                    </button>

                                    {openMenu ===
                                      list._id && (

                                      <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-2xl border border-[#D6D1C5] bg-[#FBF9F3] p-1.5 shadow-[0_16px_45px_rgba(38,51,45,0.16)]">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            startEditingList(
                                              list
                                            )
                                          }
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#526A61] transition hover:bg-[#EEF2EE] hover:text-[#203C35]"
                                        >
                                          <Pencil size={15} />
                                          Rename
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteList(
                                              list
                                            )
                                          }
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#B06450] transition hover:bg-[#FFF0EB]"
                                        >
                                          <Trash2 size={15} />
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
                                          className={`orbit-card group cursor-grab rounded-[18px] border bg-[#FBF9F3] p-4 active:cursor-grabbing ${
                                            snapshot.isDragging
                                              ? "orbit-card-dragging border-[#7BA092] shadow-[0_22px_45px_rgba(36,61,52,0.18)]"
                                              : "border-[#DED9CD] shadow-[0_5px_18px_rgba(45,57,51,0.045)] hover:-translate-y-0.5 hover:border-[#BCCBC4] hover:shadow-[0_12px_28px_rgba(45,57,51,0.09)]"
                                          }`}
                                        >

                                          <div className="flex items-start justify-between gap-3">

                                            <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-[#29453D]">
                                              {card.title}
                                            </p>

                                            <div
                                              className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                                              onClick={(event) =>
                                                event.stopPropagation()
                                              }
                                            >

                                              <button
                                                type="button"
                                                title="Edit card"
                                                onClick={() =>
                                                  startEditingCard(
                                                    card
                                                  )
                                                }
                                                className="rounded-lg p-1.5 text-[#89968F] transition hover:bg-[#E9EEE9] hover:text-[#31574D]"
                                              >
                                                <Pencil size={14} />
                                              </button>

                                              <button
                                                type="button"
                                                title="Delete card"
                                                onClick={() =>
                                                  handleDeleteCard(
                                                    card
                                                  )
                                                }
                                                className="rounded-lg p-1.5 text-[#89968F] transition hover:bg-[#FFF0EB] hover:text-[#B06450]"
                                              >
                                                <Trash2 size={14} />
                                              </button>

                                            </div>

                                          </div>

                                          <div className="mt-4 flex items-center justify-between gap-3">

                                            <span
                                              className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                                                card.priority === "high"
                                                  ? "bg-[#F7DDD4] text-[#A85A43]"
                                                  : card.priority === "low"
                                                    ? "bg-[#E4EDE8] text-[#5E8375]"
                                                    : "bg-[#ECE8DC] text-[#7A786C]"
                                              }`}
                                            >
                                              {(
                                                card.priority ||
                                                "medium"
                                              ).charAt(0).toUpperCase() +
                                                (
                                                  card.priority ||
                                                  "medium"
                                                ).slice(1)}
                                            </span>

                                            <div className="flex items-center gap-1.5 text-[#9AA49F]">
                                              <MessageSquare
                                                size={13}
                                              />

                                              <span className="text-[10px] font-medium">
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

                                <div className="flex min-h-[100px] items-center justify-center rounded-[17px] border border-dashed border-[#D4CFC3] bg-[#F5F2EA]/60 px-4 text-center">

                                  <div>
                                    <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#E7E3D8] text-[#8B9892]">
                                      <Plus size={13} />
                                    </div>

                                    <p className="text-xs font-semibold text-[#718079]">
                                      No cards yet
                                    </p>

                                    <p className="mt-1 text-[10px] text-[#9AA49F]">
                                      Add a card to get started.
                                    </p>
                                  </div>

                                </div>
                              )}

                            </div>

                            {/* ADD CARD */}

                            <div className="shrink-0 border-t border-[#DAD5C9] p-3">

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
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-xs font-semibold text-[#687B73] transition hover:border-[#C9D4CE] hover:bg-[#F5F2EA] hover:text-[#31574D] disabled:opacity-50"
                              >

                                <Plus size={15} />

                                {creatingCard
                                  ? "Creating..."
                                  : "Add card"}

                              </button>

                            </div>

                          </div>

                        )}
                      </Droppable>
                    )
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
                  className="w-[318px] shrink-0 rounded-[22px] border border-dashed border-[#C9C4B8] bg-[#EEEAE1]/55 p-4"
                >

                  <div className="mb-4 flex items-center gap-3">

                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E2E8E2] text-[#5E8375]">
                      <Plus size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#526A61]">
                        New list
                      </p>

                      <p className="text-[10px] text-[#9AA49F]">
                        Add another stage
                      </p>
                    </div>

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
                    disabled={
                      creatingList
                    }
                    className="w-full rounded-xl border border-[#D8D3C8] bg-[#FBF9F3] px-3.5 py-3 text-sm font-medium text-[#29453D] outline-none placeholder:text-[#A6ADA8] focus:border-[#86A79A] focus:ring-2 focus:ring-[#A8CFC1]/20"
                  />

                  <button
                    type="submit"
                    disabled={
                      creatingList ||
                      !listTitle.trim()
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#31574D] px-3 py-3 text-xs font-bold text-[#F7EEDC] shadow-[0_8px_18px_rgba(49,87,77,0.12)] transition hover:-translate-y-0.5 hover:bg-[#284C43] disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    <Plus size={15} />

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
            EDIT CARD MODAL
        ===================================================== */}

        {editingCard && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172E28]/35 p-4 backdrop-blur-md"
            onClick={() => {
              if (!savingCard) {
                setEditingCard(null);
              }
            }}
          >

            <div
              className="w-full max-w-lg overflow-hidden rounded-[26px] border border-[#D8D3C7] bg-[#FBF9F3] shadow-[0_30px_80px_rgba(28,45,39,0.2)]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="border-b border-[#E1DCD1] px-6 py-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C9B8E]">
                      Card
                    </p>

                    <h2 className="mt-1 text-xl font-bold tracking-tight text-[#203C35]">
                      Edit card
                    </h2>

                  </div>

                  <button
                    type="button"
                    disabled={
                      savingCard
                    }
                    onClick={() =>
                      setEditingCard(null)
                    }
                    className="rounded-xl p-2 text-[#87938E] transition hover:bg-[#EEEAE1] hover:text-[#203C35] disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>

                </div>

              </div>

              <div className="space-y-5 p-6">

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#74837D]">
                    Title
                  </label>

                  <input
                    type="text"
                    value={
                      editingCardTitle
                    }
                    onChange={(event) =>
                      setEditingCardTitle(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        saveCardChanges();
                      }

                      if (
                        event.key ===
                        "Escape"
                      ) {
                        setEditingCard(
                          null
                        );
                      }
                    }}
                    autoFocus
                    className="w-full rounded-xl border border-[#D8D3C7] bg-white px-4 py-3 text-sm font-medium text-[#29453D] outline-none placeholder:text-[#A7AEAA] focus:border-[#7EA395] focus:ring-2 focus:ring-[#A8CFC1]/20"
                    placeholder="Card title"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#74837D]">
                    Description
                  </label>

                  <textarea
                    value={
                      editingCardDescription
                    }
                    onChange={(event) =>
                      setEditingCardDescription(
                        event.target.value
                      )
                    }
                    rows={5}
                    className="w-full resize-none rounded-xl border border-[#D8D3C7] bg-white px-4 py-3 text-sm leading-6 text-[#29453D] outline-none placeholder:text-[#A7AEAA] focus:border-[#7EA395] focus:ring-2 focus:ring-[#A8CFC1]/20"
                    placeholder="Add a description..."
                  />

                </div>

                <div className="flex justify-end gap-3 border-t border-[#E7E2D8] pt-5">

                  <button
                    type="button"
                    disabled={
                      savingCard
                    }
                    onClick={() =>
                      setEditingCard(null)
                    }
                    className="rounded-xl border border-[#D8D3C7] px-4 py-2.5 text-sm font-semibold text-[#718079] transition hover:bg-[#F0ECE3] hover:text-[#29453D] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      savingCard ||
                      !editingCardTitle.trim()
                    }
                    onClick={
                      saveCardChanges
                    }
                    className="rounded-xl bg-[#31574D] px-5 py-2.5 text-sm font-bold text-[#F7EEDC] shadow-[0_8px_18px_rgba(49,87,77,0.14)] transition hover:bg-[#284C43] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingCard
                      ? "Saving..."
                      : "Save changes"}
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            CARD DETAILS MODAL
        ===================================================== */}

        {activeCard && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172E28]/35 p-4 backdrop-blur-md"
            onClick={() => {
              stopTyping();
              setTypingUsers({});
              setEditingComment(null);
              setEditingCommentText("");
              setActiveCard(null);
            }}
          >

            <div
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#D8D3C7] bg-[#FBF9F3] shadow-[0_30px_80px_rgba(28,45,39,0.2)]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="shrink-0 border-b border-[#E1DCD1] px-6 py-5">

                <div className="flex items-start justify-between gap-5">

                  <div className="min-w-0">

                    <div className="mb-2 flex items-center gap-2">

                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E2EAE5] text-[#5E8375]">
                        <MessageSquare size={14} />
                      </span>

                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#789389]">
                        Card details
                      </p>

                    </div>

                    <h2 className="break-words text-xl font-bold tracking-tight text-[#203C35]">
                      {activeCard.title}
                    </h2>

                    <p className="mt-1 text-sm text-[#7C8983]">
                      Collaborate with your team on this card.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      stopTyping();
                      setTypingUsers({});
                      setActiveCard(null);
                    }}
                    className="shrink-0 rounded-xl p-2 text-[#87938E] transition hover:bg-[#EEEAE1] hover:text-[#203C35]"
                  >
                    <X size={19} />
                  </button>

                </div>

              </div>

              {/* PRIORITY */}

              <div className="shrink-0 border-b border-[#E1DCD1] bg-[#F6F3EB] px-6 py-5">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A8A83]">
                      Priority
                    </p>

                    <p className="mt-1 text-sm text-[#74827C]">
                      Set the urgency of this card.
                    </p>

                  </div>

                  <select
                    value={
                      activeCard.priority ||
                      "medium"
                    }
                    onChange={
                      handlePriorityChange
                    }
                    disabled={
                      savingPriority
                    }
                    className="rounded-xl border border-[#D4D0C5] bg-[#FBF9F3] px-3 py-2.5 text-sm font-semibold text-[#31574D] outline-none transition focus:border-[#7EA395] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>
                  </select>

                </div>

              </div>

              {/* COMMENTS */}

              <div className="min-h-0 flex-1 overflow-y-auto p-6">

                <div className="mb-4 flex items-center gap-2">

                  <h3 className="text-sm font-bold text-[#29453D]">
                    Comments
                  </h3>

                  <span className="rounded-full bg-[#E8E3D9] px-2 py-0.5 text-[10px] font-bold text-[#718079]">
                    {comments.length}
                  </span>

                </div>

                <div className="space-y-3">

                  {comments.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-[#D7D2C6] bg-[#F6F3EB] py-10 text-center">

                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7ECE7] text-[#83958D]">
                        <MessageSquare size={19} />
                      </div>

                      <p className="text-sm font-semibold text-[#66766F]">
                        No comments yet
                      </p>

                      <p className="mt-1 text-xs text-[#9AA49F]">
                        Start the conversation.
                      </p>

                    </div>

                  ) : (

                    comments.map(
                      (item) => (

                        <div
                        key={item._id}
                        className="rounded-xl border border-slate-700/70 bg-green-800/80 p-4 transition-colors hover:border-slate-600/80 hover:bg-green-800/60"
                      >
                        {(() => {
                          const currentUserId = String(
                            user?._id || user?.id || ""
                          );

                          const authorId = String(
                            item.author?._id ||
                              item.author?.id ||
                              item.author ||
                              ""
                          );

                          const isOwnComment =
                            currentUserId &&
                            authorId &&
                            currentUserId === authorId;

                          const isEditing =
                            String(editingComment) ===
                            String(item._id);

                          return (
                            <>
                              {/* COMMENT HEADER */}

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff23] text-xs font-semibold">
                                    {item.author?.name
                                      ?.charAt(0)
                                      ?.toUpperCase() || "U"}
                                  </div>

                                  <p className="truncate text-xs font-semibold text-slate-200">
                                    {item.author?.name || "User"}
                                  </p>

                                  {isOwnComment && (
                                    <span className="rounded-full bg-[#002323] px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                                      You
                                    </span>
                                  )}
                                </div>

                                {/* ACTIONS */}

                                {isOwnComment && !isEditing && (
                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditingComment(item)
                                      }
                                      className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-200"
                                      title="Edit comment"
                                    >
                                      <Pencil size={14} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(item)
                                      }
                                      disabled={
                                        deletingComment === item._id
                                      }
                                      className="rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                                      title="Delete comment"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* COMMENT BODY / EDITOR */}

                              {isEditing ? (
                                <div className="mt-3">
                                  <textarea
                                    autoFocus
                                    value={editingCommentText}
                                    onChange={(event) =>
                                      setEditingCommentText(
                                        event.target.value
                                      )
                                    }
                                    onKeyDown={(event) => {
                                      if (
                                        event.key === "Escape"
                                      ) {
                                        cancelEditingComment();
                                      }

                                      if (
                                        event.key === "Enter" &&
                                        !event.shiftKey
                                      ) {
                                        event.preventDefault();
                                        saveCommentEdit(item);
                                      }
                                    }}
                                    rows={3}
                                    maxLength={2000}
                                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                                  />

                                  <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-[10px] text-slate-600">
                                      Enter to save · Shift + Enter for new line
                                    </span>

                                    <div className="flex shrink-0 gap-2">
                                      <button
                                        type="button"
                                        disabled={savingComment}
                                        onClick={
                                          cancelEditingComment
                                        }
                                        className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
                                      >
                                        Cancel
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          savingComment ||
                                          !editingCommentText.trim()
                                        }
                                        onClick={() =>
                                          saveCommentEdit(item)
                                        }
                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        {savingComment
                                          ? "Saving..."
                                          : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#000]">
                                  {item.body}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      )
                    )
                  )}

                </div>

                {/* TYPING */}

                {Object.values(
                  typingUsers
                ).length > 0 && (

                  <div className="mt-4 flex min-h-5 items-center gap-2 text-xs text-[#7E8D86]">

                    <span className="flex items-center gap-1">

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6F9D8D]" />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6F9D8D]"
                        style={{
                          animationDelay:
                            "120ms",
                        }}
                      />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6F9D8D]"
                        style={{
                          animationDelay:
                            "240ms",
                        }}
                      />

                    </span>

                    <span>

                      {Object.values(
                        typingUsers
                      )
                        .slice(0, 2)
                        .map(
                          (item) =>
                            item.name
                        )
                        .join(" and ")}

                      {Object.values(
                        typingUsers
                      ).length > 2
                        ? " and others"
                        : ""}{" "}

                      {Object.values(
                        typingUsers
                      ).length === 1
                        ? "is"
                        : "are"}{" "}
                      typing...

                    </span>

                  </div>
                )}

                {/* COMMENT INPUT */}

                <div className="mt-5 flex gap-2">

                  <input
                    value={
                      commentText
                    }
                    onChange={
                      handleCommentInputChange
                    }
                    onBlur={
                      stopTyping
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
                    className="min-w-0 flex-1 rounded-xl border border-[#D8D3C7] bg-white px-4 py-3 text-sm text-[#29453D] outline-none placeholder:text-[#A5ACA7] focus:border-[#7EA395] focus:ring-2 focus:ring-[#A8CFC1]/20"
                  />

                  <button
                    type="button"
                    onClick={
                      handleAddComment
                    }
                    disabled={
                      !commentText.trim()
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#31574D] text-[#F7EEDC] shadow-[0_8px_18px_rgba(49,87,77,0.13)] transition hover:bg-[#284C43] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      <style>{`

        /* =====================================================
           ORBIT PLANET
        ===================================================== */

        .orbit-planet-trigger {
          transform-origin: center;
          animation: planetFloat 3.8s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .orbit-planet-trigger.planet-launching {
          animation: planetLaunch 820ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .orbit-planet-trigger.planet-landing {
          animation: planetLanding 820ms
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .orbit-planet {
          position: relative;
          width: 54px;
          height: 54px;
          overflow: visible;
          border-radius: 999px;
          background:
            radial-gradient(
              circle at 29% 24%,
              rgba(255,255,255,0.85) 0 4%,
              transparent 5%
            ),
            radial-gradient(
              circle at 69% 67%,
              rgba(184,214,202,0.35) 0 13%,
              transparent 14%
            ),
            radial-gradient(
              circle at 44% 72%,
              rgba(13,46,38,0.35) 0 9%,
              transparent 10%
            ),
            linear-gradient(
              145deg,
              #426D60,
              #19382F
            );
          box-shadow:
            0 15px 34px rgba(25,55,47,0.25),
            inset -8px -9px 18px rgba(9,31,25,0.28),
            inset 6px 6px 14px rgba(255,255,255,0.08);
          transition:
            transform 240ms ease,
            box-shadow 240ms ease;
        }

        .orbit-planet-trigger:hover
        .orbit-planet {
          transform: scale(1.08);
          box-shadow:
            0 19px 42px rgba(25,55,47,0.3),
            inset -8px -9px 18px rgba(9,31,25,0.28),
            0 0 0 5px rgba(213,140,112,0.08);
        }

        .orbit-planet-trigger:active
        .orbit-planet {
          transform: scale(0.95);
        }

        .orbit-planet-land {
          position: absolute;
          display: block;
          border-radius: 999px;
          background: rgba(174,207,195,0.17);
        }

        .land-one {
          width: 18px;
          height: 8px;
          left: 8px;
          top: 17px;
          transform: rotate(-22deg);
        }

        .land-two {
          width: 11px;
          height: 16px;
          right: 10px;
          top: 10px;
          transform: rotate(28deg);
        }

        .land-three {
          width: 16px;
          height: 7px;
          right: 11px;
          bottom: 13px;
          transform: rotate(-15deg);
        }

        .orbit-planet-atmosphere {
          position: absolute;
          inset: -2px;
          border: 1px solid rgba(207,231,220,0.18);
          border-radius: 999px;
          box-shadow:
            0 0 0 1px rgba(25,55,47,0.05);
        }

        .orbit-planet-shadow {
          position: absolute;
          bottom: -5px;
          left: 50%;
          width: 37px;
          height: 7px;
          border-radius: 999px;
          background: rgba(27,48,42,0.12);
          filter: blur(4px);
          transform: translateX(-50%);
          transition: opacity 240ms ease;
        }

        .orbit-planet-trigger:hover
        .orbit-planet-shadow {
          opacity: 0.65;
        }

        .orbit-satellite {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #D58C70;
          box-shadow: 0 0 12px rgba(213,140,112,0.55);
        }

        .satellite-one {
          right: -2px;
          top: 10px;
        }

        .satellite-two {
          left: 2px;
          bottom: 12px;
          width: 4px;
          height: 4px;
          background: #B7D2C6;
          box-shadow: 0 0 9px rgba(183,210,198,0.45);
        }

        @keyframes planetFloat {
          0%, 100% {
            transform:
              translate3d(0, 0, 0);
          }

          50% {
            transform:
              translate3d(1px, -6px, 0);
          }
        }

        @keyframes planetLaunch {
          0% {
            transform:
              translate3d(0, 0, 0)
              scale(1);
            opacity: 1;
          }

          10% {
            transform:
              translate3d(2px, -12px, 0)
              scale(1.02);
          }

          25% {
            transform:
              translate3d(7px, -85px, 0)
              scale(1.05);
          }

          42% {
            transform:
              translate3d(12px, -230px, 0)
              scale(1.08);
          }

          60% {
            transform:
              translate3d(17px, -420px, 0)
              scale(1.09);
          }

          76% {
            transform:
              translate3d(20px, calc(-1 * (100vh - 115px)), 0)
              scale(1.04);
            opacity: 1;
          }

          88% {
            transform:
              translate3d(21px, calc(-1 * (100vh - 105px)), 0)
              scale(0.98);
            opacity: 0.75;
          }

          100% {
            transform:
              translate3d(22px, calc(-1 * (100vh - 90px)), 0)
              scale(0.88);
            opacity: 0;
          }
        }

        @keyframes planetLanding {
          0% {
            transform:
              translate3d(22px, calc(-1 * (100vh - 90px)), 0)
              scale(0.88);
            opacity: 0;
          }

          12% {
            transform:
              translate3d(21px, calc(-1 * (100vh - 105px)), 0)
              scale(0.98);
            opacity: 0.8;
          }

          28% {
            transform:
              translate3d(19px, calc(-1 * (100vh - 115px)), 0)
              scale(1.04);
            opacity: 1;
          }

          48% {
            transform:
              translate3d(15px, -390px, 0)
              scale(1.08);
          }

          66% {
            transform:
              translate3d(9px, -190px, 0)
              scale(1.05);
          }

          80% {
            transform:
              translate3d(4px, -45px, 0)
              scale(0.99);
          }

          89% {
            transform:
              translate3d(1px, 7px, 0)
              scale(1.02);
          }

          95% {
            transform:
              translate3d(0, -2px, 0)
              scale(0.995);
          }

          100% {
            transform:
              translate3d(0, 0, 0)
              scale(1);
            opacity: 1;
          }
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .orbit-sidebar {
          transition:
            transform 620ms
              cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 620ms ease;
          will-change: transform;
        }

        .orbit-mini-planet {
          position: relative;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 999px;
          background:
            radial-gradient(
              circle at 30% 25%,
              #F7EEDC 0 4%,
              transparent 5%
            ),
            linear-gradient(
              145deg,
              #426D60,
              #19382F
            );
          box-shadow:
            inset -6px -7px 12px rgba(8,28,23,0.28);
        }

        .orbit-mini-planet span {
          position: absolute;
          width: 14px;
          height: 6px;
          left: 8px;
          top: 13px;
          border-radius: 999px;
          background: rgba(183,210,198,0.2);
          transform: rotate(-20deg);
        }

        .orbit-user-avatar {
          display: flex;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background:
            linear-gradient(
              145deg,
              #D58C70,
              #B86F57
            );
          color: #FFF6EA;
          font-size: 12px;
          font-weight: 800;
          box-shadow:
            0 7px 16px rgba(20,42,35,0.15);
        }

        /* =====================================================
           CARDS
        ===================================================== */

        .orbit-card {
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .orbit-card-dragging {
          transform:
            rotate(1.2deg)
            scale(1.02);
        }

        /* =====================================================
           SCROLLBARS
        ===================================================== */

        .orbit-sidebar ::-webkit-scrollbar,
        .orbit-list ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }

        .orbit-sidebar ::-webkit-scrollbar-track,
        .orbit-list ::-webkit-scrollbar-track {
          background: transparent;
        }

        .orbit-sidebar ::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #42685D;
        }

        .orbit-list ::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #C8C4B9;
        }

        .orbit-sidebar ::-webkit-scrollbar-thumb:hover {
          background: #52786C;
        }

        .orbit-list ::-webkit-scrollbar-thumb:hover {
          background: #B4B0A5;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 640px) {
          .orbit-sidebar {
            width: min(292px, 86vw);
          }

          .orbit-planet-trigger {
            bottom: 18px;
            left: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-planet-trigger,
          .orbit-planet-trigger.planet-launching,
          .orbit-planet-trigger.planet-landing,
          .orbit-sidebar,
          .orbit-card {
            animation: none !important;
            transition: none !important;
          }
        }

      `}</style>
    </>
  );
}