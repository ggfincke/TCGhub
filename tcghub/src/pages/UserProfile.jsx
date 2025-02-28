// src/pages/UserProfile.jsx
import React, { useState } from 'react';
import { useAuthentication } from '../hooks/useAuthentication';
import { useCollectionManagement } from '../hooks/useCollectionManagement';
import { useOrders } from '../hooks/useOrders';
import { useModal } from '../hooks/useModal';
import { LoginForm } from '../components/LoginForm';
import { EditProfileForm } from '../components/EditProfileForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function UserProfile() {
  const {
    user,
    logout,
    login,
    register,
    updateUserProfile,
    updateBio,
    isAuthenticated,
    loading: authLoading,
    error: authError
  } = useAuthentication();

  const { collections = [] } = useCollectionManagement();
  const { isOpen, open, close } = useModal();
  const { orders, loading: ordersLoading } = useOrders(user?.uid);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  const handleCreateAccount = async (formData) => {
    try {
      setRegistrationError(null);
      await register({
        username: formData.username,
        password: formData.password,
        bio: formData.bio || '',
        birthday: null
      });
      setShowCreateAccount(false);
    } catch (error) {
      setRegistrationError(error.message);
      console.error('Account creation failed:', error);
    }
  };

  const handleLoginSuccess = async (credentials) => {
    try {
      await login({
        username: credentials.username,
        password: credentials.password
      });
      setShowLoginForm(false);
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      if (formData.bio !== user.bio) {
        await updateBio(formData.bio);
      }
      if (formData.username !== user.username) {
        await updateUserProfile({ username: formData.username });
      }
      close();
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const totalCards = (collections || []).reduce((sum, collection) => {
    if (!collection.cards) return sum;
    return sum + collection.cards.length;
  }, 0);

  if (authLoading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <div className="space-x-2">
          {isAuthenticated ? (
            <>
              <button
                onClick={open}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setShowCreateAccount(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Create Account
              </button>
              <button
                onClick={() => setShowLoginForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between mb-6">
              <h2 className="text-3xl font-bold">Create Account</h2>
              <button 
                onClick={() => setShowCreateAccount(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            {registrationError && (
              <div className="mb-4 text-red-500">{registrationError}</div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = {
                username: e.target.username.value,
                password: e.target.password.value,
                confirmPassword: e.target.confirmPassword.value,
                bio: e.target.bio.value,
                birthday: null
              };

              // Client-side validation
              if (formData.password !== formData.confirmPassword) {
                setRegistrationError("Passwords don't match");
                return;
              }

              if (formData.password.length < 8) {
                setRegistrationError("Password must be at least 8 characters long");
                return;
              }

              handleCreateAccount(formData);
            }} className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-lg"
                  required
                  minLength={3}
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-lg"
                  required
                  minLength={8}
                  placeholder="Choose a password"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-lg"
                  required
                  minLength={8}
                  placeholder="Confirm your password"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-lg"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 text-lg font-medium mt-4"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoginForm 
            onSuccess={handleLoginSuccess}
            onClose={() => setShowLoginForm(false)}
          />
        </div>
      )}

      {/* Main Content */}
      {isAuthenticated ? (
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-start space-x-6">
              <img 
                src={user.avatar || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="w-32 h-32 rounded-full shadow-lg"
              />
              <div className="flex-1">
                <div className="flex items-baseline space-x-3">
                  <h3 className="text-2xl font-semibold">{user.username}</h3>
                </div>
                <p className="mt-3 text-gray-700 text-base">
                  {user.bio || 'No bio provided yet'}
                </p>
                <p className="text-gray-600 text-sm mt-2">ID: {user.uid}</p>
                
                <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Collections</div>
                    <div className="mt-1 text-2xl font-semibold text-blue-600">
                      {(collections || []).length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Cards</div>
                    <div className="mt-1 text-2xl font-semibold text-blue-600">
                      {totalCards}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Order History</h3>
            {ordersLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : orders?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {orders?.map((order) => (
                  <div
                    key={order.did}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">Order #{order.did}</h4>
                        <p className="text-sm text-gray-500">
                          Ordered: {new Date(order.shipping_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Expected: {new Date(order.arrival_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Items</h5>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm"
                          >
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500 ml-2">
                                from {item.shop_name}
                              </span>
                            </div>
                            <span className="font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Order Total</span>
                      <span className="font-bold">
                        ${order.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          Please login or create an account to continue
        </div>
      )}

      {/* Edit Profile Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EditProfileForm 
            initialData={{
              username: user.username,
              bio: user.bio
            }}
            onSuccess={handleUpdateProfile}
            onClose={close}
          />
        </div>
      )}
    </div>
  );
}

export default UserProfile;