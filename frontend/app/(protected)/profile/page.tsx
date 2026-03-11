"use client";

import Image from "next/image";
import Link from "next/link";
import { withAuth, useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  Edit,
  MapPin,
  Mail,
  Calendar,
  Users,
  Briefcase,
  Building,
} from "lucide-react";

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-3">

        {/* PROFILE SIDEBAR */}

        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">

              <div className="flex flex-col items-center">

                <div className="relative">
                  <Image
                    src="/placeholder.svg"
                    alt="Profile"
                    width={128}
                    height={128}
                    className="rounded-full"
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-background"
                    asChild
                  >
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <h1 className="mt-4 text-2xl font-bold">
{user ? `${user.firstName} ${user.lastName}` : "User"}
                </h1>

                <p className="text-muted-foreground">
                  {user?.role || "Member"}
                </p>

                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
<span>{user?.companyName || "Company not set"}</span>                </div>

                <Button className="mt-6 w-full" asChild>
                  <Link href="/profile/edit">Edit Profile</Link>
                </Button>

              </div>

              {/* USER INFO */}

              <div className="mt-6 space-y-4">

                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
{user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.createdAt
                        ? new Date(user.createdAt).toDateString()
                        : "Recently"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Network</p>
                    <p className="text-sm text-muted-foreground">
                      0 connections
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* PROFILE CONTENT */}

        <div className="md:col-span-2">

          <Tabs defaultValue="about">

            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>

            {/* ABOUT */}

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground">
                    Welcome to your profile page. You can customize this section
                    with your professional summary, interests, and career goals.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EXPERIENCE */}

            <TabsContent value="experience">

              <Card>
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground">
                    Add your work experience here.
                  </p>
                </CardContent>

              </Card>

            </TabsContent>

            {/* REFERRALS */}

            <TabsContent value="referrals">

              <Card>
                <CardHeader>
                  <CardTitle>Referral Activity</CardTitle>
                  <CardDescription>
                    Track your referral requests
                  </CardDescription>
                </CardHeader>

                <CardContent>

                  <div className="flex justify-center">
                    <Button asChild>
                      <Link href="/referral-request">
                        Request a Referral
                      </Link>
                    </Button>
                  </div>

                </CardContent>
              </Card>

            </TabsContent>

          </Tabs>

        </div>

      </div>
    </div>
  );
}

export default withAuth(ProfilePage);