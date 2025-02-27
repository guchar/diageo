"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";
import { Company, JobProfile } from "@/lib/types";

interface EditJobProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: JobProfile) => void;
  profile: JobProfile | null;
  companies: Company[];
}

export default function EditJobProfileDialog({
  open,
  onClose,
  onProfileUpdated,
  profile,
  companies,
}: EditJobProfileDialogProps) {
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setTitle(profile.jobTitle);
      setCompanyId(profile.companyId);
      setLocation(profile.location || "");
      setIsRemote(profile.remote);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/job-profiles/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: title,
          companyId,
          location,
          remote: isRemote,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job profile");
      }

      const updatedProfile = await response.json();
      onProfileUpdated(updatedProfile);
      toast({
        title: "Success",
        description: "Job profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Job Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
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
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="remote"
                checked={isRemote}
                onCheckedChange={setIsRemote}
              />
              <Label htmlFor="remote">Remote Position</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Job Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
