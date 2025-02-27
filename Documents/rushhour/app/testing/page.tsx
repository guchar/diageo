import React from "react";

interface Job {
  title: string;
  location: string;
  link: string;
}

// Sample job data for Google (Software Engineer)
const googleJobs: Job[] = [
  {
    title: "Software Engineer I",
    location: "Mountain View, CA",
    link: "https://careers.google.com/job1",
  },
  {
    title: "Software Engineer II",
    location: "New York, NY",
    link: "https://careers.google.com/job2",
  },
];

// Sample job data for Microsoft (Product Manager)
const microsoftJobs: Job[] = [
  {
    title: "Product Manager",
    location: "Redmond, WA",
    link: "https://careers.microsoft.com/job1",
  },
  {
    title: "Senior Product Manager",
    location: "Seattle, WA",
    link: "https://careers.microsoft.com/job2",
  },
];

const TestingPage: React.FC = () => {
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">AI Agent Test Page</h1>
        <p className="text-gray-600">
          This page tests our AI Agent functionality. It takes a company and a
          job title, scrapes the career site, and displays job listings.
        </p>
      </header>
      <main className="max-w-4xl mx-auto space-y-10">
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
      </main>
    </div>
  );
};

export default TestingPage;
