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
import { useToast } from "@/components/ui/use-toast";
import { Company } from "@/lib/types";

interface EditCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onCompanyUpdated: (company: Company) => void;
  company: Company | null;
}

export default function EditCompanyDialog({
  open,
  onClose,
  onCompanyUpdated,
  company,
}: EditCompanyDialogProps) {
  const [name, setName] = useState("");
  const [careerPageUrl, setCareerPageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setName(company.name);
      setCareerPageUrl(company.careerPageUrl);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          careerPageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      const updatedCompany = await response.json();
      onCompanyUpdated(updatedCompany);
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company",
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
          <DialogTitle>Edit Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
            <div>
              <Label htmlFor="careerPageUrl">Career Page URL</Label>
              <Input
                id="careerPageUrl"
                value={careerPageUrl}
                onChange={(e) => setCareerPageUrl(e.target.value)}
                placeholder="Enter career page URL"
                type="url"
                required
              />
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
              {isLoading ? "Updating..." : "Update Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
