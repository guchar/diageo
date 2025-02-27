import {
  User as PrismaUser,
  Company as PrismaCompany,
  JobProfile as PrismaJobProfile,
} from "@prisma/client";

export interface CompanySelectors {
  jobListSelector: string;
  searchInputSelector?: string;
  titleSelector?: string;
  descriptionSelector?: string;
  urlSelector?: string;
  locationSelector?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  slack: boolean;
  slackWebhook?: string;
  quietHours?: {
    start: string;
    end: string;
  };
  frequency: "immediate" | "hourly" | "daily";
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  description: string;
  url: string;
  postedDate: Date;
  createdAt: Date;
}

export interface User extends Omit<PrismaUser, "notificationPrefs"> {
  notificationPrefs: NotificationPreferences;
  token?: string;
}

export interface Company extends Omit<PrismaCompany, "selectorsConfig"> {
  selectorsConfig: CompanySelectors;
  jobProfiles?: JobProfile[];
}

export interface JobProfile extends Omit<PrismaJobProfile, "location"> {
  location: string | null;
  remote: boolean;
  experienceLevel?: string;
  keywords?: string[];
}
