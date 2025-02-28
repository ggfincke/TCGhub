import React, { useState } from 'react';
import { useShop } from '../hooks/useShop';
import { useShoppingCart } from '../hooks/useShoppingCart';
import { useAuthentication } from '../hooks/useAuthentication';
import SearchBar from '../components/SearchBar';
import CartModal from '../components/CartModal';
import Modal from '../components/Modal';

function ShoppingPlatform() {
  const { user } = useAuthentication();
  const { shops, loading, error, searchInventory } = useShop();
  const { 
    cartItems, 
    loading: cartLoading, 
    error: cartError,
    addToCart,
    removeFromCart,
    updateQuantity,
    checkout,
    getCartTotal
  } = useShoppingCart();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);

  const filteredInventory = searchInventory(searchQuery);

  const handleCheckout = async () => {
    try {
      const result = await checkout(user.uid);
      setConfirmationDetails({
        orderId: result.did,
        expectedDelivery: result.arrival_date
      });
      setShowCart(false);
      setShowConfirmation(true);
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shop Inventory</h2>
        <button
          onClick={() => setShowCart(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 relative"
        >
          Cart ({cartItems.length})
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Search and Shop Selection */}
      <div className="mb-6 space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search cards or shops..."
        />

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedShop(null)}
            className={`px-4 py-2 rounded-lg ${
              !selectedShop ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            All Shops
          </button>
          {shops.map((shop) => (
            <button
              key={shop.name}
              onClick={() => setSelectedShop(shop)}
              className={`px-4 py-2 rounded-lg ${
                selectedShop?.name === shop.name 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
              }`}
            >
              {shop.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory
            .filter(item => !selectedShop || item.shop_name === selectedShop.name)
            .map((item, index) => (
              <div
                key={`${item.shop_name}-${item.cname}-${index}`}
                className="bg-white rounded-lg shadow-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{item.cname}</h4>
                  <span className="text-sm text-gray-500">{item.shop_name}</span>
                </div>
                <div className="text-lg font-bold text-blue-600 mb-2">
                  ${item.current_value?.toFixed(2)}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-gray-600">
                    In Stock: {item.card_quantity}
                  </span>
                  <button
                    onClick={() => user && addToCart(item)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    disabled={!user}
                  >
                    {user ? 'Add to Cart' : 'Login to Purchase'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        loading={cartLoading}
      />

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Order Confirmation"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold mb-2">Order Placed Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your order #{confirmationDetails?.orderId} has been confirmed.
            </p>
            <p className="text-gray-600 mb-4">
              Expected delivery: {confirmationDetails?.expectedDelivery}
            </p>
          </div>
          <button
            onClick={() => setShowConfirmation(false)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Continue Shopping
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ShoppingPlatform;