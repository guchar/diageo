import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Company, CompanySelectors } from "@/lib/types";

interface CompanyFormProps {
  onSubmit: (data: Partial<Company>) => void;
  initialData?: Partial<Company>;
  isLoading?: boolean;
}

export function CompanyForm({
  onSubmit,
  initialData,
  isLoading,
}: CompanyFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [careerPageUrl, setCareerPageUrl] = useState(
    initialData?.careerPageUrl || ""
  );
  const [verificationStatus, setVerificationStatus] = useState<{
    isValid?: boolean;
    error?: string;
    suggestedSelectors?: CompanySelectors;
  }>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!careerPageUrl) return;

    setIsVerifying(true);
    try {
      const response = await fetch("/api/companies/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: careerPageUrl }),
      });

      const data = await response.json();
      setVerificationStatus(data);
    } catch (error) {
      setVerificationStatus({
        isValid: false,
        error: "Failed to verify career page",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationStatus.isValid) return;

    onSubmit({
      name,
      careerPageUrl,
      selectorsConfig: verificationStatus.suggestedSelectors
        ? JSON.stringify(verificationStatus.suggestedSelectors)
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="careerPageUrl">Career Page URL</Label>
        <div className="flex space-x-2">
          <Input
            id="careerPageUrl"
            type="url"
            value={careerPageUrl}
            onChange={(e) => setCareerPageUrl(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleVerify}
            disabled={!careerPageUrl || isVerifying || isLoading}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying
              </>
            ) : (
              "Verify URL"
            )}
          </Button>
        </div>
      </div>

      {verificationStatus.isValid !== undefined && (
        <Alert
          variant={verificationStatus.isValid ? "default" : "destructive"}
          className="mt-2"
        >
          {verificationStatus.isValid ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {verificationStatus.isValid
              ? "Career page verified successfully! Job listings can be monitored."
              : verificationStatus.error || "Failed to verify career page"}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isLoading || isVerifying || !verificationStatus.isValid}
      >
        {isLoading ? "Saving..." : "Save Company"}
      </Button>
    </form>
  );
}
