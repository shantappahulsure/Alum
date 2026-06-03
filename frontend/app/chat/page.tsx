"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  getConversation,
  sendMessage,
  getConversations,
  markMessageSeen,
  searchUsers,
} from "@/lib/chat";

import { socket } from "@/lib/socket";

import { useAuth } from "@/contexts/AuthContext";

import EmojiPicker, {
  Theme,
} from "emoji-picker-react";

export default function ChatPage() {
  const { user } = useAuth();

  /*
========================================
STATES
========================================
*/

  const [
    receiverUsername,
    setReceiverUsername,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<any[]>([]);

  const [
    onlineUsers,
    setOnlineUsers,
  ] = useState<string[]>([]);

  const [typingUser, setTypingUser] =
    useState("");

  const [messages, setMessages] =
    useState<any[]>([]);

  const [sending, setSending] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [
    conversations,
    setConversations,
  ] = useState<any[]>([]);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const typingTimeoutRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const typingIndicatorTimeoutRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  /*
========================================
AUTO SCROLL
========================================
*/

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /*
========================================
LOAD CONVERSATIONS
========================================
*/

  useEffect(() => {
    const loadConversations =
      async () => {
        if (!user?.username)
          return;

        try {
          const data =
            await getConversations(
              user.username
            );

          setConversations(
            data.conversations ||
              []
          );
        } catch (error) {
          console.log(error);
        }
      };

    loadConversations();
  }, [user]);

  /*
========================================
SEARCH USERS
========================================
*/

  useEffect(() => {
    const fetchUsers =
      async () => {
        if (!search.trim()) {
          setSearchResults([]);
          return;
        }

        try {
          const data =
            await searchUsers(
              search
            );

          setSearchResults(
            data.users || []
          );
        } catch (error) {
          console.log(error);
        }
      };

    const timeout =
      setTimeout(() => {
        fetchUsers();
      }, 300);

    return () =>
      clearTimeout(timeout);
  }, [search]);

  /*
========================================
REALTIME SOCKETS
========================================
*/

  useEffect(() => {
    const handleNewMessage = (
      data: any
    ) => {
      const isCurrentChat =
        (data.senderUsername ===
          receiverUsername &&
          data.receiverUsername ===
            user?.username) ||
        (data.senderUsername ===
          user?.username &&
          data.receiverUsername ===
            receiverUsername);

      /*
========================================
ADD MESSAGE
========================================
*/

      if (isCurrentChat) {
        setMessages((prev) => {
          const exists =
            prev.some(
              (msg) =>
                msg._id === data._id
            );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            data,
          ];
        });

        /*
========================================
MARK AS SEEN
========================================
*/

        if (
          data.receiverUsername ===
          user?.username
        ) {
          markMessageSeen(
            data._id
          );
        }
      }

      /*
========================================
UPDATE SIDEBAR
========================================
*/

      const otherUser =
        data.senderUsername ===
        user?.username
          ? data.receiverUsername
          : data.senderUsername;

      setConversations(
        (prev: any[]) => {
          const filtered =
            prev.filter(
              (chat) =>
                chat.username !==
                otherUser
            );

          const oldChat =
            prev.find(
              (chat) =>
                chat.username ===
                otherUser
            );

          const updatedChat = {
            username:
              otherUser,

            lastMessage:
              data.message ||
              data.fileName ||
              "📎 Attachment",

            lastMessageTime:
              data.createdAt,

            unreadCount:
              data.receiverUsername ===
                user?.username &&
              receiverUsername !==
                otherUser
                ? (oldChat
                    ?.unreadCount ||
                    0) + 1
                : 0,
          };

          return [
            updatedChat,
            ...filtered,
          ];
        }
      );
    };

    /*
========================================
ONLINE USERS
========================================
*/

    const handleOnlineUsers = (
      users: string[]
    ) => {
      setOnlineUsers(users);
    };

    /*
========================================
MESSAGE SEEN
========================================
*/

    const handleMessageSeen =
      (data: any) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (
              msg._id ===
              data.messageId
            ) {
              return {
                ...msg,
                seen: true,
              };
            }

            return msg;
          })
        );
      };

    /*
========================================
TYPING
========================================
*/

    const handleTyping = (
      username: string
    ) => {
      setTypingUser(username);

      if (
        typingIndicatorTimeoutRef.current
      ) {
        clearTimeout(
          typingIndicatorTimeoutRef.current
        );
      }

      typingIndicatorTimeoutRef.current =
        setTimeout(() => {
          setTypingUser("");
        }, 4000);
    };

    /*
========================================
STOP TYPING
========================================
*/

    const handleStopTyping =
      () => {
        setTypingUser("");
      };

    /*
========================================
REGISTER EVENTS
========================================
*/

    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.on(
      "typing",
      handleTyping
    );

    socket.on(
      "stopTyping",
      handleStopTyping
    );

    socket.on(
      "messageSeen",
      handleMessageSeen
    );

    /*
========================================
CLEANUP
========================================
*/

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

      socket.off(
        "typing",
        handleTyping
      );

      socket.off(
        "stopTyping",
        handleStopTyping
      );

      socket.off(
        "messageSeen",
        handleMessageSeen
      );
    };
  }, [
    user,
    receiverUsername,
  ]);

  /*
========================================
LOAD CONVERSATION
========================================
*/

  const loadConversation =
    async (
      username?: string
    ) => {
      const selectedUsername =
        username ||
        receiverUsername;

      if (
        !user?.username ||
        !selectedUsername
      ) {
        return;
      }

      setReceiverUsername(
        selectedUsername
      );

      setSearch("");

      setSearchResults([]);

      try {
        const data =
          await getConversation(
            user.username,
            selectedUsername
          );

        setMessages(
          data.messages || []
        );

        /*
========================================
RESET UNREAD
========================================
*/

        setConversations(
          (prev: any[]) =>
            prev.map((chat) => {
              if (
                chat.username ===
                selectedUsername
              ) {
                return {
                  ...chat,
                  unreadCount: 0,
                };
              }

              return chat;
            })
        );

        /*
========================================
MARK AS SEEN
========================================
*/

        data.messages.forEach(
          async (msg: any) => {
            if (
              msg.receiverUsername ===
                user?.username &&
              !msg.seen
            ) {
              await markMessageSeen(
                msg._id
              );
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
    };

  /*
========================================
SEND MESSAGE
========================================
*/

  const handleSend =
    async () => {
      if (
        (!message.trim() &&
          !selectedFile) ||
        !receiverUsername ||
        !user?.username ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        const formData =
          new FormData();

        formData.append(
          "senderUsername",
          user.username
        );

        formData.append(
          "receiverUsername",
          receiverUsername
        );

        formData.append(
          "message",
          message
        );

        if (selectedFile) {
          formData.append(
            "file",
            selectedFile
          );
        }

        const response =
          await sendMessage(
            formData
          );

        if (
          response?.success &&
          response?.data
        ) {
          setMessage("");

          setSelectedFile(
            null
          );

          setConversations(
            (prev: any[]) => {
              const filtered =
                prev.filter(
                  (chat) =>
                    chat.username !==
                    receiverUsername
                );

              const updatedChat = {
                username:
                  receiverUsername,

                lastMessage:
                  response.data
                    .message ||
                  response.data
                    .fileName ||
                  "📎 Attachment",

                lastMessageTime:
                  response.data
                    .createdAt,

                unreadCount: 0,
              };

              return [
                updatedChat,
                ...filtered,
              ];
            }
          );

          socket.emit(
            "stopTyping",
            {
              senderUsername:
                user.username,

              receiverUsername,
            }
          );
        }
      } catch (error: any) {
        console.log(error);

        alert(
          error?.message ||
            "Failed to send message"
        );
      } finally {
        setSending(false);
      }
    };

  /*
========================================
MESSAGE INPUT
========================================
*/

  const handleMessageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      e.target.value;

    setMessage(value);

    if (
      !receiverUsername ||
      !user?.username
    ) {
      return;
    }

    socket.emit(
      "typing",
      {
        senderUsername:
          user.username,

        receiverUsername,
      }
    );

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        socket.emit(
          "stopTyping",
          {
            senderUsername:
              user.username,

            receiverUsername,
          }
        );
      }, 4000);
  };

  /*
========================================
ADD EMOJI
========================================
*/

  const handleEmojiClick = (
    emojiData: any
  ) => {
    setMessage(
      (prev) =>
        prev + emojiData.emoji
    );
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">

      {/* SIDEBAR */}

      <div className="w-[360px] border-r border-zinc-800 bg-[#0b0b0b] flex flex-col">

        {/* HEADER */}

        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-4xl font-bold tracking-tight">
            Messages
          </h1>

          <p className="text-zinc-500 text-sm mt-1">
            Realtime conversations
          </p>

          {/* SEARCH */}

          <div className="mt-5 relative">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="
w-full
bg-zinc-900
border
border-zinc-800
rounded-2xl
px-5
py-4
outline-none
focus:border-zinc-600
text-white
placeholder:text-zinc-500
"
            />

            {searchResults.length >
              0 && (
              <div
                className="
absolute
top-[72px]
left-0
right-0
bg-[#111111]
border
border-zinc-800
rounded-2xl
overflow-hidden
z-50
shadow-2xl
"
              >
                {searchResults.map(
                  (userData) => (
                    <button
                      key={
                        userData._id
                      }
                      onClick={() =>
                        loadConversation(
                          userData.username
                        )
                      }
                      className="
w-full
flex
items-center
gap-4
px-4
py-4
hover:bg-zinc-900
transition-all
border-b
border-zinc-800
last:border-none
"
                    >
                      <div
                        className="
w-12
h-12
rounded-full
bg-gradient-to-br
from-zinc-700
to-zinc-900
flex
items-center
justify-center
font-bold
text-lg
"
                      >
                        {userData.username
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>

                      <div className="text-left overflow-hidden">
                        <p className="font-semibold text-white truncate">
                          {
                            userData.username
                          }
                        </p>

                        <p className="text-xs text-zinc-500 truncate">
                          {
                            userData.email
                          }
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONVERSATIONS */}

        <div className="flex-1 overflow-y-auto">
          {conversations.map(
            (chat: any) => {
              const isOnline =
                onlineUsers.includes(
                  chat.username
                );

              return (
                <button
                  key={chat.username}
                  onClick={() =>
                    loadConversation(
                      chat.username
                    )
                  }
                  className={`
w-full
px-5
py-5
flex
items-center
justify-between
transition-all
border-b
border-zinc-900
${
  receiverUsername ===
  chat.username
    ? "bg-zinc-900"
    : "hover:bg-zinc-950"
}
`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative">
                      <div
                        className="
w-14
h-14
rounded-full
bg-gradient-to-br
from-zinc-700
to-zinc-900
flex
items-center
justify-center
font-bold
text-lg
"
                      >
                        {chat.username
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>

                      <div
                        className={`
absolute
bottom-0
right-0
w-3
h-3
rounded-full
border-2
border-[#0b0b0b]
${
  isOnline
    ? "bg-green-500"
    : "bg-zinc-600"
}
`}
                      />
                    </div>

                    <div className="overflow-hidden text-left">
                      <p className="font-semibold text-white truncate">
                        {
                          chat.username
                        }
                      </p>

                      <p className="text-sm text-zinc-500 truncate mt-1">
                        {chat.lastMessage ||
                          "No messages yet"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs text-zinc-500">
                      {chat.lastMessageTime
                        ? new Date(
                            chat.lastMessageTime
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            }
                          )
                        : ""}
                    </p>

                    {chat.unreadCount >
                      0 && (
                      <div
                        className="
min-w-[24px]
h-[24px]
rounded-full
bg-green-500
text-black
text-xs
font-bold
flex
items-center
justify-center
px-2
"
                      >
                        {
                          chat.unreadCount
                        }
                      </div>
                    )}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* CHAT AREA */}

      <div className="flex-1 flex flex-col bg-[#050505]">

        {/* HEADER */}

        <div className="h-[90px] border-b border-zinc-800 px-8 flex items-center justify-between bg-[#0d0d0d]">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {receiverUsername ||
                "Messages"}
            </h1>

            <p className="text-sm text-zinc-500 mt-1">
              {typingUser
                ? `${typingUser} is typing...`
                : "Realtime messaging"}
            </p>
          </div>

          {receiverUsername && (
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  onlineUsers.includes(
                    receiverUsername
                  )
                    ? "bg-green-500"
                    : "bg-zinc-600"
                }`}
              />

              <p className="text-sm text-zinc-400">
                {onlineUsers.includes(
                  receiverUsername
                )
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          )}
        </div>

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto px-10 py-8 bg-[#050505]">
          {!receiverUsername ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div
                className="
w-28
h-28
rounded-full
bg-zinc-900
border
border-zinc-800
flex
items-center
justify-center
text-5xl
shadow-2xl
"
              >
                💬
              </div>

              <h1 className="text-4xl font-bold mt-8 text-white tracking-tight">
                Your Messages
              </h1>

              <p className="text-zinc-500 mt-4 max-w-md leading-relaxed text-[15px]">
                Select a conversation or search for users
                to start chatting in realtime.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages
                .filter(Boolean)
                .map(
                  (
                    msg,
                    index
                  ) => {
                    console.log("MESSAGE:", msg);
                    const isMine =
                      msg?.senderUsername ===
                      user?.username;

                    return (
                      <div
                        key={
                          msg._id ||
                          index
                        }
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`
max-w-[70%]
px-5
py-4
rounded-3xl
transition-all
duration-200
shadow-xl
${
  isMine
    ? "bg-white text-black rounded-br-md"
    : "bg-zinc-900 border border-zinc-800 text-white rounded-bl-md"
}
`}
                        >

                          {/* MESSAGE CONTENT */}

                          <div className="flex flex-col gap-2">

                     {/* IMAGE */}

{msg.fileType?.startsWith("image") && (
  <a
    href={
      msg.image ||
      msg.fileUrl ||
      msg.file
    }
    target="_blank"
    rel="noopener noreferrer"
    className="block mt-2"
  >
    <img
      src={`${
        msg.image ||
        msg.fileUrl ||
        msg.file
      }?t=${Date.now()}`}
      alt="attachment"
      onError={() => {
        console.log(
          "IMAGE FAILED:",
          msg.image
        );
      }}
      className="
block
w-[260px]
rounded-2xl
border
border-zinc-700
object-cover
hover:opacity-90
transition-all
cursor-pointer
"
    />
  </a>
)}

                           {/* FILE */}

{(msg.file ||
  msg.fileUrl) &&
  !msg.fileType?.startsWith(
    "image"
  ) && (
  <a
    href={
      msg.file ||
      msg.fileUrl
    }
    target="_blank"
    rel="noopener noreferrer"
    className="
flex
items-center
gap-3
mt-3
bg-zinc-800
hover:bg-zinc-700
transition-all
px-4
py-3
rounded-2xl
"
  >
    <span className="text-xl">
      📄
    </span>

    <div className="flex flex-col overflow-hidden">
      <span className="truncate max-w-[220px] text-sm font-medium">
        {msg.fileName ||
          "Download File"}
      </span>

      <span className="text-xs text-zinc-400">
        Click to open
      </span>
    </div>
  </a>
)}
                            {/* TEXT */}

                            {msg.message && (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mt-1">
                                {msg.message}
                              </p>
                            )}
                          </div>

                          {/* TIME */}

                          <div className="flex items-center justify-end gap-2 mt-3">
                            <p
                              className={`text-[11px] ${
                                isMine
                                  ? "text-zinc-500"
                                  : "text-zinc-400"
                              }`}
                            >
                              {new Date(
                                msg.createdAt
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )}
                            </p>

                            {isMine && (
                              <span
                                className={`text-[12px] ${
                                  msg.seen
                                    ? "text-blue-500"
                                    : "text-zinc-500"
                                }`}
                              >
                                {msg.seen
                                  ? "✓✓"
                                  : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}

              <div
                ref={messagesEndRef}
              />
            </div>
          )}
        </div>

        {/* INPUT */}

      

{receiverUsername && (
  <div className="border-t border-zinc-800 bg-[#0d0d0d] p-6">

    {selectedFile && (
      <div className="mb-4 text-sm text-zinc-400">
        📎 Selected: {selectedFile.name}
      </div>
    )}

    <div className="relative flex items-center gap-4">

      {/* EMOJI */}

      <button
        onClick={() =>
          setShowEmojiPicker(
            !showEmojiPicker
          )
        }
        className="
w-[60px]
h-[60px]
rounded-2xl
bg-zinc-900
border
border-zinc-800
text-2xl
hover:bg-zinc-800
transition-all
flex
items-center
justify-center
"
      >
        😊
      </button>

      {/* FILE */}

      <label
        className="
w-[60px]
h-[60px]
rounded-2xl
bg-zinc-900
border
border-zinc-800
flex
items-center
justify-center
cursor-pointer
hover:bg-zinc-800
transition-all
text-xl
"
      >
        📎

        <input
          type="file"
          hidden
          onChange={(e) => {
            if (
              e.target
                .files?.[0]
            ) {
              setSelectedFile(
                e.target
                  .files[0]
              );
            }
          }}
        />
      </label>

      {/* EMOJI PICKER */}

      {showEmojiPicker && (
        <div className="absolute bottom-[80px] left-0 z-50 shadow-2xl">
          <EmojiPicker
            onEmojiClick={
              handleEmojiClick
            }
            theme={
              Theme.DARK
            }
            width={350}
            height={450}
          />
        </div>
      )}

      {/* INPUT */}

      <input
        type="text"
        placeholder="Type message..."
        value={message}
        onChange={
          handleMessageChange
        }
        onKeyDown={(e) => {
          if (
            e.key ===
            "Enter"
          ) {
            handleSend();
          }
        }}
        className="
flex-1
h-[60px]
bg-zinc-900
border
border-zinc-800
rounded-2xl
px-6
text-white
placeholder:text-zinc-500
outline-none
focus:border-zinc-600
transition-all
"
      />

      {/* SEND */}

      <button
        onClick={
          handleSend
        }
        disabled={sending}
        className="
h-[60px]
px-8
rounded-2xl
bg-white
text-black
font-semibold
hover:scale-105
transition-all
disabled:opacity-50
"
      >
        {sending
          ? "Sending..."
          : "Send"}
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}