import { useState } from 'react'
import { FiSave, FiGlobe, FiDollarSign, FiTruck, FiMail, FiLock, FiLoader, FiAlertCircle } from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext' // Import useAuth
import * as api from '../../utils/api' // Import api utility

const Settings = () => {
  const { user: currentUser } = useAuth(); // Get current user for email

  const [settings, setSettings] = useState({
    storeName: 'My E-commerce Store',
    storeEmail: 'store@example.com',
    storePhone: '(555) 123-4567',
    storeAddress: '123 Main St, Anytown, ST 12345',
    currency: 'USD',
    timezone: 'America/New_York',
    orderPrefix: 'ORD-',
    lowStockThreshold: '5',
    shippingMethods: {
      standard: {
        enabled: true,
        name: 'Standard Shipping',
        price: '5.99',
        estimatedDays: '3-5'
      },
      express: {
        enabled: true,
        name: 'Express Shipping',
        price: '14.99',
        estimatedDays: '1-2'
      }
    },
    emailNotifications: {
      orderConfirmation: true,
      orderShipped: true,
      orderDelivered: true,
      lowStock: true
    }
  })
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.includes('.')) {
      // Handle nested objects (e.g., shippingMethods.standard.enabled)
      const [parent, child, prop] = name.split('.')
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent][child],
            [prop]: type === 'checkbox' ? checked : value
          }
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would make an API call
    toast.success('Settings updated successfully')
  }

  // State for Change Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordChangeError('');
    setPasswordChangeSuccess('');
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      setPasswordChangeError('All password fields are required.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!currentUser || !currentUser.email) {
        setPasswordChangeError('User email not found. Please re-login.');
        setIsChangingPassword(false);
        return;
      }
      await api.post('/auth/change-password', {
        email: currentUser.email,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordChangeSuccess('Password changed successfully!');
      toast.success('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' }); // Clear form
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.';
      setPasswordChangeError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Settings"
        subtitle="Configure your store settings and account details"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Settings' }
        ]}
      />
      
      {/* Existing settings form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="space-y-6">
          {/* Store Information Card */}
          <div className="card">
            <div className="flex items-center mb-4">
              <FiGlobe className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Store Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="storeName" className="form-label">Store Name</label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  className="form-input"
                  value={settings.storeName}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storeEmail" className="form-label">Store Email</label>
                <input
                  type="email"
                  id="storeEmail"
                  name="storeEmail"
                  className="form-input"
                  value={settings.storeEmail}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storePhone" className="form-label">Store Phone</label>
                <input
                  type="tel"
                  id="storePhone"
                  name="storePhone"
                  className="form-input"
                  value={settings.storePhone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storeAddress" className="form-label">Store Address</label>
                <input
                  type="text"
                  id="storeAddress"
                  name="storeAddress"
                  className="form-input"
                  value={settings.storeAddress}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* General Settings */}
          <div className="card">
            <div className="flex items-center mb-4">
              <FiDollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="currency" className="form-label">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  className="form-input"
                  value={settings.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="timezone" className="form-label">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  className="form-input"
                  value={settings.timezone}
                  onChange={handleChange}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="orderPrefix" className="form-label">Order Number Prefix</label>
                <input
                  type="text"
                  id="orderPrefix"
                  name="orderPrefix"
                  className="form-input"
                  value={settings.orderPrefix}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lowStockThreshold" className="form-label">Low Stock Threshold</label>
                <input
                  type="number"
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  className="form-input"
                  value={settings.lowStockThreshold}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Shipping Methods */}
          <div className="card">
            <div className="flex items-center mb-4">
              <FiTruck className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Shipping Methods</h2>
            </div>
            
            <div className="space-y-4">
              {/* Standard Shipping */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Standard Shipping</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="shippingMethods.standard.enabled"
                      checked={settings.shippingMethods.standard.enabled}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Method Name</label>
                    <input
                      type="text"
                      name="shippingMethods.standard.name"
                      className="form-input"
                      value={settings.shippingMethods.standard.name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="shippingMethods.standard.price"
                      className="form-input"
                      value={settings.shippingMethods.standard.price}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Estimated Days</label>
                    <input
                      type="text"
                      name="shippingMethods.standard.estimatedDays"
                      className="form-input"
                      value={settings.shippingMethods.standard.estimatedDays}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              {/* Express Shipping */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Express Shipping</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="shippingMethods.express.enabled"
                      checked={settings.shippingMethods.express.enabled}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Method Name</label>
                    <input
                      type="text"
                      name="shippingMethods.express.name"
                      className="form-input"
                      value={settings.shippingMethods.express.name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="shippingMethods.express.price"
                      className="form-input"
                      value={settings.shippingMethods.express.price}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Estimated Days</label>
                    <input
                      type="text"
                      name="shippingMethods.express.estimatedDays"
                      className="form-input"
                      value={settings.shippingMethods.express.estimatedDays}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Email Notifications */}
          <div className="card">
            <div className="flex items-center mb-4">
              <FiMail className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Email Notifications</h2>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications.orderConfirmation"
                  checked={settings.emailNotifications.orderConfirmation}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Order confirmation emails</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications.orderShipped"
                  checked={settings.emailNotifications.orderShipped}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Order shipped emails</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications.orderDelivered"
                  checked={settings.emailNotifications.orderDelivered}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Order delivered emails</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailNotifications.lowStock"
                  checked={settings.emailNotifications.lowStock}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Low stock alerts</span>
              </label>
            </div>
          </div>
          
          {/* Save Button for general settings */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
            >
              <FiSave className="mr-2 h-5 w-5" />
              Save General Settings
            </button>
          </div>
        </div>
      </form>

      {/* Change Password Form */}
      <div className="card mt-8">
        <div className="flex items-center mb-4">
          <FiLock className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
        </div>

        {passwordChangeError && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>{passwordChangeError}</span>
          </div>
        )}
        {passwordChangeSuccess && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 border border-green-400 rounded-md">
            {passwordChangeSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit}>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="oldPassword" className="form-label">Current Password</label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                className="form-input"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="form-input"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                className="form-input"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary inline-flex items-center"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <FiLoader className="animate-spin mr-2 h-5 w-5" />
                ) : (
                  <FiLock className="mr-2 h-5 w-5" />
                )}
                Change Password
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings