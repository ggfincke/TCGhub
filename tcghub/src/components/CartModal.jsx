import React from 'react';
import Modal from '../components/Modal';

function CartModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemove, 
  onCheckout,
  loading 
}) {
  const total = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.current_value) * parseInt(item.quantity, 10)), 0
  );

  const handleQuantityChange = (item, change) => {
    const currentQty = parseInt(item.quantity, 10) || 0;
    const newQty = currentQty + change;
    
    // ensure quantity is between 1 and available stock
    if (newQty >= 1 && newQty <= item.card_quantity) {
      onUpdateQuantity(item, newQty);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shopping Cart"
    >
      <div className="space-y-4">
        {cartItems.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Your cart is empty</p>
        ) : (
          <>
            {cartItems.map((item, index) => (
              <div 
                key={`${item.shop_name}-${item.cid}-${index}`}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.cname}</h4>
                  <p className="text-sm text-gray-500">From: {item.shop_name}</p>
                  <p className="text-sm font-medium text-blue-600">
                    ${parseFloat(item.current_value).toFixed(2)} each
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item, -1)}
                      className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      disabled={parseInt(item.quantity, 10) <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">
                      {parseInt(item.quantity, 10)}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item, 1)}
                      className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      disabled={parseInt(item.quantity, 10) >= item.card_quantity}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold">
                  ${total.toFixed(2)}
                </span>
              </div>
              
              <button
                onClick={onCheckout}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default CartModal;