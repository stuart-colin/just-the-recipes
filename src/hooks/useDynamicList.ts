import { useState, Dispatch, SetStateAction } from 'react';

export function useDynamicList(initialList: string[] = []) {
  const [list, setList] = useState<string[]>(initialList);
  const [newItem, setNewItem] = useState<string>('');

  const addItem = () => {
    if (newItem.trim()) {
      setList(prevList => [...prevList, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (indexToRemove: number) => {
    setList(prevList => prevList.filter((_, index) => index !== indexToRemove));
  };

  const updateList = (newList: string[] = []) => {
    setList(newList);
  };

  return {
    list,
    newItem,
    setNewItem: setNewItem as Dispatch<SetStateAction<string>>,
    addItem,
    removeItem,
    updateList,
  };
}