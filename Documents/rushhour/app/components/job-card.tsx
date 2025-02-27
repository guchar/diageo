import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  description: string;
  postedDate: string;
  applyUrl?: string;
}

export function JobCard({
  title,
  company,
  location,
  description,
  postedDate,
  applyUrl,
}: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const markdownComponents: Components = {
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold mt-6 mb-2 text-gray-900">
        {children}
      </h2>
    ),
    p: ({ children }) => <p className="my-2 text-gray-700">{children}</p>,
    ul: ({ children }) => (
      <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
    ),
    li: ({ children }) => <li className="text-gray-700">{children}</li>,
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              {company} • {location} • Posted {postedDate}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-4">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {description}
            </ReactMarkdown>
          </div>

          {applyUrl && (
            <Button
              className="mt-6"
              onClick={(e) => {
                e.stopPropagation();
                window.open(applyUrl, "_blank");
              }}
            >
              Apply Now
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
