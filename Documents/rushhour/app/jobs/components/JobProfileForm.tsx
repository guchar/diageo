import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company, JobProfile } from "@/lib/types";

interface JobProfileFormProps {
  companies: Company[];
  onSubmit: (data: Partial<JobProfile>) => void;
  initialData?: Partial<JobProfile>;
  isLoading?: boolean;
}

export function JobProfileForm({
  companies,
  onSubmit,
  initialData,
  isLoading,
}: JobProfileFormProps) {
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || "");
  const [companyId, setCompanyId] = useState(initialData?.companyId || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [remote, setRemote] = useState(initialData?.remote || false);
  const [experienceLevel, setExperienceLevel] = useState(
    initialData?.experienceLevel || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      jobTitle,
      companyId,
      location,
      remote,
      experienceLevel,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Select
          value={companyId}
          onValueChange={setCompanyId}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experienceLevel">Experience Level (optional)</Label>
        <Select
          value={experienceLevel}
          onValueChange={setExperienceLevel}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Level</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="mid-level">Mid-Level</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="remote"
          checked={remote}
          onCheckedChange={setRemote}
          disabled={isLoading}
        />
        <Label htmlFor="remote">Remote Only</Label>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Job Profile"}
      </Button>
    </form>
  );
}
