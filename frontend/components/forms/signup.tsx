"use client";
import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  emailSchema,
  passwordSchema,
  companyNameSchema,
  userTypeEmailRefinement,
} from "@/lib/validations/auth-validations";
import toast from "react-hot-toast";
/*
========================================
SCHEMAS
========================================
*/


const userFormSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    username: z.string().min(3),
    email: emailSchema,
    password: passwordSchema,
    userType: z.literal("user"),
  })
  .superRefine((data, ctx) => {
    userTypeEmailRefinement(
      data,
      ctx
    );
  });
const recruiterFormSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    username: z.string().min(3),
    companyName:
      companyNameSchema,
    email: emailSchema,
    password: passwordSchema,
    userType:
      z.literal("recruiter"),
  })
  .superRefine((data, ctx) => {
    userTypeEmailRefinement(
      data,
      ctx
    );
  });
type UserFormValues =
  z.infer<
    typeof userFormSchema
  >;
type RecruiterFormValues =
  z.infer<
    typeof recruiterFormSchema
  >;
/*
========================================
COMPONENT
========================================
*/
export function SignupForm() {
  const router = useRouter();
  const searchParams =
    useSearchParams();
  const { register } =
    useAuth();
  /*
========================================
STATES
========================================
*/
  const [isLoading, setIsLoading] =
    useState(false);
  const [otpLoading, setOtpLoading] =
    useState(false);
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");
  const [
    confirmPasswordError,
    setConfirmPasswordError,
  ] = useState<
    string | null
  >(null);
  const [
    selectedUserType,
    setSelectedUserType,
  ] = useState<
    "user" | "recruiter"
  >("user");
  const [otp, setOtp] =
    useState("");
  const [otpSent, setOtpSent] =
    useState(false);
  const [
    otpVerified,
    setOtpVerified,
  ] = useState(false);
  const [
    verifiedEmail,
    setVerifiedEmail,
  ] = useState("");
  /*
========================================
FORMS
========================================
*/
  const userForm =
    useForm<UserFormValues>({
      resolver:
        zodResolver(
          userFormSchema
        ),
      defaultValues: {
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        userType: "user",
      },
    });
  const recruiterForm =
    useForm<RecruiterFormValues>({
      resolver:
        zodResolver(
          recruiterFormSchema
        ),
      defaultValues: {
        firstName: "",
        lastName: "",
        username: "",
        companyName: "",
        email: "",
        password: "",
        userType:
          "recruiter",
      },
    });
  /*
========================================
SWITCH TYPE
========================================
*/
  const switchUserType = (
    type:
      | "user"
      | "recruiter"
  ) => {
    setSelectedUserType(type);
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    
    setConfirmPassword("");
    setConfirmPasswordError(
      null
    );
  };
  /*
========================================
SEND OTP
========================================
*/
  const sendOTP = async (
    email: string
  ) => {
    try {
      setOtpLoading(true);
      const response =
        await fetch(
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
        toast.error(
          data.message
        );
        return;
      }
      toast.success(
        "OTP sent successfully"
      );
      setOtpSent(true);
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to send OTP"
      );
    } finally {
      setOtpLoading(false);
    }
  };
  /*
========================================
VERIFY OTP
========================================
*/
  const verifyOTP = async (
    email: string
  ) => {
    try {
      setOtpLoading(true);
      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              otp,
            }),
          }
        );
      const data =
        await response.json();
      if (!response.ok) {
        toast.error(
          data.message
        );
        return;
      }
      toast.success(
        "OTP verified"
      );
      setOtpVerified(true);
      setVerifiedEmail(email);
    } catch (error) {
      console.error(error);
      toast.error(
        "OTP verification failed"
      );
    } finally {
      setOtpLoading(false);
    }
  };
  /*
========================================
SUBMIT
========================================
*/
  const handleSubmit =
    async (
      values:
        | UserFormValues
        | RecruiterFormValues
    ) => {
      if (
        confirmPassword !==
        values.password
      ) {
        setConfirmPasswordError(
          "Passwords do not match"
        );
        return;
      }
      if (!otpVerified) {
        toast.error(
          "Please verify OTP first"
        );
      
        return;
      }
      
      if (
        verifiedEmail !==
        values.email
      ) {
        toast.error(
          "Please verify the current email"
        );
      
        return;
      }
      try {
        setIsLoading(true);
        const userData = {
          username:
            values.username,
          email: values.email,
          password:
            values.password,
          firstName:
            values.firstName,
          lastName:
            values.lastName,
          role:
            values.userType,
          companyName:
            values.userType ===
            "recruiter"
              ? (
                  values as RecruiterFormValues
                ).companyName
              : undefined,
        };
        await register(userData);
        toast.success(
          "Account created successfully"
        );
        const from =
          searchParams.get(
            "from"
          ) || "/profile";
        router.push(
          decodeURIComponent(
            from
          )
        );
      } catch (err: any) {
        toast.error(
          err.message
        );
      } finally {
        setIsLoading(false);
      }
    };
  /*
========================================
RENDER FORM
========================================
*/
  const currentForm:any =
    selectedUserType ===
    "user"
      ? userForm
      : recruiterForm;
  return (
    <div className="grid gap-6">
      {/* TYPE SELECTOR */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "cursor-pointer border-zinc-800 bg-zinc-950 hover:border-white transition",
            selectedUserType ===
              "user" &&
              "border-white"
          )}
          onClick={() =>
            switchUserType(
              "user"
            )
          }
        >
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold">
              User
            </h3>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer border-zinc-800 bg-zinc-950 hover:border-white transition",
            selectedUserType ===
              "recruiter" &&
              "border-white"
          )}
          onClick={() =>
            switchUserType(
              "recruiter"
            )
          }
        >
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold">
              Recruiter
            </h3>
          </CardContent>
        </Card>
      </div>
      {/* FORM */}
      <Form {...currentForm}>
        <form
          onSubmit={currentForm.handleSubmit(
            handleSubmit
          )}
          className="space-y-4"
        >
          <Input
            placeholder="First Name"
            {...currentForm.register(
              "firstName"
            )}
          />
          <Input
            placeholder="Last Name"
            {...currentForm.register(
              "lastName"
            )}
          />
          <Input
            placeholder="Username"
            {...currentForm.register(
              "username"
            )}
          />
          {selectedUserType ===
            "recruiter" && (
            <Input
              placeholder="Company Name"
              {...recruiterForm.register(
                "companyName"
              )}
            />
          )}
          <Input
  placeholder="Email"
  {...currentForm.register(
    "email"
  )}
  onChange={(e) => {
    currentForm.setValue(
      "email",
      e.target.value
    );

    setOtpVerified(false);

    setOtpSent(false);

    setVerifiedEmail("");
  }}
/>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={otpLoading}
            onClick={() =>
              sendOTP(
                currentForm.watch(
                  "email"
                )
              )
            }
          >
            {otpLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send OTP
          </Button>
          {otpSent &&
            !otpVerified && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                    )
                  }
                />
                <Button
                  type="button"
                  onClick={() =>
                    verifyOTP(
                      currentForm.watch(
                        "email"
                      )
                    )
                  }
                >
                  Verify
                </Button>
              </div>
            )}
          {otpVerified && (
            <p className="text-sm text-green-500">
              Email verified
            </p>
          )}
          <Input
            type="password"
            placeholder="Password"
            {...currentForm.register(
              "password"
            )}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={
              confirmPassword
            }
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />
          {confirmPasswordError && (
            <p className="text-sm text-red-500">
              {
                confirmPasswordError
              }
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {selectedUserType ===
            "user"
              ? "Create Account"
              : "Create Recruiter Account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}