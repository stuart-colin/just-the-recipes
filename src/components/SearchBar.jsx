import React from 'react';
import { Input } from "@/components/ui/input"; // Adjust path if your ui components are elsewhere

const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="w-full">
      <Input
        type="search"
        placeholder="Filter Recipes by title, author, tags, or ingredients..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)} />
    </div>
  );
};

export default SearchBar;
