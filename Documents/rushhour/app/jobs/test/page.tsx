"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface JobProfile {
  id: string;
  jobTitle: string;
  company: {
    id: string;
    name: string;
    careerPageUrl: string;
  };
  location: string | null;
  remote: boolean;
}

interface JobMatch {
  id: string;
  title: string;
  location: string;
  description: string;
  type: string;
  applyLink: string;
  postedDate: string;
}

interface Job {
  title: string;
  location: string;
  link: string;
}

interface AIJobResult {
  jobs: Array<{
    title: string;
    location: string;
    description: string;
    applyLink: string;
    postedDate?: string;
  }>;
  timeTaken: number;
}

interface Company {
  name: string;
  careerUrl: string;
}

// Updated Google jobs links with URL-encoded query parameters
const googleJobs: Job[] = [
  {
    title: "Software Engineer – Backend",
    location: "Mountain View, CA",
    link: "https://careers.google.com/jobs/results/?q=software%20engineer%20backend",
  },
  {
    title: "Software Engineer – Frontend",
    location: "San Francisco, CA",
    link: "https://careers.google.com/jobs/results/?q=software%20engineer%20frontend",
  },
  {
    title: "Software Engineer – Fullstack",
    location: "New York, NY",
    link: "https://careers.google.com/jobs/results/?q=software%20engineer%20fullstack",
  },
  {
    title: "Software Engineer – Infrastructure",
    location: "Los Angeles, CA",
    link: "https://careers.google.com/jobs/results/?q=software%20engineer%20infrastructure",
  },
  {
    title: "Software Engineer – Mobile",
    location: "Seattle, WA",
    link: "https://careers.google.com/jobs/results/?q=software%20engineer%20mobile",
  },
];

// Updated Microsoft jobs links with URL-encoded query parameters
const microsoftJobs: Job[] = [
  {
    title: "Product Manager – Cloud Solutions",
    location: "Redmond, WA",
    link: "https://careers.microsoft.com/v2/global/en/search-results?keywords=Product%20Manager%20Cloud%20Solutions",
  },
  {
    title: "Product Manager – AI & Research",
    location: "Boston, MA",
    link: "https://careers.microsoft.com/v2/global/en/search-results?keywords=Product%20Manager%20AI%20Research",
  },
  {
    title: "Senior Product Manager – Device and Ecosystems",
    location: "Seattle, WA",
    link: "https://careers.microsoft.com/v2/global/en/search-results?keywords=Senior%20Product%20Manager%20Device%20Ecosystems",
  },
  {
    title: "Product Manager – Surface",
    location: "Redmond, WA",
    link: "https://careers.microsoft.com/v2/global/en/search-results?keywords=Product%20Manager%20Surface",
  },
  {
    title: "Product Manager – Gaming",
    location: "Austin, TX",
    link: "https://careers.microsoft.com/v2/global/en/search-results?keywords=Product%20Manager%20Gaming",
  },
];

// Predefined company options
const companyOptions: Company[] = [
  {
    name: "Google",
    careerUrl:
      "https://www.google.com/about/careers/applications/jobs/results/",
  },
  {
    name: "Microsoft",
    careerUrl: "https://careers.microsoft.com/v2/global/en/search-results",
  },
  {
    name: "Amazon",
    careerUrl: "https://www.amazon.jobs/en/search",
  },
  {
    name: "Apple",
    careerUrl: "https://jobs.apple.com/en-us/search",
  },
  {
    name: "Meta",
    careerUrl: "https://www.metacareers.com/jobs",
  },
];

