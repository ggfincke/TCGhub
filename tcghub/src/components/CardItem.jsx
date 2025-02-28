// src/components/CardItem.jsx
import React from 'react';

const CardItem = ({ card, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow h-64 flex flex-col ${className}`}>
      <div className="bg-gray-50 border-b p-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-gray-800">{card.cname}</h3>
          <span className="text-sm font-medium text-gray-500">#{card.cid}</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Set:</span>
            <span className="font-medium">{card.expansion}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Rarity:</span>
            <span className={`font-medium ${
              card.rarity === 'Mythic Rare' ? 'text-red-600' :
              card.rarity === 'Rare' ? 'text-yellow-600' :
              card.rarity === 'Uncommon' ? 'text-gray-500' :
              'text-gray-400'
            }`}>
              {card.rarity}
            </span>
          </div>
          {card.type && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Type:</span>
              <span className="font-medium">{card.type}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600 mt-auto">
            <span>Price:</span>
            <span className="font-bold text-blue-600">
              ${typeof card.current_value === 'number' ? card.current_value.toFixed(2) : card.current_value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardItem;