import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from "react";

function useAsyncStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  useEffect(() => {
    async function loadStoredValue() {
      try {
        const item = await AsyncStorage.getItem("solar-wire@" + key);
        const value = item ? JSON.parse(item) : defaultValue;
        setStoredValue(value);
      } catch (error) {
        setStoredValue(defaultValue);
      }
    }

    loadStoredValue();
  }, [key, defaultValue]);

  const update = useCallback(async(value: T) => {
    try {
      await AsyncStorage.setItem("solar-wire@" + key, JSON.stringify(value));
    } catch (error) {
      console.error("Erro ao salvar no AsyncStorage", error);
    }
  }, [AsyncStorage]);

  const setValue = useCallback((value: T | ((value: T) => T)) => {
    setStoredValue((storedValue) => {
      if(value instanceof Function) {
        const newValue = value(storedValue);
        update(newValue);
        return newValue;
      } else {
        update(value);
        return value;
      };
    });
  }, [AsyncStorage, setStoredValue, update]);

  return [storedValue, setValue] as [T, (value: T | ((value: T) => T)) => void];
};

export default useAsyncStorage;