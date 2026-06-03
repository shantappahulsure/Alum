"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  /*
========================================
SEND OTP
========================================
*/

  const sendOTP = async () => {
    try {
      setLoading(true);

      const response = await fetch(
       `${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(data.message);

        return;
      }

      alert("OTP sent successfully");
    } catch (error) {
      console.log(error);

      alert("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  /*
========================================
RESET PASSWORD
========================================
*/

  const resetPassword =
    async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              otp,
              newPassword,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          alert(data.message);

          return;
        }

        alert(
          "Password reset successful"
        );

        router.push("/login");
      } catch (error) {
        console.log(error);

        alert(
          "Reset password failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
        <h1 className="text-3xl font-bold text-center">
          Forgot Password
        </h1>

        <p className="text-center text-zinc-400">
          Reset password using OTP
        </p>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-3"
        />

        <button
          onClick={sendOTP}
          disabled={loading}
          className="w-full rounded bg-white p-3 font-semibold text-black hover:bg-zinc-200"
        >
          Send OTP
        </button>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value)
          }
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-3"
        />

        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(
              e.target.value
            )
          }
          className="w-full rounded border border-zinc-700 bg-zinc-900 p-3"
        />

        <button
          onClick={resetPassword}
          disabled={loading}
          className="w-full rounded bg-white p-3 font-semibold text-black hover:bg-zinc-200"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}