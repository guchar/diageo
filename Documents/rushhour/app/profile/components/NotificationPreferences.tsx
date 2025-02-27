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
import { NotificationPreferences as NotificationPrefsType } from "@/lib/types";

interface NotificationPreferencesProps {
  initialPreferences: NotificationPrefsType;
  onSave: (prefs: NotificationPrefsType) => void;
  isLoading?: boolean;
}

export function NotificationPreferences({
  initialPreferences,
  onSave,
  isLoading,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] =
    useState<NotificationPrefsType>(initialPreferences);

  const handleChannelChange = (channel: keyof NotificationPrefsType) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  const handleFrequencyChange = (
    frequency: NotificationPrefsType["frequency"]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      frequency,
    }));
  };

  const handleTimezoneChange = (timezone: string) => {
    setPreferences((prev) => ({
      ...prev,
      timezone,
    }));
  };

  const handleQuietHoursChange = (type: "start" | "end", value: string) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        start: type === "start" ? value : prev.quietHours?.start || "00:00",
        end: type === "end" ? value : prev.quietHours?.end || "23:59",
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(preferences);
  };

  // Get list of available timezones
  const timezones = Intl.supportedValuesOf("timeZone");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Notification Frequency</h3>
        <Select
          value={preferences.frequency}
          onValueChange={handleFrequencyChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="hourly">Hourly Digest</SelectItem>
            <SelectItem value="daily">Daily Digest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Notification Channels</h3>
        {(["email", "push", "sms", "slack"] as const).map((channel) => (
          <div key={channel} className="flex items-center justify-between">
            <Label htmlFor={`${channel}-toggle`} className="capitalize">
              {channel}
            </Label>
            <Switch
              id={`${channel}-toggle`}
              checked={preferences[channel]}
              onCheckedChange={() => handleChannelChange(channel)}
              disabled={isLoading}
            />
          </div>
        ))}
      </div>

      {preferences.slack && (
        <div className="space-y-2">
          <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
          <Input
            id="slackWebhook"
            value={preferences.slackWebhook || ""}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                slackWebhook: e.target.value,
              }))
            }
            placeholder="https://hooks.slack.com/..."
            disabled={isLoading}
          />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold">Timezone</h3>
        <Select
          value={preferences.timezone}
          onValueChange={handleTimezoneChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Quiet Hours</h3>
        <div className="flex space-x-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="quietHoursStart">Start Time</Label>
            <Input
              id="quietHoursStart"
              type="time"
              value={preferences.quietHours?.start || ""}
              onChange={(e) => handleQuietHoursChange("start", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="quietHoursEnd">End Time</Label>
            <Input
              id="quietHoursEnd"
              type="time"
              value={preferences.quietHours?.end || ""}
              onChange={(e) => handleQuietHoursChange("end", e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  );
}
