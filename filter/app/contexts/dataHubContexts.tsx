"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  useCallback
} from 'react';

type DataStore = { [key: string]: any };

interface DataHubContextType {
  data: DataStore;                                // The dictionary of current data
  setData: Dispatch<SetStateAction<DataStore>>;   // Function to update data
  getData: () => DataStore;                       // Method to retrieve the latest data
}

const DataHubContext = createContext<DataHubContextType | undefined>(undefined);

interface DataHubProviderProps {
  children: ReactNode;
}

export const DataHubProvider: React.FC<DataHubProviderProps> = ({ children }) => {
  const [data, setData] = useState<DataStore>({});

  // Helper function to deeply compare objects for equality
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null ||
        typeof obj2 !== 'object' || obj2 === null) {
      return false;
    }

    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
    }
    return true;
  }, []);

  // Helper function to check if new data is a duplicate of existing data
  const isDataDuplicate = useCallback((newData: DataStore, existingData: DataStore): boolean => {
    // Compare each key in newData with existingData
    return Object.keys(newData).every(key =>
      Array.isArray(newData[key])
        ? newData[key].every(item =>
            existingData[key]?.some(existingItem => deepEqual(item, existingItem))
          )
        : deepEqual(newData[key], existingData[key])
    );
  }, [deepEqual]);

  // Update setData to check for duplicates before setting
  const setUniqueData = useCallback((newData: DataStore | ((prevData: DataStore) => DataStore)) => {
    setData(prevData => {
      let updatedData: DataStore = {};

      if (typeof newData === 'function') {
        updatedData = newData(prevData);
      } else {
        updatedData = newData;
      }

      if (isDataDuplicate(updatedData, prevData)) {
        // If the new data is a duplicate, return the previous data to not update state
        return prevData;
      }

      return updatedData;
    });
  }, [isDataDuplicate]);

  // The method to retrieve the current data state
  const getData = useCallback(() => {
    return data;
  }, [data]);

  return (
    <DataHubContext.Provider value={{ data, setData: setUniqueData, getData }}>
      {children}
    </DataHubContext.Provider>
  );
};

export const useDataHub = (): DataHubContextType => {
  const context = useContext(DataHubContext);
  if (!context) {
    throw new Error('useDataHub must be used within a DataHubProvider');
  }
  return context;
};