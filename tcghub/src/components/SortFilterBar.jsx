//src/components/SortFilterBar.jsx
import React from 'react';

const SortFilterBar = ({
  sortOptions,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderToggle,
  filterOptions,
  activeFilters,
  onFilterChange,
  onResetFilters,
  className = ""
}) => {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {/* Sort Controls - Top Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={onSortOrderToggle}
          className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
        
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Filters Grid */}
      {filterOptions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {filterOptions.map(filter => (
            <div key={filter.key}>
              {filter.type === 'range' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filter.minValue}
                      onChange={(e) => onFilterChange(`min${filter.key}`, e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filter.maxValue}
                      onChange={(e) => onFilterChange(`max${filter.key}`, e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  <select
                    value={activeFilters[filter.key]}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortFilterBar;