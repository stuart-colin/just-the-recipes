import { useState } from 'react';

/**
 * Custom hook to manage a dynamic list of strings.
 * @param {string[]} initialList - The initial list of items.
 * @returns {{list: string[], newItem: string, setNewItem: Function, addItem: Function, removeItem: Function}}
 */
export function useDynamicList(initialList = []) {
  const [list, setList] = useState(initialList);
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      setList(prevList => [...prevList, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (indexToRemove) => {
    setList(prevList => prevList.filter((_, index) => index !== indexToRemove));
  };

  // It's important to also return a way to set the list directly if the parent component needs to reset it
  // or load it from an existing recipe.
  const updateList = (newList) => {
    setList(newList || []);
  };

  return { list, newItem, setNewItem, addItem, removeItem, updateList };
}