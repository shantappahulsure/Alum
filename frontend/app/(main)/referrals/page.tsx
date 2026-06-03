"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

/*
========================================
INTERFACE
========================================
*/

interface Referral {
  _id: string;

  fromUser: string;

  fromEmail: string;

  toUser: string;

  toEmail: string;

  company: string;

  message: string;

  status: "pending" | "accepted" | "rejected";

  createdAt: string;
}

export default function ReferralsPage() {
  /*
========================================
STATE
========================================
*/

  const [referrals, setReferrals] =
    useState<Referral[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    currentUserEmail,
    setCurrentUserEmail,
  ] = useState("");

  const [
    currentUser,
    setCurrentUser,
  ] = useState<any>(null);

  /*
========================================
GET LOGGED IN USER
========================================
*/

  useEffect(() => {
    const loggedInUser =
      localStorage.getItem("user");

    console.log(
      "LOCAL STORAGE USER:",
      loggedInUser
    );

    if (loggedInUser) {
      const parsedUser =
        JSON.parse(loggedInUser);

      console.log(
        "PARSED USER:",
        parsedUser
      );

      setCurrentUser(parsedUser);

      const email =
        parsedUser.email
          ?.trim()
          .toLowerCase() || "";

      console.log(
        "SETTING EMAIL:",
        email
      );

      setCurrentUserEmail(email);
    }
  }, []);

  /*
========================================
FETCH REFERRALS
========================================
*/

  const fetchReferrals =
    async () => {
      try {
        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/referrals`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        console.log(
          "FETCHED REFERRALS DATA:",
          data
        );

        setReferrals(data);
      } catch (error) {
        console.error(
          "FETCH REFERRALS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };
    /*
========================================
REALTIME REFRESH
========================================
*/

useEffect(() => {
  /*
  ========================================
  NEW REFERRAL
  ========================================
  */

  socket.on(
    "newReferral",
    () => {
      console.log(
        "REFRESHING REFERRALS"
      );

      fetchReferrals();
    }
  );

  /*
  ========================================
  STATUS UPDATED
  ========================================
  */

  socket.on(
    "referralStatusUpdated",
    () => {
      console.log(
        "REFRESHING STATUS"
      );

      fetchReferrals();
    }
  );

  /*
  ========================================
  CLEANUP
  ========================================
  */

  return () => {
    socket.off(
      "newReferral"
    );

    socket.off(
      "referralStatusUpdated"
    );
  };
}, []);

  /*
========================================
LOAD DATA
========================================
*/

  useEffect(() => {
    fetchReferrals();
  }, []);

  /*
========================================
UPDATE STATUS
========================================
*/

  const updateStatus =
    async (
      id: string,
      status:
        | "accepted"
        | "rejected"
    ) => {
      try {
        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/${id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  status,
                }
              ),
            }
          );

        if (response.ok) {
          fetchReferrals();
        }
      } catch (error) {
        console.error(
          "UPDATE STATUS ERROR:",
          error
        );
      }
    };

  /*
========================================
NORMALIZED EMAIL
========================================
*/

  const normalizedCurrentEmail =
    currentUserEmail
      ?.trim()
      .toLowerCase();

  /*
========================================
FILTERS
========================================
*/

  const incomingReferrals =
    referrals.filter((r) => {
      const toEmail =
        r.toEmail
          ?.trim()
          .toLowerCase();

      console.log(
        "INCOMING CHECK:",
        {
          toEmail,
          normalizedCurrentEmail,
        }
      );

      return (
        normalizedCurrentEmail &&
        toEmail ===
          normalizedCurrentEmail
      );
    });

  const sentReferrals =
    referrals.filter((r) => {
      const fromEmail =
        r.fromEmail
          ?.trim()
          .toLowerCase();

      console.log(
        "SENT CHECK:",
        {
          fromEmail,
          normalizedCurrentEmail,
        }
      );

      return (
        normalizedCurrentEmail &&
        fromEmail ===
          normalizedCurrentEmail
      );
    });

  const acceptedReferrals =
    referrals.filter((r) => {
      const fromEmail =
        r.fromEmail
          ?.trim()
          .toLowerCase();

      const toEmail =
        r.toEmail
          ?.trim()
          .toLowerCase();

      return (
        r.status ===
          "accepted" &&
        normalizedCurrentEmail &&
        (fromEmail ===
          normalizedCurrentEmail ||
          toEmail ===
            normalizedCurrentEmail)
      );
    });

  /*
========================================
DEBUG LOGS
========================================
*/

  console.log(
    "CURRENT USER EMAIL:",
    currentUserEmail
  );

  console.log(
    "NORMALIZED EMAIL:",
    normalizedCurrentEmail
  );

  console.log(
    "CURRENT USER OBJECT:",
    currentUser
  );

  console.log(
    "ALL REFERRALS:",
    referrals
  );

  console.log(
    "FINAL SENT:",
    sentReferrals
  );

  console.log(
    "FINAL INCOMING:",
    incomingReferrals
  );

  /*
========================================
UI
========================================
*/

  return (
    <div className="container py-10">
      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Referral Requests
        </h1>

        <p className="mt-2 text-muted-foreground">
          Manage incoming and sent
          referral requests
        </p>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="py-20 text-center">
          Loading referrals...
        </div>
      ) : (
        <Tabs defaultValue="incoming">
          {/* TABS */}

          <TabsList className="mb-8">
            <TabsTrigger value="incoming">
              Incoming
            </TabsTrigger>

            <TabsTrigger value="sent">
              Sent
            </TabsTrigger>

            <TabsTrigger value="accepted">
              Accepted
            </TabsTrigger>
          </TabsList>

          {/* ========================================
          INCOMING TAB
          ======================================== */}

          <TabsContent value="incoming">
            <div className="space-y-5">
              {incomingReferrals.map(
                (referral) => (
                  <ReferralCard
                    key={
                      referral._id
                    }
                    referral={
                      referral
                    }
                    updateStatus={
                      updateStatus
                    }
                    currentUserEmail={
                      currentUserEmail
                    }
                  />
                )
              )}

              {incomingReferrals.length ===
                0 && (
                <EmptyState text="No incoming referral requests" />
              )}
            </div>
          </TabsContent>

          {/* ========================================
          SENT TAB
          ======================================== */}

          <TabsContent value="sent">
            <div className="space-y-5">
              {sentReferrals.map(
                (referral) => (
                  <ReferralCard
                    key={
                      referral._id
                    }
                    referral={
                      referral
                    }
                    updateStatus={
                      updateStatus
                    }
                    currentUserEmail={
                      currentUserEmail
                    }
                  />
                )
              )}

              {sentReferrals.length ===
                0 && (
                <EmptyState text="No sent referral requests" />
              )}
            </div>
          </TabsContent>

          {/* ========================================
          ACCEPTED TAB
          ======================================== */}

          <TabsContent value="accepted">
            <div className="space-y-5">
              {acceptedReferrals.map(
                (referral) => (
                  <ReferralCard
                    key={
                      referral._id
                    }
                    referral={
                      referral
                    }
                    updateStatus={
                      updateStatus
                    }
                    currentUserEmail={
                      currentUserEmail
                    }
                  />
                )
              )}

              {acceptedReferrals.length ===
                0 && (
                <EmptyState text="No accepted referrals yet" />
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/*
========================================
REFERRAL CARD
========================================
*/

function ReferralCard({
  referral,
  updateStatus,
  currentUserEmail,
}: {
  referral: Referral;

  updateStatus: (
    id: string,
    status:
      | "accepted"
      | "rejected"
  ) => void;

  currentUserEmail: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      {/* TOP */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* INFO */}

        <div>
          <h2 className="text-xl font-semibold">
            {referral.company}
          </h2>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                From:
              </span>{" "}
              {referral.fromUser}
            </p>

            <p>
              <span className="font-medium text-foreground">
                To:
              </span>{" "}
              {referral.toUser}
            </p>

            <p>
              {referral.toEmail}
            </p>
          </div>
        </div>

        {/* STATUS */}

        <div>
          <span
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              referral.status ===
              "accepted"
                ? "bg-green-100 text-green-700"
                : referral.status ===
                  "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {referral.status}
          </span>
        </div>
      </div>

      {/* MESSAGE */}

      <div className="mt-5 rounded-xl bg-muted p-4">
        <p className="text-sm leading-relaxed">
          {referral.message}
        </p>
      </div>

      {/* DATE */}

      <div className="mt-4 text-xs text-muted-foreground">
        Sent on{" "}
        {new Date(
          referral.createdAt
        ).toLocaleDateString()}
      </div>

      {/* ACTION BUTTONS */}

      {referral.status ===
        "pending" &&
        referral.toEmail
          ?.trim()
          .toLowerCase() ===
          currentUserEmail
            ?.trim()
            .toLowerCase() &&
        referral.fromEmail
          ?.trim()
          .toLowerCase() !==
          currentUserEmail
            ?.trim()
            .toLowerCase() && (
          <div className="mt-5 flex gap-3">
            <Button
              className="flex-1"
              onClick={() =>
                updateStatus(
                  referral._id,
                  "accepted"
                )
              }
            >
              Accept
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                updateStatus(
                  referral._id,
                  "rejected"
                )
              }
            >
              Reject
            </Button>
          </div>
        )}
    </div>
  );
}

/*
========================================
EMPTY STATE
========================================
*/

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <p className="text-muted-foreground">
        {text}
      </p>
    </div>
  );
}