"use client";

import Link from "next/link";

import { Suspense } from "react";

import {
  SignupForm,
} from "@/components/forms/signup";

import { Icons } from "@/components/icons";

import { Button } from "@/components/ui/button";

function SignupContent() {
  return (
    <>
      {/* LOGO / TITLE */}

      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-white text-black flex items-center justify-center text-2xl font-bold shadow-lg">
          A
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Account
          </h1>

          <p className="text-sm text-muted-foreground max-w-sm">
            Join Alum and connect
            with alumni, referrals,
            and real-time messaging
          </p>
        </div>
      </div>

      {/* FORM */}

      <SignupForm />

      {/* LOGIN */}

      <div className="text-center text-sm text-muted-foreground">
        Already have an
        account?{" "}
        <Link
          href="/login"
          className="font-medium text-white hover:underline"
        >
          Log in
        </Link>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      {/* BACK BUTTON */}

      <div className="absolute left-5 top-5">
        <Button
          variant="ghost"
          onClick={() =>
            window.history.back()
          }
          className="text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <Icons.arrowLeft className="mr-2 h-4 w-4" />

          Back
        </Button>
      </div>

      {/* CARD */}

      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-8 space-y-8">
        <Suspense
          fallback={
            <div className="text-center text-zinc-400">
              Loading...
            </div>
          }
        >
          <SignupContent />
        </Suspense>
      </div>
    </div>
  );
}