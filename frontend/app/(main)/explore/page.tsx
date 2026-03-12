"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowRight, ChevronDown, X } from "lucide-react";
import ProfileCard from "@/components/cards/profile";
import CompanyCard from "@/components/cards/company";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const COMPANIES_DATA = Array.from({ length: 6 }).map((_, i) => ({
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [connectionFilter, setConnectionFilter] = useState<string[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`);

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        setPeople(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL]);

  return (
    <div className="container py-10">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Explore Network</h1>
        <p className="text-muted-foreground">
          Connect with professionals and find referral opportunities
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, or position..."
            className="pl-10 pr-4 py-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="min-w-[160px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="tech">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>

            <SheetContent className="w-full max-w-sm sm:max-w-md">
              <SheetHeader className="mb-6">
                <SheetTitle>Filter Results</SheetTitle>
                <SheetDescription>
                  Narrow down your search with specific criteria
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Location</h3>
                  <Separator />
                  {["San Francisco", "New York", "London", "Remote"].map(
                    (location) => (
                      <div key={location} className="flex items-center gap-2">
                        <Checkbox
                          checked={locationFilter.includes(location)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setLocationFilter([...locationFilter, location]);
                            } else {
                              setLocationFilter(
                                locationFilter.filter((l) => l !== location)
                              );
                            }
                          }}
                        />
                        <Label>{location}</Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <SheetFooter className="mt-8 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLocationFilter([]);
                    setExperienceFilter([]);
                    setConnectionFilter([]);
                  }}
                  className="flex-1"
                >
                  Reset
                </Button>

                <Button
                  className="flex-1"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs defaultValue="people" className="mb-10">
        <TabsList className="mb-6">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        <TabsContent value="people">
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <ProfileCard
                  key={person._id}
                  id={person._id}
                  name={`${person.firstName} ${person.lastName}`}
                  position={person.position || "Software Engineer"}
                  company={person.companyName || "Company"}
                  location={person.location || "India"}
                  imageSrc="/placeholder.svg"
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button variant="outline" className="flex items-center gap-2">
              Load More
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANIES_DATA.map((company) => (
              <CompanyCard key={company.id} {...company} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10 rounded-lg border p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">
          Looking for job opportunities?
        </h2>
        <p className="mb-6 text-muted-foreground">
          Explore open positions and find your next career move
        </p>

        <Button asChild>
          <Link href="/jobs" className="flex items-center gap-2">
            View Jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}