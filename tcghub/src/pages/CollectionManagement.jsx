// src/pages/CollectionManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useCollectionManagement } from '../hooks/useCollectionManagement';
import { useCardSearch } from '../hooks/useCardSearch';
import SearchBar from '../components/SearchBar';
import SortFilterBar from '../components/SortFilterBar';
import CardGrid from "../components/CardGrid";
import Modal from "../components/Modal";

function CollectionManagement() {
  const {
    collections,
    selectedCollectionIndex,
    setSelectedCollectionIndex,
    addCollection,
    editCollection,
    deleteCollection,
    addCard,
    deleteCard,
    getCurrentCollection,
    loading: collectionLoading,
    error: collectionError,
    updateCardQuantity,
    fetchCollectionCards
  } = useCollectionManagement();

  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    sorting,
    updateSorting,
    toggleSortOrder,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    filterOptions,
    sortOptions
  } = useCardSearch();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editedCollectionName, setEditedCollectionName] = useState('');

  const handleAddCollection = async () => {
    console.log('Attempting to add collection:', newCollectionName);
    try {
      const result = await addCollection(newCollectionName);
      console.log('Add collection result:', result);
      
      if (result) {
        setNewCollectionName('');
        setShowAddModal(false);
      } else {
        console.error('Failed to add collection - no error thrown but operation failed');
      }
    } catch (error) {
      console.error('Error adding collection:', error);
    }
  };

  const handleEditCollection = async () => {
    console.log('Attempting to edit collection:', {
      index: selectedCollectionIndex,
      newName: editedCollectionName
    });
    try {
      await editCollection(selectedCollectionIndex, editedCollectionName);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error editing collection:', error);
    }
  };

  const handleDeleteCollection = async () => {
    
    console.log('Attempting to delete collection:', selectedCollectionIndex);
    try {
      await deleteCollection(selectedCollectionIndex);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const handleUpdateQuantity = (cardId, newQuantity) => {
    const currentCollection = getCurrentCollection();
    if (newQuantity > 0) {
      updateCardQuantity(selectedCollectionIndex, cardId, newQuantity);
    }
  };

  const handleAddCard = (card) => {
    const currentCollection = getCurrentCollection();
    if (currentCollection?.colid) {
      addCard(currentCollection.colid, card);
    } else {
      console.error('No collection selected or invalid collection');
    }
  };
  

  const resetFilters = () => {
    Object.keys(filters).forEach(key => updateFilter(key, 'all'));
  };

  // Add useEffect to fetch cards when collection changes
  useEffect(() => {
    const currentCollection = getCurrentCollection();
    if (currentCollection?.colid) {
      fetchCollectionCards();
    }
  }, [selectedCollectionIndex]);

  const isWishlist = getCurrentCollection()?.collection_type === 'Wishlist';

  return (
    <div className="p-4">
      {/* Collection Controls */}
      <div className="flex justify-between items-center mb-6">
        <select
          value={selectedCollectionIndex}
          onChange={(e) => setSelectedCollectionIndex(Number(e.target.value))}
          className="px-4 py-2 border rounded-lg w-64"
        >
          {collections.map((collection, index) => (
            <option key={index} value={index}>
              {collection.colname} 
              {collection.collection_type === 'Wishlist' ? ' (Wishlist)' : ''}
            </option>
          ))}
        </select>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Add Collection
          </button>
          <button
            onClick={() => {
              setEditedCollectionName(getCurrentCollection()?.colname);
              setShowEditModal(true);
            }}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${
              isWishlist ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isWishlist}
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ${
              isWishlist ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isWishlist}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Search and Sort Section */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search for cards to add..."
        />
        {searchQuery && (
          <div className="mt-4">
            <SortFilterBar
              sortOptions={sortOptions}
              sortBy={sorting.sortBy}
              onSortChange={updateSorting}
              sortOrder={sorting.sortOrder}
              onSortOrderChange={toggleSortOrder}
              filterOptions={filterOptions}
              activeFilters={filters}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              loading={searchLoading}
              error={searchError}
            />
          </div>
        )}
      </div>

      {/* Search Results or Collection Display */}
      {searchQuery ? (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Search Results</h3>
          <CardGrid
            items={searchResults}
            loading={searchLoading}
            onAction={handleAddCard}
            actionLabel="Add to Collection"
            emptyMessage="No cards found"
          />
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Collection</h3>
          {collectionLoading ? (
            <p>Loading...</p>
          ) : collectionError ? (
            <p className="text-red-500">{collectionError}</p>
          ) : getCurrentCollection()?.cards?.length === 0 ? (
            <p className="text-gray-600">No cards in your collection yet.</p>
          ) : (
            <ul className="space-y-2">
              {getCurrentCollection()?.cards?.map((card, index) => (
                <li
                  key={`${card.cid}-${index}`}
                  className="flex justify-between items-center bg-white shadow-md p-4 rounded-lg"
                >
                  <div>
                    <p className="text-lg font-medium">
                      {card.name || card.cname || 'Unnamed Card'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Rarity: {card.rarity || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expansion: {card.expansion || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(card.cid, (card.quantity || 1) - 1)}
                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{card.quantity || 1}</span>
                      <button
                        onClick={() => handleUpdateQuantity(card.cid, (card.quantity || 1) + 1)}
                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => deleteCard(getCurrentCollection().colid, card.cid)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Collection">
        <input
          type="text"
          placeholder="Collection Name"
          value={newCollectionName}
          onChange={(e) => {
            console.log('New collection name:', e.target.value);
            setNewCollectionName(e.target.value);
          }}
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCollection}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Add
          </button>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Collection">
        <input
          type="text"
          placeholder="Collection Name"
          value={editedCollectionName}
          onChange={(e) => setEditedCollectionName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowEditModal(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleEditCollection}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Collection">
        <p className="mb-4">Are you sure you want to delete "{getCurrentCollection()?.name}"?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteCollection}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Display any errors */}
      {collectionError && (
        <div className="text-red-500 mt-2">
          Error: {collectionError}
        </div>
      )}
    </div>
  );
}

export default CollectionManagement;