export default function PostingsTestPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [jobMatches, setJobMatches] = useState<Record<string, JobMatch[]>>({});
  const [aiResults, setAiResults] = useState<AIJobResult[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("google");
  const [customCompanyName, setCustomCompanyName] = useState<string>("");
  const [customCompanyUrl, setCustomCompanyUrl] = useState<string>("");
  const [useCustomCompany, setUseCustomCompany] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AIJobResult | null>(null);
  const [companyUrl, setCompanyUrl] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<string>("");

  // Fetch job profiles
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/job-profiles")
        .then((res) => res.json())
        .then((data) => setProfiles(data))
        .catch((err) => setError("Failed to fetch profiles"));
    }
  }, [status]);

  // Function to test the AI agent
  const testAIAgent = async () => {
    setError(null);
    setResults(null);
    setLoading(true);
    setLoadingProgress(0);
    setLoadingStage("Initializing job search agent...");

    try {
      // Start loading progress simulation
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            return prev; // Cap at 90% until complete
          }

          // Update loading stage messages based on progress
          const newProgress = prev + Math.random() * 10;
          if (newProgress > 20 && newProgress <= 40) {
            setLoadingStage("Navigating to career page...");
          } else if (newProgress > 40 && newProgress <= 60) {
            setLoadingStage("Searching for jobs...");
          } else if (newProgress > 60 && newProgress <= 80) {
            setLoadingStage("Analyzing job listings...");
          } else if (newProgress > 80) {
            setLoadingStage("Extracting job details...");
          }

          return newProgress;
        });
      }, 800);

      // Prepare API request
      const url =
        selectedCompany === "custom"
          ? companyUrl
          : companyOptions.find((c) => c.name === selectedCompany)?.careerUrl ||
            "";

      const response = await fetch("/api/job-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: searchTerm,
          companyUrl: url,
        }),
      });

      // Clear the progress interval
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      setLoadingProgress(100); // Complete the progress
      setLoadingStage("Job search completed!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      // Give a moment to see the completed progress before removing loader
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div
            className="h-1 bg-blue-600 animate-pulse"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
      )}
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold">AI Agent Test Page</h1>
          <p className="text-gray-600">
            Test our AI agent for job search functionality
          </p>
        </header>
        <main className="max-w-4xl mx-auto space-y-10">
          {/* AI Agent Test Section */}
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold border-b pb-2">
              Test AI Job Search Agent
            </h2>
            <div className="mt-4 space-y-4">
              {/* Job Title Input */}
              <div className="flex flex-col">
                <label
                  htmlFor="searchTerm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Job Title
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Software Engineer"
                />
              </div>

              {/* Company Selection Toggle */}
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="useCustomCompany"
                  checked={useCustomCompany}
                  onChange={(e) => setUseCustomCompany(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="useCustomCompany"
                  className="text-sm font-medium text-gray-700"
                >
                  Use custom company (instead of predefined options)
                </label>
              </div>

              {/* Predefined Company Selection */}
              {!useCustomCompany && (
                <div className="flex flex-col">
                  <label
                    htmlFor="companySelect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Select Company
                  </label>
                  <select
                    id="companySelect"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {companyOptions.map((company) => (
                      <option key={company.name} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                    <option value="custom">Custom URL</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Career URL:{" "}
                    {
                      companyOptions.find((c) => c.name === selectedCompany)
                        ?.careerUrl
                    }
                  </p>
                </div>
              )}

              {/* Custom Company Input */}
              {useCustomCompany && (
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <label
                      htmlFor="customCompanyName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="customCompanyName"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Netflix"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="customCompanyUrl"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Company Career URL
                    </label>
                    <input
                      type="text"
                      id="customCompanyUrl"
                      value={customCompanyUrl}
                      onChange={(e) => setCustomCompanyUrl(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. https://jobs.netflix.com/"
                    />
                  </div>
                </div>
              )}

              {/* Search Button */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={testAIAgent}
                  disabled={
                    loading ||
                    !searchTerm ||
                    (selectedCompany === "custom" && !customCompanyUrl)
                  }
                  className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-8 rounded-md ${
                    loading ||
                    !searchTerm ||
                    (selectedCompany === "custom" && !customCompanyUrl)
                      ? "cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading ? "Searching..." : "Search Jobs"}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p>{error}</p>
                </div>
              )}

              {/* Results Section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Results from AI Agent
                </h3>
                {loading ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-gray-600">
                      Our AI agent is searching for jobs using human-like
                      behavior...
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      This may take a minute or two
                    </p>
                  </div>
                ) : results ? (
                  <div className="space-y-4">
                    {results.jobs.map((job, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold text-lg text-blue-600">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 mb-1">{job.location}</p>
                        <p className="text-gray-700 mb-2 text-sm">
                          {job.description?.substring(0, 150)}
                          {job.description && job.description.length > 150
                            ? "..."
                            : ""}
                        </p>
                        <a
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Apply Now →
                        </a>
                      </div>
                    ))}
                  </div>
                ) : !loading && !error ? (
                  <p className="text-gray-500 py-4">
                    Click "Search Jobs" to test the AI agent
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {/* Google Section */}
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold border-b pb-2">
              Google — Software Engineer
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Career Page:{" "}
              <a
                href="https://www.google.com/about/careers/applications/jobs/results/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                https://www.google.com/about/careers/applications/jobs/results/
              </a>
            </p>
            <div className="grid grid-cols-1 gap-4">
              {googleJobs.map((job, index) => (
                <div key={index} className="p-4 border rounded hover:shadow">
                  <h3 className="text-xl font-medium">{job.title}</h3>
                  <p className="text-gray-600">{job.location}</p>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-500 hover:underline"
                  >
                    View Job
                  </a>
                </div>
              ))}
            </div>
          </section>
          {/* Microsoft Section */}
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold border-b pb-2">
              Microsoft — Product Manager
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Career Page:{" "}
              <a
                href="https://careers.microsoft.com/v2/global/en/home.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                https://careers.microsoft.com/v2/global/en/home.html
              </a>
            </p>
            <div className="grid grid-cols-1 gap-4">
              {microsoftJobs.map((job, index) => (
                <div key={index} className="p-4 border rounded hover:shadow">
                  <h3 className="text-xl font-medium">{job.title}</h3>
                  <p className="text-gray-600">{job.location}</p>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-500 hover:underline"
                  >
                    View Job
                  </a>
                </div>
              ))}
            </div>
          </section>

          {loading && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {loadingStage}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </main>
      </main>
    </div>
  );
}
