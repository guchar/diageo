"use client";

import { useState } from "react";
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

interface AddCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onCompanyAdded: (company: Company) => void;
}

export default function AddCompanyDialog({
  open,
  onClose,
  onCompanyAdded,
}: AddCompanyDialogProps) {
  const [name, setName] = useState("");
  const [careerPageUrl, setCareerPageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          careerPageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add company");
      }

      const company = await response.json();
      onCompanyAdded(company);
      toast({
        title: "Success",
        description: "Company added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add company",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setName("");
      setCareerPageUrl("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
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
              {isLoading ? "Adding..." : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
