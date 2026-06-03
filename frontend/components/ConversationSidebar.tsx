"use client";

interface Props {
  conversations: any[];

  selectedUser: string;

  onlineUsers: string[];

  unreadCounts: {
    [key: string]: number;
  };

  setSelectedUser: (
    username: string
  ) => void;
}

export default function ConversationSidebar({
  conversations,
  selectedUser,
  onlineUsers,
  unreadCounts,
  setSelectedUser,
}: Props) {
  return (
    <div className="w-[340px] bg-[#0d0d0d] border-r border-zinc-800 flex flex-col">
      {/* HEADER */}

      <div className="p-6 border-b border-zinc-800 bg-[#111111]">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Messages
        </h1>

        <p className="text-sm text-zinc-400 mt-1">
          Realtime conversations
        </p>
      </div>

      {/* CONVERSATIONS */}

      <div className="flex-1 overflow-y-auto">
        {conversations.map(
          (chat) => {
            const username =
              chat.username;

            const isOnline =
              onlineUsers.includes(
                username
              );

            return (
              <button
                key={
                  username
                }
                onClick={() =>
                  setSelectedUser(
                    username
                  )
                }
                className={`w-full text-left px-5 py-4 transition-all duration-200 border-b border-zinc-900/60 ${
                  selectedUser ===
                  username
                    ? "bg-zinc-800/80"
                    : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* LEFT SIDE */}

                  <div className="flex items-center gap-4 min-w-0">
                    {/* AVATAR */}

                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                        {username
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase()}
                      </div>

                      {/* ONLINE STATUS */}

                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0d0d] ${
                          isOnline
                            ? "bg-green-500"
                            : "bg-zinc-600"
                        }`}
                      />
                    </div>

                    {/* USER INFO */}

                    <div className="min-w-0">
                      {/* USERNAME */}

                      <p className="font-semibold text-white text-[15px] truncate">
                        {username}
                      </p>

                      {/* LAST MESSAGE + TIME */}

                      <div className="flex items-center gap-2 mt-1">
                        <p
                          className={`text-xs truncate max-w-[160px] ${
                            chat.unreadCount >
                            0
                              ? "text-white font-semibold"
                              : "text-zinc-500"
                          }`}
                        >
                          {
                            chat.lastMessage
                          }
                        </p>

                        <p className="text-[10px] text-zinc-600 whitespace-nowrap">
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
                      </div>

                      {/* ONLINE STATUS TEXT */}

                      <p
                        className={`text-[11px] mt-1 ${
                          isOnline
                            ? "text-green-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {isOnline
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>

                  {/* UNREAD BADGE */}

                  {chat.unreadCount >
                    0 && (
                    <div className="min-w-[22px] h-[22px] rounded-full bg-green-500 text-black text-xs font-bold flex items-center justify-center px-2">
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
  );
}