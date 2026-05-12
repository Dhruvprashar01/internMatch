import React, { useState } from "react";
import "./SearchBar.css";

const SearchBar = ({ placeholder = "Search...", onSearch, defaultValue = "" }) => {
  const [value, setValue] = useState(defaultValue);
  const handleSubmit = (e) => { e.preventDefault(); onSearch(value); };
  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <span className="search-icon">⌕</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && <button type="button" className="search-clear" onClick={() => { setValue(""); onSearch(""); }}>✕</button>}
    </form>
  );
};

export default SearchBar;
