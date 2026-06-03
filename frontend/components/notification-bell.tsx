"use client";

import {
  Bell,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getNotifications,
  markAsRead,
} from "@/lib/notifications";

import { Notification } from "@/lib/types";

import { useAuth } from "@/contexts/AuthContext";

import { socket } from "@/lib/socket";

interface NotificationBellProps {

  className?: string;

}
export default function NotificationBell({
  className,
}: NotificationBellProps) {
  const { user } =
    useAuth();

  const [
    notifications,
    setNotifications,
  ] = useState<
    Notification[]
  >([]);

  const [
    open,
    setOpen,
  ] = useState(false);

  /*
  ========================================
  FETCH NOTIFICATIONS
  ========================================
  */

  const fetchNotifications =
    async () => {
      if (!user?.email)
        return;

      try {
        const data =
          await getNotifications(
            user.email
          );

        setNotifications(
          data
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  /*
  ========================================
  INITIAL FETCH
  ========================================
  */

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  /*
  ========================================
  REALTIME UPDATE
  ========================================
  */

  useEffect(() => {
    socket.on(
      "newReferral",
      () => {
        fetchNotifications();
      }
    );

    return () => {
      socket.off(
        "newReferral"
      );
    };
  }, []);

  /*
  ========================================
  UNREAD COUNT
  ========================================
  */

  const unreadCount =
    notifications.filter(
      (n) => !n.read
    ).length;

  /*
  ========================================
  MARK READ
  ========================================
  */

  const handleRead =
    async (
      id: string
    ) => {
      await markAsRead(id);

      fetchNotifications();
    };

  return (
    <div className="relative">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="relative"
      >
        <Bell className="h-6 w-6" />

        {unreadCount >
          0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {
              unreadCount
            }
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 bg-black border border-zinc-800 rounded-xl shadow-xl z-50 max-h-[500px] overflow-y-auto">
          <div className="p-4 border-b border-zinc-800 font-semibold">
            Notifications
          </div>

          {notifications.length ===
          0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map(
              (
                notification
              ) => (
                <div
                  key={
                    notification._id
                  }
                  onClick={() =>
                    handleRead(
                      notification._id
                    )
                  }
                  className={`p-4 border-b border-zinc-900 cursor-pointer hover:bg-zinc-900 transition ${
                    !notification.read
                      ? "bg-zinc-950"
                      : ""
                  }`}
                >
                  <p className="text-sm">
                    {
                      notification.message
                    }
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}