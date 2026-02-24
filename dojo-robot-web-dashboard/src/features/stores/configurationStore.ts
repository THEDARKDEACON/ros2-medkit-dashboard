import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardConfiguration } from '@/types/configuration';

export interface ConfigurationProfile {
  id: string;
  name: string;
  description?: string;
  configuration: DashboardConfiguration;
  createdAt: string;
  updatedAt: string;
}

interface ConfigurationState {
  // Saved profiles
  profiles: ConfigurationProfile[];
  
  // Actions
  saveProfile: (name: string, description: string | undefined, config: DashboardConfiguration) => void;
  loadProfile: (profileId: string) => DashboardConfiguration | null;
  deleteProfile: (profileId: string) => void;
  updateProfile: (profileId: string, updates: Partial<Omit<ConfigurationProfile, 'id' | 'createdAt'>>) => void;
  getProfile: (profileId: string) => ConfigurationProfile | undefined;
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set, get) => ({
      profiles: [],

      saveProfile: (name, description, config) => {
        const now = new Date().toISOString();
        const profile: ConfigurationProfile = {
          id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          configuration: config,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          profiles: [...state.profiles, profile],
        }));
      },

      loadProfile: (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId);
        return profile ? profile.configuration : null;
      },

      deleteProfile: (profileId) => {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== profileId),
        }));
      },

      updateProfile: (profileId, updates) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === profileId
              ? {
                  ...p,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      getProfile: (profileId) => {
        return get().profiles.find((p) => p.id === profileId);
      },
    }),
    {
      name: 'configuration-profiles',
      partialize: (state) => ({
        profiles: state.profiles,
      }),
    }
  )
);
