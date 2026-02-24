import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '../../../features/stores/filterStore';

describe('filterStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { clearAllFilters } = useFilterStore.getState();
    clearAllFilters();
  });

  describe('global search', () => {
    it('should set global search term', () => {
      const { setGlobalSearchTerm } = useFilterStore.getState();
      setGlobalSearchTerm('test');
      expect(useFilterStore.getState().globalSearchTerm).toBe('test');
    });

    it('should clear global search', () => {
      const { setGlobalSearchTerm, clearGlobalSearch } =
        useFilterStore.getState();
      setGlobalSearchTerm('test');
      clearGlobalSearch();
      expect(useFilterStore.getState().globalSearchTerm).toBe('');
    });
  });

  describe('component filters', () => {
    it('should set component area filter', () => {
      const { setComponentAreaFilter } = useFilterStore.getState();
      setComponentAreaFilter('area-1');
      expect(useFilterStore.getState().componentFilters.areaId).toBe(
        'area-1',
      );
    });

    it('should set component status filter', () => {
      const { setComponentStatusFilter } = useFilterStore.getState();
      setComponentStatusFilter('active');
      expect(useFilterStore.getState().componentFilters.status).toBe(
        'active',
      );
    });

    it('should set component name filter', () => {
      const { setComponentNameFilter } = useFilterStore.getState();
      setComponentNameFilter('robot');
      expect(
        useFilterStore.getState().componentFilters.namePattern,
      ).toBe('robot');
    });

    it('should clear component filters', () => {
      const {
        setComponentAreaFilter,
        setComponentStatusFilter,
        clearComponentFilters,
      } = useFilterStore.getState();
      setComponentAreaFilter('area-1');
      setComponentStatusFilter('active');
      clearComponentFilters();
      expect(useFilterStore.getState().componentFilters).toEqual({
        areaId: null,
        status: 'all',
        namePattern: '',
      });
    });
  });

  describe('topic filters', () => {
    it('should set topic message type filter', () => {
      const { setTopicMessageTypeFilter } = useFilterStore.getState();
      setTopicMessageTypeFilter('sensor_msgs/Image');
      expect(useFilterStore.getState().topicFilters.messageType).toBe(
        'sensor_msgs/Image',
      );
    });

    it('should set topic frequency filter', () => {
      const { setTopicFrequencyFilter } = useFilterStore.getState();
      setTopicFrequencyFilter(1, 10);
      expect(
        useFilterStore.getState().topicFilters.minUpdateFrequency,
      ).toBe(1);
      expect(
        useFilterStore.getState().topicFilters.maxUpdateFrequency,
      ).toBe(10);
    });

    it('should clear topic filters', () => {
      const { setTopicMessageTypeFilter, clearTopicFilters } =
        useFilterStore.getState();
      setTopicMessageTypeFilter('sensor_msgs/Image');
      clearTopicFilters();
      expect(useFilterStore.getState().topicFilters).toEqual({
        messageType: null,
        minUpdateFrequency: null,
        maxUpdateFrequency: null,
      });
    });
  });

  describe('fault filters', () => {
    it('should set fault severity filter', () => {
      const { setFaultSeverityFilter } = useFilterStore.getState();
      setFaultSeverityFilter('error');
      expect(useFilterStore.getState().faultFilters.severity).toBe(
        'error',
      );
    });

    it('should set fault component filter', () => {
      const { setFaultComponentFilter } = useFilterStore.getState();
      setFaultComponentFilter('component-1');
      expect(useFilterStore.getState().faultFilters.componentId).toBe(
        'component-1',
      );
    });

    it('should set fault time range filter', () => {
      const { setFaultTimeRangeFilter } = useFilterStore.getState();
      const start = '2024-01-01T00:00:00Z';
      const end = '2024-01-02T00:00:00Z';
      setFaultTimeRangeFilter(start, end);
      expect(useFilterStore.getState().faultFilters.startTime).toBe(
        start,
      );
      expect(useFilterStore.getState().faultFilters.endTime).toBe(end);
    });

    it('should clear fault filters', () => {
      const { setFaultSeverityFilter, clearFaultFilters } =
        useFilterStore.getState();
      setFaultSeverityFilter('error');
      clearFaultFilters();
      expect(useFilterStore.getState().faultFilters).toEqual({
        severity: 'all',
        componentId: null,
        startTime: null,
        endTime: null,
      });
    });
  });

  describe('operation filters', () => {
    it('should set operation type filter', () => {
      const { setOperationTypeFilter } = useFilterStore.getState();
      setOperationTypeFilter('service');
      expect(useFilterStore.getState().operationFilters.type).toBe(
        'service',
      );
    });

    it('should set operation availability filter', () => {
      const { setOperationAvailabilityFilter } =
        useFilterStore.getState();
      setOperationAvailabilityFilter(true);
      expect(
        useFilterStore.getState().operationFilters.availableOnly,
      ).toBe(true);
    });

    it('should clear operation filters', () => {
      const { setOperationTypeFilter, clearOperationFilters } =
        useFilterStore.getState();
      setOperationTypeFilter('service');
      clearOperationFilters();
      expect(useFilterStore.getState().operationFilters).toEqual({
        type: 'all',
        availableOnly: false,
      });
    });
  });

  describe('clear all filters', () => {
    it('should clear all filters at once', () => {
      const {
        setGlobalSearchTerm,
        setComponentAreaFilter,
        setTopicMessageTypeFilter,
        setFaultSeverityFilter,
        setOperationTypeFilter,
        clearAllFilters,
      } = useFilterStore.getState();

      setGlobalSearchTerm('test');
      setComponentAreaFilter('area-1');
      setTopicMessageTypeFilter('sensor_msgs/Image');
      setFaultSeverityFilter('error');
      setOperationTypeFilter('service');

      clearAllFilters();

      const state = useFilterStore.getState();
      expect(state.globalSearchTerm).toBe('');
      expect(state.componentFilters.areaId).toBeNull();
      expect(state.topicFilters.messageType).toBeNull();
      expect(state.faultFilters.severity).toBe('all');
      expect(state.operationFilters.type).toBe('all');
    });
  });
});
