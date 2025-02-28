// src/components/CardGrid.jsx
import React from 'react';
import CardItem from './CardItem';

const CardGrid = ({ 
  items, 
  onAction,
  actionLabel = "Add to Collection",
  loading = false,
  emptyMessage = "No items to display",
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={item.id || index} className="relative h-64">
          <CardItem card={item} />
          {onAction && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white">
              <button
                onClick={() => onAction(item)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CardGrid;