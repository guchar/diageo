"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface JobProfile {
  id: string;
  jobTitle: string;
  company: {
    id: string;
    name: string;
  };
  location: string | null;
  remote: boolean;
}

export default function EditJobProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/job-profiles?id=${params.id}`, {
          credentials: "include",
        });

        if (response.ok) {
          const profile = await response.json();
          setJobTitle(profile.jobTitle);
          setLocation(profile.location || "");
          setRemote(profile.remote);
        } else {
          const error = await response.json();
          setError(error.message || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [params.id, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`/api/job-profiles?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jobTitle,
          location,
          remote,
        }),
      });

      if (response.ok) {
        router.push("/jobs");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating the profile");
    }
  };

  if (loading) {
    return (
      <main className="p-8 pt-24 bg-white min-h-screen">
        <div className="max-w-2xl mx-auto">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 pt-24 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          Edit Job Search Profile
        </h1>

        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Software Engineer"
            />
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          {/* Remote Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remote"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remote" className="ml-2 text-sm text-gray-700">
              Include remote positions
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-4"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
