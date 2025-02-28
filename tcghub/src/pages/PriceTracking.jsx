import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useCardSearch } from '../hooks/useCardSearch';
import SearchBar from '../components/SearchBar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const calculatePriceStats = (priceData) => {
  if (!priceData || priceData.length < 2) return null;
  
  const sortedData = [...priceData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstPrice = sortedData[0].value;
  const lastPrice = sortedData[sortedData.length - 1].value;
  const highestPrice = Math.max(...sortedData.map(d => d.value));
  const lowestPrice = Math.min(...sortedData.map(d => d.value));
  
  const totalChange = lastPrice - firstPrice;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const volatility = ((highestPrice - lowestPrice) / firstPrice) * 100;

  return {
    currentPrice: lastPrice,
    highestPrice,
    lowestPrice,
    totalChange,
    percentChange,
    volatility
  };
};

function PriceTracking() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    results: searchResults,
    loading: searchLoading,
    error: searchError
  } = useCardSearch();

  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!selectedCard) return;

      try {
        setPriceLoading(true);
        const response = await fetch(`${API_URL}/cards/${selectedCard.cid}/prices/history`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch price history');
        }

        const data = await response.json();
        setPriceData(data);
      } catch (error) {
        console.error('Price history fetch error:', error);
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPriceHistory();
  }, [selectedCard]);

  const priceStats = calculatePriceStats(priceData);

  const chartData = {
    labels: priceData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: selectedCard?.cname || 'Select a card',
        data: priceData.map(item => item.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true,
        text: 'Card Price History'
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price ($)'
        },
        ticks: {
          callback: (value) => `$${value.toFixed(2)}`
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  const loading = searchLoading || priceLoading;

  return (
    <div className="p-4">
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search for a card..."
        />
        {searchQuery && searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(card => (
              <div
                key={`${card.cname}-${card.cid}`}
                onClick={() => {
                  setSelectedCard(card);
                  setSearchQuery('');
                }}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{card.cname}</div>
                  <div className="text-sm text-gray-500">
                    {card.set} • {card.rarity}
                  </div>
                </div>
                <div className="font-bold">
                  ${card.current_value?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCard && priceStats && (
        <div className="mb-4 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedCard.cname}</h2>
                <p className="text-gray-600">
                  {selectedCard.set} • {selectedCard.rarity}
                </p>
              </div>
              <div className="text-xl font-bold">
                ${priceStats.currentPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Price Change</h3>
              <div className={`text-lg font-bold ${priceStats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceStats.totalChange >= 0 ? '+' : ''}${priceStats.totalChange.toFixed(2)}
                <span className="text-sm ml-1">
                  ({priceStats.percentChange >= 0 ? '+' : ''}{priceStats.percentChange.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Price Range</h3>
              <div className="text-lg font-bold">
                ${priceStats.lowestPrice.toFixed(2)} - ${priceStats.highestPrice.toFixed(2)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Volatility</h3>
              <div className="text-lg font-bold">
                {priceStats.volatility.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      ) : searchError ? (
        <div className="text-red-500 text-center">{searchError}</div>
      ) : !selectedCard ? (
        <div className="text-center text-gray-600 h-64 flex items-center justify-center">
          Search and select a card to view price history
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default PriceTracking;