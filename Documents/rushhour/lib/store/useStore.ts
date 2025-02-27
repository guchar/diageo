import { create } from "zustand";
import {
  Company,
  JobProfile,
  JobMatch,
  NotificationPreferences,
} from "../types";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface JobState {
  companies: Company[];
  jobProfiles: JobProfile[];
  jobMatches: JobMatch[];
  isLoading: boolean;
  error: string | null;
  addCompany: (
    company: Omit<Company, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  addJobProfile: (
    jobProfile: Omit<JobProfile, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  fetchCompanies: () => Promise<void>;
  fetchJobProfiles: () => Promise<void>;
  fetchJobMatches: () => Promise<void>;
}

interface NotificationState {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (prefs: NotificationPreferences) => Promise<void>;
  fetchPreferences: () => Promise<void>;
}

interface Store extends AuthState, JobState, NotificationState {}

const useStore = create<Store>((set, get) => ({
  // Auth State
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth?action=signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");

      // Fetch user data after successful login
      const userRes = await fetch("/api/auth/user");
      const user = await userRes.json();
      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Login failed",
        isLoading: false,
      });
    }
  },

  signup: async (email: string, password: string, name?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth?action=signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error("Signup failed");

      // Login after successful signup
      await get().login(email, password);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Signup failed",
        isLoading: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await fetch("/api/auth", { method: "DELETE" });
      set({ user: null, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Logout failed",
        isLoading: false,
      });
    }
  },

  // Job State
  companies: [],
  jobProfiles: [],
  jobMatches: [],

  addCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      if (!res.ok) throw new Error("Failed to add company");
      await get().fetchCompanies();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to add company",
        isLoading: false,
      });
    }
  },

  addJobProfile: async (jobProfile) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/job-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobProfile),
      });
      if (!res.ok) throw new Error("Failed to add job profile");
      await get().fetchJobProfiles();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to add job profile",
        isLoading: false,
      });
    }
  },

  fetchCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error("Failed to fetch companies");
      const companies = await res.json();
      set({ companies, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch companies",
        isLoading: false,
      });
    }
  },

  fetchJobProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/job-profiles");
      if (!res.ok) throw new Error("Failed to fetch job profiles");
      const jobProfiles = await res.json();
      set({ jobProfiles, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch job profiles",
        isLoading: false,
      });
    }
  },

  fetchJobMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/job-matches");
      if (!res.ok) throw new Error("Failed to fetch job matches");
      const jobMatches = await res.json();
      set({ jobMatches, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch job matches",
        isLoading: false,
      });
    }
  },

  // Notification State
  preferences: null,

  updatePreferences: async (prefs) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      const preferences = await res.json();
      set({ preferences, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
        isLoading: false,
      });
    }
  },

  fetchPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/notification-preferences");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const preferences = await res.json();
      set({ preferences, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch preferences",
        isLoading: false,
      });
    }
  },
}));

export default useStore;
