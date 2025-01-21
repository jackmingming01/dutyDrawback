import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

type UseAxiosProps<T> = {
  path: string; // Only the relative API path (e.g., `/items`)
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  config?: AxiosRequestConfig;
  payload?: any;
  skip?: boolean; // Option to skip the initial request
};

type UseAxiosReturn<T> = {
  data: T | null;
  error: AxiosError | null;
  isLoading: boolean;
  refetch: (overrideConfig?: AxiosRequestConfig) => void;
  resetState: () => void; // New method to reset both success and error states
};

const useAxios = <T = unknown>({
  path,
  method = 'GET',
  config = {},
  payload = null,
  skip = false,
}: UseAxiosProps<T>): UseAxiosReturn<T> => {
  const baseURL = '/api'; // Proxy base path configured in next.config.js

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AxiosError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!skip);
  const [hasFetchedSuccessfully, setHasFetchedSuccessfully] = useState<boolean>(false);

  const fetchData = useCallback(
    async (overrideConfig?: AxiosRequestConfig) => {
      if (hasFetchedSuccessfully) return; // Skip if already fetched successfully
      setIsLoading(true);
      setError(null);

      try {
        const response: AxiosResponse<T> = await axios({
          baseURL,
          url: path,
          method,
          data: payload,
          ...config,
          ...overrideConfig,
        });
        setData(response.data);
        setHasFetchedSuccessfully(true); // Mark as successfully fetched
      } catch (err) {
        setError(err as AxiosError);
      } finally {
        setIsLoading(false);
      }
    },
    [baseURL, path, method, payload, config, hasFetchedSuccessfully]
  );

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
  }, [fetchData, skip]);

  const refetch = (overrideConfig?: AxiosRequestConfig) => {
    setHasFetchedSuccessfully(false); // Allow refetching if explicitly triggered
    fetchData(overrideConfig);
  };

  const resetState = () => {
    setData(null);
    setError(null);
    setHasFetchedSuccessfully(false);
  };

  return { data, error, isLoading, refetch, resetState };
};

export {useAxios};
