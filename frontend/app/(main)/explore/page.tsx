"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Tabs,
  TabsContent,
  TabsList,
 TabsTrigger,
} from "@/components/ui/tabs";

import {
  Search,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import ProfileCard from "@/components/cards/profile";
import CompanyCard from "@/components/cards/company";

/*
========================================
COMPANY DATA
========================================
*/

const COMPANIES_DATA = Array.from({
  length: 6,
}).map((_, i) => ({
  id: i + 1,

  name: `Company ${i + 1}`,

  industry: "Technology",

  description:
    "Leading technology company with a focus on innovation and user experience.",

  location: "San Francisco, CA",

  openPositions: (i + 1) * 5,

  employees: (i + 1) * 1000,
}));

export default function ExplorePage() {
  /*
========================================
STATE
========================================
*/

  const [searchQuery, setSearchQuery] =
    useState("");

  const [people, setPeople] =
    useState<any[]>([]);

  /*
========================================
REFERRAL STATES
========================================
*/

  const [selectedUser, setSelectedUser] =
    useState<any>(null);

  const [isReferralOpen, setIsReferralOpen] =
    useState(false);

  const [company, setCompany] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /*
========================================
FETCH USERS
========================================
*/

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users`
    )
      .then(async (res) => {
        const data = await res.json();

        console.log("USERS:", data);

        setPeople(data);
      })
      .catch((err) => {
        console.error(
          "FETCH ERROR:",
          err
        );
      });
  }, []);

  /*
========================================
SEND REFERRAL REQUEST
========================================
*/

  const handleReferralRequest =
    async () => {
      try {
        /*
========================================
GET LOGGED IN USER
========================================
*/

        const loggedInUser =
          localStorage.getItem(
            "user"
          );
          console.log(
            "LOGGED USER:",
            loggedInUser
          );

        if (!loggedInUser) {
          alert(
            "Please login first"
          );

          return;
        }

        const parsedUser =
          JSON.parse(
            loggedInUser
          );
          console.log(
            "PARSED USER:",
            parsedUser
          );

        const currentUserName = `${parsedUser.firstName} ${parsedUser.lastName}`;
        console.log(
          "LOGGED IN USER DATA:",
          parsedUser
        );

        /*
========================================
VALIDATION
========================================
*/

        if (
          !company ||
          !message
        ) {
          alert(
            "Please fill all fields"
          );

          return;
        }

        /*
========================================
PREVENT SELF REFERRAL
========================================
*/

        if (
          parsedUser.email ===
          selectedUser.email
        ) {
          alert(
            "You cannot send referral request to yourself"
          );

          return;
        }

        setLoading(true);

        console.log(
          "API URL:",
          process.env.NEXT_PUBLIC_API_URL
        );

        /*
========================================
API REQUEST
========================================
*/

        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/referrals`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  fromUser:
                    currentUserName,

                  fromEmail:
                  parsedUser.email

                  ?.trim()
              
                  .toLowerCase(),

                  toUser: `${selectedUser.firstName} ${selectedUser.lastName}`,

                  toEmail:
                    selectedUser.email,

                  company,

                  message,
                }
              ),
            }
          );

        console.log(
          "RESPONSE:",
          response
        );

        let data;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        console.log(
          "DATA:",
          data
        );

        /*
========================================
SUCCESS
========================================
*/

        if (response.ok) {
          alert(
            "Referral request sent successfully!"
          );

          setCompany("");

          setMessage("");

          setIsReferralOpen(
            false
          );
        } else {
          alert(
            data?.message ||
              "Failed to send referral request"
          );
        }
      } catch (error) {
        console.error(
          "FULL ERROR:",
          error
        );

        alert("Server error");
      } finally {
        setLoading(false);
      }
    };

  /*
========================================
FILTER USERS
========================================
*/

  const filteredPeople =
    people.filter((person) => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();

      const companyName =
        person.companyName?.toLowerCase() ||
        "";

      const position =
        person.position?.toLowerCase() ||
        "";

      const query =
        searchQuery.toLowerCase();

      return (
        fullName.includes(query) ||
        companyName.includes(query) ||
        position.includes(query)
      );
    });

  /*
========================================
UI
========================================
*/

  return (
    <div className="container py-10">
      {/* HEADER */}

      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Explore Network
        </h1>

        <p className="text-muted-foreground">
          Connect with professionals
          and find referral
          opportunities
        </p>
      </div>

      {/* SEARCH */}

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search by name, company, or position..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
          />
        </div>
      </div>

      {/* TABS */}

      <Tabs defaultValue="people">
        <TabsList className="mb-6">
          <TabsTrigger value="people">
            People
          </TabsTrigger>

          <TabsTrigger value="companies">
            Companies
          </TabsTrigger>
        </TabsList>

        {/* PEOPLE */}

        <TabsContent value="people">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map(
              (person) => (
                <div
                  key={person._id}
                  className="rounded-xl border p-4"
                >
                  <ProfileCard
                    id={person._id}
                    name={`${person.firstName} ${person.lastName}`}
                    position={
                      person.position ||
                      "Software Engineer"
                    }
                    company={
                      person.companyName ||
                      "Company"
                    }
                    location={
                      person.location ||
                      "India"
                    }
                    imageSrc="/placeholder.svg"
                  />

                  {/* EMAIL */}

                  <div className="mt-3">
                    <p className="mb-3 text-sm text-muted-foreground">
                      {person.email}
                    </p>

                    {/* BUTTON */}

                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedUser(
                          person
                        );

                        setIsReferralOpen(
                          true
                        );
                      }}
                    >
                      Ask for Referral
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* LOAD MORE */}

          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              Load More

              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* COMPANIES */}

        <TabsContent value="companies">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANIES_DATA.map(
              (company) => (
                <CompanyCard
                  key={company.id}
                  {...company}
                />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* REFERRAL MODAL */}

      {isReferralOpen &&
        selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl">
              <h2 className="mb-2 text-2xl font-bold">
                Request Referral
              </h2>

              <p className="mb-1 text-muted-foreground">
                Ask{" "}
                {
                  selectedUser.firstName
                }{" "}
                {
                  selectedUser.lastName
                }
              </p>

              <p className="mb-6 text-sm text-muted-foreground">
                {
                  selectedUser.email
                }
              </p>

              {/* FORM */}

              <div className="space-y-4">
                <Input
                  placeholder="Company Name"
                  value={company}
                  onChange={(e) =>
                    setCompany(
                      e.target.value
                    )
                  }
                />

                <textarea
                  className="w-full rounded-md border bg-background p-3"
                  rows={5}
                  placeholder="Why are you a good fit?"
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                />

                {/* BUTTONS */}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setIsReferralOpen(
                        false
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={
                      handleReferralRequest
                    }
                    disabled={
                      loading
                    }
                  >
                    {loading
                      ? "Sending..."
                      : "Send Request"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* JOB SECTION */}

      <div className="mt-10 rounded-lg border border-border bg-card p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">
          Looking for job
          opportunities?
        </h2>

        <p className="mb-6 text-muted-foreground">
          Explore open positions
          and find your next
          career move
        </p>

        <Button asChild>
          <Link
            href="/jobs"
            className="flex items-center gap-2"
          >
            View Jobs

            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}