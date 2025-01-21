"use client";
import { useState, useCallback } from 'react';

interface TimeRange {
  start: Date;
  end: Date;
}

interface UseTimeRangeValidatorResult {
  timeRanges: TimeRange[];
  error: string | null;
  addTimeRange: (
    start: Date,
    end: Date,
    callback?: (error: string | null, timeRanges: TimeRange[]) => void
  ) => void;
  editTimeRange: (
    oldRange: TimeRange,
    newRange: TimeRange,
    callback?: (error: string | null, timeRanges: TimeRange[]) => void
  ) => void;
  resetTimeRanges: () => void;
  formatDate: (date: Date) => string;
}

export const useTimeRangeValidator = (): UseTimeRangeValidatorResult => {
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isOverlapping = useCallback(
    (newRange: TimeRange, excludedIndex: number | null = null): boolean => {
      return timeRanges.some((range, idx) => {
        if (excludedIndex !== null && idx === excludedIndex) return false;
        return newRange.start < range.end && newRange.end > range.start;
      });
    },
    [timeRanges]
  );

  const addTimeRange = useCallback(
    (
      start: Date,
      end: Date,
      callback?: (error: string | null, timeRanges: TimeRange[]) => void
    ) => {
      // Validate input
      if (!(start instanceof Date) || !(end instanceof Date)) {
        const err = 'Invalid date input.';
        setError(err);
        callback?.(err, timeRanges);
        return;
      }

      if (end <= start) {
        const err = 'End time must be after start time.';
        setError(err);
        callback?.(err, timeRanges);
        return;
      }

      const newRange: TimeRange = { start, end };

      // Check for overlaps
      if (!isOverlapping(newRange)) {
        const updatedRanges = [...timeRanges, newRange];
        setTimeRanges(updatedRanges);
        setError(null);
        callback?.(null, updatedRanges);
      } else {
        const err = 'Time range overlaps with existing ranges.';
        setError(err);
        callback?.(err, timeRanges);
      }
    },
    [isOverlapping, timeRanges]
  );

  const editTimeRange = useCallback(
    (
      oldRange: TimeRange,
      newRange: TimeRange,
      callback?: (error: string | null, timeRanges: TimeRange[]) => void
    ) => {
      if (!(newRange.start instanceof Date) || !(newRange.end instanceof Date)) {
        const err = '[Invalid Inputs] Editing mode only supports date range. Please remove the existed time point and add a new one.';
        setError(err);
        callback?.(err, timeRanges);
        return;
      }

      if (newRange.end <= newRange.start) {
        const err = 'End time must be after start time.';
        setError(err);
        callback?.(err, timeRanges);
        return;
      }

      // Locate the old range
      const index = timeRanges.findIndex(
        (range) =>
          range.start.getTime() === oldRange.start.getTime() &&
          range.end.getTime() === oldRange.end.getTime()
      );

      if (index === -1) {
        const err = 'Old time range not found.';
        setError(err);
        callback?.(err, timeRanges);
        return;
      }

      // Validate against all ranges except the old range
      if (!isOverlapping(newRange, index)) {
        const updatedRanges = timeRanges.map((range, idx) =>
          idx === index ? newRange : range
        );
        setTimeRanges(updatedRanges);
        setError(null);
        callback?.(null, updatedRanges);
      } else {
        const err = 'Time range overlaps with other existing ranges.';
        setError(err);
        callback?.(err, timeRanges);
      }
    },
    [isOverlapping, timeRanges]
  );

  const resetTimeRanges = useCallback(() => {
    setTimeRanges([]);
    setError(null);
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return date.toISOString().substr(0, 16).replace('T', ' '); // Format to YYYY-MM-DD HH:MM
  }, []);

  return {
    timeRanges,
    error,
    addTimeRange,
    editTimeRange,
    resetTimeRanges,
    formatDate,
  };
};