"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { JobCard } from "@/app/components/job-card";

interface JobProfile {
  id: string;
  jobTitle: string;
  company: {
    id: string;
    name: string;
  };
  location: string | null;
  remote: boolean;
  jobMatches: Array<{
    id: string;
    title: string;
    location: string;
    description: string;
    postedDate: string;
  }>;
}

interface JobMatch {
  title: string;
  company: string;
  location: string;
  description: string;
  postedDate: string;
  applyUrl?: string;
}

export default function JobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      console.log("Fetching job profiles...");
      const response = await fetch("/api/job-profiles", {
        credentials: "include",
      });
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Fetched profiles:", data);

      if (response.ok) {
        setJobProfiles(data);
      } else {
        setError(data.error || "Failed to fetch job profiles");
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setError("Failed to load job profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchProfiles();
    }
  }, [status, router]);

  useEffect(() => {
    const savedMatches = localStorage.getItem("jobMatches");
    if (savedMatches) {
      setJobMatches(JSON.parse(savedMatches));
    }
  }, []);

  const handleDelete = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    try {
      const response = await fetch(`/api/job-profiles?id=${profileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Refresh the profiles list
        fetchProfiles();
      } else {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete profile");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      setDeleteError("Failed to delete profile");
    }
  };

  const handleTestScraping = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/job-matches");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job matches");
      }

      // Format the job matches
      const formattedMatches = data.matches.map((match: any) => ({
        title: match.title,
        company: "Google",
        location: match.location || "Various Locations",
        description: match.description,
        postedDate: new Date().toLocaleDateString(),
        applyUrl: match.link,
      }));

      setJobMatches(formattedMatches);
      // Save to localStorage
      localStorage.setItem("jobMatches", JSON.stringify(formattedMatches));

      toast({
        title: "Success",
        description: "Successfully fetched job matches",
      });
    } catch (error) {
      console.error("Error fetching job matches:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch job matches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="p-8 pt-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <p>Loading job profiles...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8 pt-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 pt-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        {deleteError && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
            {deleteError}
          </div>
        )}

        {/* Job Search Profiles Section */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-blue-600">
              Job Search Profiles
            </h2>
            <Link
              href="/jobs/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Search Profile
            </Link>
          </div>

          {jobProfiles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No job profiles yet.</p>
              <p className="text-gray-500 mt-2">
                Create a profile to start tracking job opportunities.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {profile.jobTitle}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/jobs/edit/${profile.id}`}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {profile.company.name}
                      </div>
                      {profile.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-2" />
                          {profile.location}
                        </div>
                      )}
                      {profile.remote && (
                        <div className="inline-flex px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Remote
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Job Matches Section */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-blue-600">Job Matches</h2>
            <Button onClick={handleTestScraping} disabled={isLoading}>
              {isLoading ? "Searching..." : "Test Scraping"}
            </Button>
          </div>

          {jobMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No job matches found. Click "Test Scraping" to search for jobs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobMatches.map((match, index) => (
                <JobCard key={index} {...match} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
