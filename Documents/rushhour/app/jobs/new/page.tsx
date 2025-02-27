"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

// Common job titles for suggestions
const commonJobTitles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Product Designer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Machine Learning Engineer",
];

// Common companies for suggestions
const commonCompanies = [
  "Google",
  "Microsoft",
  "Apple",
  "Amazon",
  "Meta",
  "Netflix",
  "Uber",
  "Airbnb",
  "Twitter",
  "LinkedIn",
];

// Common job board platforms
const commonJobBoards = {
  greenhouse: (companyId: string) =>
    `https://boards.greenhouse.io/${companyId}/jobs/search`,
  lever: (companyId: string) => `https://jobs.lever.co/${companyId}`,
  workday: (url: string) => url,
};

export default function CreateJobProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [careerPageUrl, setCareerPageUrl] = useState("");
  const [jobBoardPlatform, setJobBoardPlatform] = useState<
    keyof typeof commonJobBoards | "custom"
  >("custom");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [error, setError] = useState("");

  console.log("Session status:", status);
  console.log("Session data:", session);

  // Update career page URL when company or platform changes
  const updateCareerPageUrl = (
    newCompany: string,
    platform: keyof typeof commonJobBoards | "custom"
  ) => {
    if (platform === "custom") {
      setCareerPageUrl("");
      return;
    }

    const companyId = newCompany.toLowerCase().replace(/\s+/g, "-");
    setCareerPageUrl(commonJobBoards[platform](companyId));
  };

  const handleCompanyChange = (newCompany: string) => {
    setCompany(newCompany);
    updateCareerPageUrl(newCompany, jobBoardPlatform);
  };

  const handleJobBoardChange = (
    platform: keyof typeof commonJobBoards | "custom"
  ) => {
    setJobBoardPlatform(platform);
    updateCareerPageUrl(company, platform);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!careerPageUrl) {
      setError("Career page URL is required");
      return;
    }

    if (status !== "authenticated") {
      console.error("Not authenticated");
      router.push("/login");
      return;
    }

    console.log("Starting job profile creation...");
    console.log("Form data:", {
      jobTitle,
      company,
      careerPageUrl,
      location,
      remote,
    });
    console.log("Session:", session);

    try {
      console.log("Sending POST request to /api/job-profiles");
      const response = await fetch("/api/job-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jobTitle,
          company,
          careerPageUrl,
          location,
          remote,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        console.log("Profile created successfully, redirecting to /jobs");
        router.push("/jobs");
      } else {
        console.error("Failed to create job profile:", data.error);
        setError(data.error || "Failed to create job profile");
      }
    } catch (error) {
      console.error("Error creating job profile:", error);
      setError("An error occurred while creating the profile");
    }
  };

  return (
    <main className="p-8 pt-24 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          Create Job Search Profile
        </h1>

        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onFocus={() => setShowJobSuggestions(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Software Engineer"
              required
            />
            {showJobSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {commonJobTitles
                  .filter((title) =>
                    title.toLowerCase().includes(jobTitle.toLowerCase())
                  )
                  .map((title) => (
                    <div
                      key={title}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setJobTitle(title);
                        setShowJobSuggestions(false);
                      }}
                    >
                      {title}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Company Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => handleCompanyChange(e.target.value)}
              onFocus={() => setShowCompanySuggestions(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Google"
              required
            />
            {showCompanySuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {commonCompanies
                  .filter((c) =>
                    c.toLowerCase().includes(company.toLowerCase())
                  )
                  .map((c) => (
                    <div
                      key={c}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setCompany(c);
                        setShowCompanySuggestions(false);
                      }}
                    >
                      {c}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Job Board Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Board Platform
            </label>
            <select
              value={jobBoardPlatform}
              onChange={(e) =>
                handleJobBoardChange(
                  e.target.value as keyof typeof commonJobBoards | "custom"
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="custom">Custom URL</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
              <option value="workday">Workday</option>
            </select>
          </div>

          {/* Career Page URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Career Page URL
            </label>
            <input
              type="url"
              value={careerPageUrl}
              onChange={(e) => setCareerPageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://company.com/careers"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the URL of the company's job listings page
            </p>
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
              Create Profile
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
