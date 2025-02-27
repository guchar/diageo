export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  notificationPrefs: string | NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  careerPageUrl: string;
  selectorsConfig: string | CompanySelectors;
  lastScanTime: Date | null;
  jobProfiles?: (JobProfile & { user?: User })[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySelectors {
  jobTitle: string;
  jobDescription: string;
  jobLocation: string;
  applyLink: string;
  salary?: string;
  deadline?: string;
  fallbackSelectors?: string[];
  experienceLevel?: string;
}

export interface JobProfile {
  id: string;
  userId: string;
  companyId: string;
  user?: User;
  company?: Company;
  jobTitle: string;
  location: string | null;
  remote: boolean;
  experienceLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobMatch {
  id?: string;
  jobProfileId: string;
  jobProfile?: JobProfile;
  title: string;
  description: string;
  location: string;
  type: string;
  applyLink: string;
  postedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  frequency: "immediate" | "hourly" | "daily";
  email: boolean;
  push: boolean;
  sms: boolean;
  slack: boolean;
  slackWebhook?: string;
  quietHours?: { start: string; end: string };
  timezone: string;
}
