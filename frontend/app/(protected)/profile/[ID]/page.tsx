"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const params = useParams();
  

  const id = params?.ID as string;

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/users/${id}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        console.log("User fetched:", data);

        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [id]);

  if (!user) {
    return <div className="p-10">Loading profile...</div>;
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto border rounded-xl p-6">

        <h1 className="text-3xl font-bold">
          {user.firstName} {user.lastName}
        </h1>

        <p className="text-muted-foreground mt-2">
          Recruiter at {user.companyName}
        </p>

        <p className="mt-4">
          <strong>Email:</strong> {user.email}
        </p>

        <button className="mt-6 px-4 py-2 bg-black text-white rounded-lg">
          Ask for Referral
        </button>

      </div>
    </div>
  );
}