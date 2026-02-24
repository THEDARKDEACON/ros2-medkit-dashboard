import { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  Trash2,
  FileText,
  Calendar,
  AlertCircle,
  Check,
  X,
  GitCompare,
} from 'lucide-react';
import { useConfigurationStore } from '@/features/stores/configurationStore';
import { useUIStore } from '@/features/stores/uiStore';
import {
  parseConfiguration,
  serializeConfiguration,
  createDefaultConfiguration,
} from '@/utils/configuration';
import type { DashboardConfiguration } from '@/types/configuration';
import { EmptyState } from '@/components/common/EmptyState';

interface ConfigurationProfileProps {
  /**
   * Callback when a profile is loaded
   */
  onProfileLoad?: (config: DashboardConfiguration) => void;
}

/**
 * ConfigurationProfile - Manage configuration profiles
 * 
 * Features:
 * - Save current configuration as a profile
 * - Display list of saved profiles
 * - Load profile to apply configuration
 * - Show diff view comparing configurations
 * - Import/export profiles as JSON files
 * - Delete profiles
 * 
 * **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10**
 */
export function ConfigurationProfile({ onProfileLoad }: ConfigurationProfileProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedProfileForDiff, setSelectedProfileForDiff] = useState<string | null>(null);

  // Get profiles from store
  const { profiles, saveProfile, loadProfile, deleteProfile, getProfile } = useConfigurationStore();
  
  // Get current UI state to create configuration
  const uiState = useUIStore();

  // Get current configuration
  const getCurrentConfiguration = (): DashboardConfiguration => {
    return {
      version: '1.0.0',
      settings: {
        theme: uiState.theme,
        layoutMode: uiState.layoutMode,
        sidebarCollapsed: uiState.sidebarCollapsed,
        autoRefresh: uiState.preferences.autoRefresh,
        refreshInterval: uiState.preferences.refreshInterval,
        showTimestamps: uiState.preferences.showTimestamps,
        compactMode: uiState.preferences.compactMode,
        animationsEnabled: uiState.preferences.animationsEnabled,
      },
      layouts: [],
      robotInstances: [],
    };
  };

  // Handle save profile
  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      setSaveError('Profile name is required');
      return;
    }

    try {
      const config = getCurrentConfiguration();
      saveProfile(profileName.trim(), profileDescription.trim() || undefined, config);
      
      // Reset form
      setProfileName('');
      setProfileDescription('');
      setSaveError(null);
      setShowSaveDialog(false);
    } catch (error) {
      setSaveError('Failed to save profile');
    }
  };

  // Handle load profile
  const handleLoadProfile = (profileId: string) => {
    const config = loadProfile(profileId);
    if (config) {
      // Apply configuration to UI state
      if (config.settings) {
        uiState.setTheme(config.settings.theme);
        uiState.setLayoutMode(config.settings.layoutMode);
        uiState.setSidebarCollapsed(config.settings.sidebarCollapsed);
        uiState.updatePreferences({
          autoRefresh: config.settings.autoRefresh,
          refreshInterval: config.settings.refreshInterval,
          showTimestamps: config.settings.showTimestamps,
          compactMode: config.settings.compactMode,
          animationsEnabled: config.settings.animationsEnabled,
        });
      }

      // Notify parent
      if (onProfileLoad) {
        onProfileLoad(config);
      }
    }
  };

  // Handle export profile
  const handleExportProfile = (profileId: string) => {
    const profile = getProfile(profileId);
    if (!profile) return;

    const jsonString = serializeConfiguration(profile.configuration);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, '-').toLowerCase()}-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle import profile
  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parseResult = parseConfiguration(content);

        if (!parseResult.success || !parseResult.data) {
          const errorMessages = parseResult.errors?.map(e => e.message).join(', ') || 'Invalid configuration';
          setImportError(`Import failed: ${errorMessages}`);
          return;
        }

        // Save as new profile
        const fileName = file.name.replace(/\.json$/, '');
        saveProfile(
          `Imported: ${fileName}`,
          'Imported from file',
          parseResult.data
        );
        setImportError(null);
      } catch (error) {
        setImportError('Failed to read file');
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file');
    };

    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  // Handle delete profile
  const handleDeleteProfile = (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      deleteProfile(profileId);
      if (selectedProfileForDiff === profileId) {
        setSelectedProfileForDiff(null);
      }
    }
  };

  // Get diff between current and selected profile
  const getDiff = () => {
    if (!selectedProfileForDiff) return null;

    const profile = getProfile(selectedProfileForDiff);
    if (!profile) return null;

    const current = getCurrentConfiguration();
    const saved = profile.configuration;

    const diffs: Array<{ field: string; current: string; saved: string }> = [];

    // Compare settings
    if (current.settings.theme !== saved.settings.theme) {
      diffs.push({
        field: 'Theme',
        current: current.settings.theme,
        saved: saved.settings.theme,
      });
    }

    if (current.settings.layoutMode !== saved.settings.layoutMode) {
      diffs.push({
        field: 'Layout Mode',
        current: current.settings.layoutMode,
        saved: saved.settings.layoutMode,
      });
    }

    if (current.settings.sidebarCollapsed !== saved.settings.sidebarCollapsed) {
      diffs.push({
        field: 'Sidebar Collapsed',
        current: String(current.settings.sidebarCollapsed),
        saved: String(saved.settings.sidebarCollapsed),
      });
    }

    if (current.settings.autoRefresh !== saved.settings.autoRefresh) {
      diffs.push({
        field: 'Auto Refresh',
        current: String(current.settings.autoRefresh),
        saved: String(saved.settings.autoRefresh),
      });
    }

    if (current.settings.refreshInterval !== saved.settings.refreshInterval) {
      diffs.push({
        field: 'Refresh Interval',
        current: `${current.settings.refreshInterval}ms`,
        saved: `${saved.settings.refreshInterval}ms`,
      });
    }

    return diffs;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-foreground">Configuration Profiles</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Save and load dashboard configuration presets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Profile Button */}
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
            data-testid="save-profile-button"
          >
            <Save className="h-4 w-4" />
            Save Profile
          </button>

          {/* Import Profile Button */}
          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportProfile}
              className="hidden"
              data-testid="import-profile-input"
            />
          </label>
        </div>
      </div>

      {/* Import Error */}
      {importError && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{importError}</span>
          <button
            onClick={() => setImportError(null)}
            className="ml-auto p-1 hover:bg-destructive/20 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Save Profile Dialog */}
      {showSaveDialog && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Save Configuration Profile</h4>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSaveError(null);
                setProfileName('');
                setProfileDescription('');
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-foreground mb-1">
                Profile Name *
              </label>
              <input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g., Development Setup"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="profile-name-input"
              />
            </div>

            <div>
              <label htmlFor="profile-description" className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                id="profile-description"
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                data-testid="profile-description-input"
              />
            </div>

            {saveError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveError(null);
                  setProfileName('');
                  setProfileDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                data-testid="confirm-save-profile"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diff View */}
      {selectedProfileForDiff && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Configuration Differences</h4>
            </div>
            <button
              onClick={() => setSelectedProfileForDiff(null)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {(() => {
            const diffs = getDiff();
            if (!diffs || diffs.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  No differences found. Current configuration matches the selected profile.
                </p>
              );
            }

            return (
              <div className="space-y-2">
                {diffs.map((diff, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-md">
                    <div className="font-medium text-sm text-foreground mb-2">{diff.field}</div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-1">Current</div>
                        <div className="font-mono bg-background px-2 py-1 rounded">{diff.current}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Profile</div>
                        <div className="font-mono bg-background px-2 py-1 rounded">{diff.saved}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Profiles List */}
      {profiles.length === 0 ? (
        <EmptyState
          title="No saved profiles"
          description="Save your current configuration as a profile to quickly switch between different setups."
          size="sm"
        />
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Profile Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <h5 className="font-medium text-foreground">{profile.name}</h5>
                  </div>

                  {profile.description && (
                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {formatDate(profile.createdAt)}</span>
                    </div>
                    {profile.updatedAt !== profile.createdAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated: {formatDate(profile.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleLoadProfile(profile.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors"
                    data-testid={`load-profile-${profile.id}`}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setSelectedProfileForDiff(
                      selectedProfileForDiff === profile.id ? null : profile.id
                    )}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    title="Show diff"
                  >
                    <GitCompare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExportProfile(profile.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    title="Export"
                    data-testid={`export-profile-${profile.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Delete"
                    data-testid={`delete-profile-${profile.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
