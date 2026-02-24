import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ComponentStatus = 'active' | 'inactive' | 'error' | 'all';
export type FaultSeverity = 'error' | 'warning' | 'info' | 'all';
export type OperationType = 'service' | 'action' | 'all';

interface FilterState {
  // Global search
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  clearGlobalSearch: () => void;

  // Component filters
  componentFilters: {
    areaId: string | null;
    status: ComponentStatus;
    namePattern: string;
  };
  setComponentAreaFilter: (areaId: string | null) => void;
  setComponentStatusFilter: (status: ComponentStatus) => void;
  setComponentNameFilter: (pattern: string) => void;
  clearComponentFilters: () => void;

  // Topic filters
  topicFilters: {
    messageType: string | null;
    minUpdateFrequency: number | null;
    maxUpdateFrequency: number | null;
  };
  setTopicMessageTypeFilter: (messageType: string | null) => void;
  setTopicFrequencyFilter: (
    min: number | null,
    max: number | null,
  ) => void;
  clearTopicFilters: () => void;

  // Fault filters
  faultFilters: {
    severity: FaultSeverity;
    componentId: string | null;
    startTime: string | null;
    endTime: string | null;
  };
  setFaultSeverityFilter: (severity: FaultSeverity) => void;
  setFaultComponentFilter: (componentId: string | null) => void;
  setFaultTimeRangeFilter: (
    startTime: string | null,
    endTime: string | null,
  ) => void;
  clearFaultFilters: () => void;

  // Operation filters
  operationFilters: {
    type: OperationType;
    availableOnly: boolean;
  };
  setOperationTypeFilter: (type: OperationType) => void;
  setOperationAvailabilityFilter: (availableOnly: boolean) => void;
  clearOperationFilters: () => void;

  // Clear all filters
  clearAllFilters: () => void;
}

const defaultComponentFilters = {
  areaId: null,
  status: 'all' as ComponentStatus,
  namePattern: '',
};

const defaultTopicFilters = {
  messageType: null,
  minUpdateFrequency: null,
  maxUpdateFrequency: null,
};

const defaultFaultFilters = {
  severity: 'all' as FaultSeverity,
  componentId: null,
  startTime: null,
  endTime: null,
};

const defaultOperationFilters = {
  type: 'all' as OperationType,
  availableOnly: false,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      // Global search state
      globalSearchTerm: '',
      setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),
      clearGlobalSearch: () => set({ globalSearchTerm: '' }),

      // Component filters state
      componentFilters: defaultComponentFilters,
      setComponentAreaFilter: (areaId) =>
        set((state) => ({
          componentFilters: { ...state.componentFilters, areaId },
        })),
      setComponentStatusFilter: (status) =>
        set((state) => ({
          componentFilters: { ...state.componentFilters, status },
        })),
      setComponentNameFilter: (pattern) =>
        set((state) => ({
          componentFilters: {
            ...state.componentFilters,
            namePattern: pattern,
          },
        })),
      clearComponentFilters: () =>
        set({ componentFilters: defaultComponentFilters }),

      // Topic filters state
      topicFilters: defaultTopicFilters,
      setTopicMessageTypeFilter: (messageType) =>
        set((state) => ({
          topicFilters: { ...state.topicFilters, messageType },
        })),
      setTopicFrequencyFilter: (min, max) =>
        set((state) => ({
          topicFilters: {
            ...state.topicFilters,
            minUpdateFrequency: min,
            maxUpdateFrequency: max,
          },
        })),
      clearTopicFilters: () =>
        set({ topicFilters: defaultTopicFilters }),

      // Fault filters state
      faultFilters: defaultFaultFilters,
      setFaultSeverityFilter: (severity) =>
        set((state) => ({
          faultFilters: { ...state.faultFilters, severity },
        })),
      setFaultComponentFilter: (componentId) =>
        set((state) => ({
          faultFilters: { ...state.faultFilters, componentId },
        })),
      setFaultTimeRangeFilter: (startTime, endTime) =>
        set((state) => ({
          faultFilters: {
            ...state.faultFilters,
            startTime,
            endTime,
          },
        })),
      clearFaultFilters: () =>
        set({ faultFilters: defaultFaultFilters }),

      // Operation filters state
      operationFilters: defaultOperationFilters,
      setOperationTypeFilter: (type) =>
        set((state) => ({
          operationFilters: { ...state.operationFilters, type },
        })),
      setOperationAvailabilityFilter: (availableOnly) =>
        set((state) => ({
          operationFilters: {
            ...state.operationFilters,
            availableOnly,
          },
        })),
      clearOperationFilters: () =>
        set({ operationFilters: defaultOperationFilters }),

      // Clear all filters
      clearAllFilters: () =>
        set({
          globalSearchTerm: '',
          componentFilters: defaultComponentFilters,
          topicFilters: defaultTopicFilters,
          faultFilters: defaultFaultFilters,
          operationFilters: defaultOperationFilters,
        }),
    }),
    {
      name: 'filter-storage', // sessionStorage key
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
);
