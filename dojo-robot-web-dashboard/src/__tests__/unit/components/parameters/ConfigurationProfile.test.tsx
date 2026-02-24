import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigurationProfile } from '@/components/parameters/ConfigurationProfile';
import { useConfigurationStore } from '@/features/stores/configurationStore';
import { useUIStore } from '@/features/stores/uiStore';

// Mock the stores
vi.mock('@/features/stores/configurationStore');
vi.mock('@/features/stores/uiStore');

describe('ConfigurationProfile', () => {
  const mockSaveProfile = vi.fn();
  const mockLoadProfile = vi.fn();
  const mockDeleteProfile = vi.fn();
  const mockGetProfile = vi.fn();

  const mockSetTheme = vi.fn();
  const mockSetLayoutMode = vi.fn();
  const mockSetSidebarCollapsed = vi.fn();
  const mockUpdatePreferences = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock configuration store
    vi.mocked(useConfigurationStore).mockReturnValue({
      profiles: [],
      saveProfile: mockSaveProfile,
      loadProfile: mockLoadProfile,
      deleteProfile: mockDeleteProfile,
      updateProfile: vi.fn(),
      getProfile: mockGetProfile,
    });

    // Mock UI store
    vi.mocked(useUIStore).mockReturnValue({
      theme: 'light',
      layoutMode: 'default',
      sidebarCollapsed: false,
      preferences: {
        autoRefresh: true,
        refreshInterval: 1000,
        showTimestamps: true,
        compactMode: false,
        animationsEnabled: true,
      },
      setTheme: mockSetTheme,
      setLayoutMode: mockSetLayoutMode,
      setSidebarCollapsed: mockSetSidebarCollapsed,
      updatePreferences: mockUpdatePreferences,
      toggleTheme: vi.fn(),
      toggleSidebar: vi.fn(),
    } as any);
  });

  describe('Rendering', () => {
    it('should render empty state when no profiles exist', () => {
      render(<ConfigurationProfile />);

      expect(screen.getByText('No saved profiles')).toBeInTheDocument();
      expect(screen.getByText(/Save your current configuration/)).toBeInTheDocument();
    });

    it('should render save profile button', () => {
      render(<ConfigurationProfile />);

      expect(screen.getByTestId('save-profile-button')).toBeInTheDocument();
      expect(screen.getByText('Save Profile')).toBeInTheDocument();
    });

    it('should render import button', () => {
      render(<ConfigurationProfile />);

      expect(screen.getByTestId('import-profile-input')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
    });

    it('should render list of profiles', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Development Setup',
          description: 'My dev config',
          configuration: {
            version: '1.0.0',
            settings: {
              theme: 'dark' as const,
              layoutMode: 'compact' as const,
              sidebarCollapsed: false,
              autoRefresh: true,
              refreshInterval: 1000,
              showTimestamps: true,
              compactMode: false,
              animationsEnabled: true,
            },
            layouts: [],
            robotInstances: [],
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useConfigurationStore).mockReturnValue({
        profiles: mockProfiles,
        saveProfile: mockSaveProfile,
        loadProfile: mockLoadProfile,
        deleteProfile: mockDeleteProfile,
        updateProfile: vi.fn(),
        getProfile: mockGetProfile,
      });

      render(<ConfigurationProfile />);

      expect(screen.getByText('Development Setup')).toBeInTheDocument();
      expect(screen.getByText('My dev config')).toBeInTheDocument();
    });
  });

  describe('Save Profile', () => {
    it('should show save dialog when save button is clicked', () => {
      render(<ConfigurationProfile />);

      fireEvent.click(screen.getByTestId('save-profile-button'));

      expect(screen.getByText('Save Configuration Profile')).toBeInTheDocument();
      expect(screen.getByTestId('profile-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('profile-description-input')).toBeInTheDocument();
    });

    it('should save profile with name and description', async () => {
      render(<ConfigurationProfile />);

      // Open dialog
      fireEvent.click(screen.getByTestId('save-profile-button'));

      // Fill form
      fireEvent.change(screen.getByTestId('profile-name-input'), {
        target: { value: 'Test Profile' },
      });
      fireEvent.change(screen.getByTestId('profile-description-input'), {
        target: { value: 'Test description' },
      });

      // Save
      fireEvent.click(screen.getByTestId('confirm-save-profile'));

      await waitFor(() => {
        expect(mockSaveProfile).toHaveBeenCalledWith(
          'Test Profile',
          'Test description',
          expect.objectContaining({
            version: '1.0.0',
            settings: expect.any(Object),
          })
        );
      });
    });

    it('should show error when saving without name', async () => {
      render(<ConfigurationProfile />);

      // Open dialog
      fireEvent.click(screen.getByTestId('save-profile-button'));

      // Try to save without name
      fireEvent.click(screen.getByTestId('confirm-save-profile'));

      await waitFor(() => {
        expect(screen.getByText('Profile name is required')).toBeInTheDocument();
      });

      expect(mockSaveProfile).not.toHaveBeenCalled();
    });

    it('should close dialog after successful save', async () => {
      render(<ConfigurationProfile />);

      // Open dialog
      fireEvent.click(screen.getByTestId('save-profile-button'));

      // Fill and save
      fireEvent.change(screen.getByTestId('profile-name-input'), {
        target: { value: 'Test Profile' },
      });
      fireEvent.click(screen.getByTestId('confirm-save-profile'));

      await waitFor(() => {
        expect(screen.queryByText('Save Configuration Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Load Profile', () => {
    it('should load profile when load button is clicked', () => {
      const mockConfig = {
        version: '1.0.0',
        settings: {
          theme: 'dark' as const,
          layoutMode: 'compact' as const,
          sidebarCollapsed: true,
          autoRefresh: false,
          refreshInterval: 2000,
          showTimestamps: false,
          compactMode: true,
          animationsEnabled: false,
        },
        layouts: [],
        robotInstances: [],
      };

      mockLoadProfile.mockReturnValue(mockConfig);

      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile',
          configuration: mockConfig,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useConfigurationStore).mockReturnValue({
        profiles: mockProfiles,
        saveProfile: mockSaveProfile,
        loadProfile: mockLoadProfile,
        deleteProfile: mockDeleteProfile,
        updateProfile: vi.fn(),
        getProfile: mockGetProfile,
      });

      render(<ConfigurationProfile />);

      fireEvent.click(screen.getByTestId('load-profile-profile-1'));

      expect(mockLoadProfile).toHaveBeenCalledWith('profile-1');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockSetLayoutMode).toHaveBeenCalledWith('compact');
      expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(true);
      expect(mockUpdatePreferences).toHaveBeenCalledWith({
        autoRefresh: false,
        refreshInterval: 2000,
        showTimestamps: false,
        compactMode: true,
        animationsEnabled: false,
      });
    });

    it('should call onProfileLoad callback when provided', () => {
      const mockConfig = {
        version: '1.0.0',
        settings: {
          theme: 'dark' as const,
          layoutMode: 'compact' as const,
          sidebarCollapsed: false,
          autoRefresh: true,
          refreshInterval: 1000,
          showTimestamps: true,
          compactMode: false,
          animationsEnabled: true,
        },
        layouts: [],
        robotInstances: [],
      };

      mockLoadProfile.mockReturnValue(mockConfig);

      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile',
          configuration: mockConfig,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useConfigurationStore).mockReturnValue({
        profiles: mockProfiles,
        saveProfile: mockSaveProfile,
        loadProfile: mockLoadProfile,
        deleteProfile: mockDeleteProfile,
        updateProfile: vi.fn(),
        getProfile: mockGetProfile,
      });

      const onProfileLoad = vi.fn();
      render(<ConfigurationProfile onProfileLoad={onProfileLoad} />);

      fireEvent.click(screen.getByTestId('load-profile-profile-1'));

      expect(onProfileLoad).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('Delete Profile', () => {
    it('should delete profile when delete button is clicked and confirmed', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile',
          configuration: {
            version: '1.0.0',
            settings: {
              theme: 'dark' as const,
              layoutMode: 'compact' as const,
              sidebarCollapsed: false,
              autoRefresh: true,
              refreshInterval: 1000,
              showTimestamps: true,
              compactMode: false,
              animationsEnabled: true,
            },
            layouts: [],
            robotInstances: [],
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useConfigurationStore).mockReturnValue({
        profiles: mockProfiles,
        saveProfile: mockSaveProfile,
        loadProfile: mockLoadProfile,
        deleteProfile: mockDeleteProfile,
        updateProfile: vi.fn(),
        getProfile: mockGetProfile,
      });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<ConfigurationProfile />);

      fireEvent.click(screen.getByTestId('delete-profile-profile-1'));

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteProfile).toHaveBeenCalledWith('profile-1');

      confirmSpy.mockRestore();
    });

    it('should not delete profile when deletion is cancelled', () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile',
          configuration: {
            version: '1.0.0',
            settings: {
              theme: 'dark' as const,
              layoutMode: 'compact' as const,
              sidebarCollapsed: false,
              autoRefresh: true,
              refreshInterval: 1000,
              showTimestamps: true,
              compactMode: false,
              animationsEnabled: true,
            },
            layouts: [],
            robotInstances: [],
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useConfigurationStore).mockReturnValue({
        profiles: mockProfiles,
        saveProfile: mockSaveProfile,
        loadProfile: mockLoadProfile,
        deleteProfile: mockDeleteProfile,
        updateProfile: vi.fn(),
        getProfile: mockGetProfile,
      });

      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<ConfigurationProfile />);

      fireEvent.click(screen.getByTestId('delete-profile-profile-1'));

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteProfile).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Export Profile', () => {
    it('should export profile as JSON file', () => {
      const mockConfig = {
        version: '1.0.0',
        settings: {
          theme: 'dark' as const,
          layoutMode: 'compact' as const,
          sidebarCollapsed: false,
          autoRefresh: true,
          refreshInterval: 1000,
          showTimestamps: true,
          compactMode: false,
          animationsEnabled: true,
        },
        layouts: [],
        robotInstances: [],
      };

      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile',
          configuration: mockConfig,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockGetProfile.mockReturnValue(mockProfiles[0]);

      vi.mocked(useConfigurationStore).mockReturnValue({
        profiles: mockProfiles,
        saveProfile: mockSaveProfile,
        loadProfile: mockLoadProfile,
        deleteProfile: mockDeleteProfile,
        updateProfile: vi.fn(),
        getProfile: mockGetProfile,
      });

      render(<ConfigurationProfile />);

      // Mock URL.createObjectURL and related functions
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      fireEvent.click(screen.getByTestId('export-profile-profile-1'));

      expect(mockGetProfile).toHaveBeenCalledWith('profile-1');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
