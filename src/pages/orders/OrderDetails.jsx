import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  FiChevronLeft,
  FiPrinter,
  FiMail,
  FiPackage,
  FiTruck,
  FiCheck,
  FiX,
  FiShoppingBag,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiLoader, // Added FiLoader
  FiAlertCircle // Added FiAlertCircle
} from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import * as api from '../../utils/api' // Import API utility

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate() // Not used yet, but good for future redirects
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

  const fetchOrderDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get(`/orders/${id}`)
      setOrder(data)
      setSelectedStatus(data.status) // Initialize selectedStatus with current order status
    } catch (err) {
      console.error('Failed to fetch order details:', err)
      setError(err)
      if (err.response && err.response.status === 404) {
        toast.error('Order not found.')
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch order details.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [id])
  
  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === order.status) {
      toast.info('Please select a new status.')
      return
    }
    setIsUpdatingStatus(true)
    try {
      await api.put(`/orders/${id}/status`, { status: selectedStatus })
      toast.success(`Order status updated to ${selectedStatus}`)
      fetchOrderDetails() // Refresh order details
    } catch (err) {
      console.error('Failed to update order status:', err)
      toast.error(err.response?.data?.message || 'Failed to update order status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }
  
  // Removed mock-data specific handlers: handleSendNotification, handleCancelOrder
  
  // Status badge color mapping (can be extended)
  const statusColors = {
    'Pending': 'badge-warning',
    'Processing': 'badge-info',
    'Shipped': 'badge-primary',
    'Delivered': 'badge-success',
    'Cancelled': 'badge-error',
  }
  
  // Loading UI
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-300 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            <div className="card">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto h-12 w-12 text-error-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          {error.response?.status === 404 ? 'Order Not Found' : 'Error Fetching Order'}
        </h2>
        <p className="text-gray-500 mt-2">
          {error.response?.status === 404 
            ? "The order you're looking for doesn't exist or has been removed."
            : error.response?.data?.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="mt-6 space-x-3">
          <Link to="/orders" className="btn btn-secondary inline-flex items-center">
            <FiChevronLeft className="mr-2 h-5 w-5" />
            Back to Orders
          </Link>
          {error.response?.status !== 404 && (
            <button onClick={fetchOrderDetails} className="btn btn-primary">
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!order) { // Should be covered by isLoading or error state, but as a fallback
    return <div className="text-center py-12">No order data available.</div>;
  }

  // Calculate total items price for subtotal display
  const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div>
      <PageHeader 
        title={`Order ${order._id}`} // Use _id
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Orders', link: '/orders' },
          { text: order._id } // Use _id
        ]}
        actionButton={
          <div className="flex flex-wrap gap-2">
            <Link to="/orders" className="btn btn-secondary inline-flex items-center">
              <FiChevronLeft className="mr-2 h-5 w-5" />
              Back to Orders
            </Link>
            <button 
              onClick={() => window.print()} // Basic print functionality
              className="btn btn-secondary inline-flex items-center"
            >
              <FiPrinter className="mr-2 h-5 w-5" />
              Print
            </button>
          </div>
        }
      />
      
      {/* Order Status and Update Section */}
      <div className="mb-6 card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
            <span className={`badge ${statusColors[order.status] || 'badge-secondary'} mt-1`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input w-auto"
              disabled={isUpdatingStatus}
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              {/* Add other statuses as needed by backend */}
            </select>
            <button 
              onClick={handleStatusUpdate}
              className="btn btn-primary"
              disabled={isUpdatingStatus || selectedStatus === order.status}
            >
              {isUpdatingStatus && <FiLoader className="animate-spin mr-2" />}
              Update Status
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.product._id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    <img 
                      src={item.product.image && item.product.image.length > 0 ? item.product.image[0] : 'https://via.placeholder.com/150'} 
                      alt={item.product.name?.en || 'Product Image'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <Link 
                      to={`/products/edit/${item.product._id}`} // Link to product edit page
                      className="text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {item.product.name?.en || 'Product Name N/A'}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
                      <span>SKU: {item.product.sku || 'N/A'}</span>
                      <span>Price: ${item.product.price?.toFixed(2) || '0.00'}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Totals */}
            <div className="border-t border-gray-200 mt-6 pt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Items Subtotal:</span>
                <span>${itemsSubtotal.toFixed(2)}</span>
              </div>
              {/* Shipping and Tax are not explicitly in OrderSchema, 
                  totalAmount is the final amount. Display as is. */}
              {/* <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Shipping:</span>
                <span>${(order.totalAmount - itemsSubtotal - (order.taxAmount || 0)).toFixed(2)}</span> 
              </div>
              {order.taxAmount && (
                <div className="flex justify-between text-sm text-gray-500 mb-3">
                  <span>Tax:</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
              )} */}
              <div className="flex justify-between font-medium text-gray-900">
                <span>Grand Total:</span>
                <span>${order.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          
          {/* Order History - Simplified or removed if not in schema */}
          {/* For now, this is removed as it was based on mock data structure */}
          {/* <div className="card"> ... Order History ... </div> */}

          {/* Order Notes - Simplified or removed if not in schema */}
          {/* <div className="card"> ... Order Notes ... </div> */}
          </div>
        </div>
        
        {/* Sidebar - Customer Info, Shipping, Payment */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Customer</h2>
              {/* Link to customer profile page if available */}
              {/* <Link to={`/customers/${order.user?._id}`} className="text-sm text-primary-600 hover:text-primary-700">
                View Profile
              </Link> */}
            </div>
            
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <FiUser className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                {/* Additional customer info if available, e.g., join date */}
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500 block">Email Address</span>
                <a href={`mailto:${order.user?.email}`} className="text-sm text-primary-600 hover:text-primary-700">
                  {order.user?.email || 'N/A'}
                </a>
              </div>
              {/* Phone number if available in user object */}
            </div>
          </div>
          
          {/* Shipping Details */}
          {order.shippingAddress && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                {/* Shipping status if available, e.g., from order.status or a dedicated shipping status field */}
              </div>
              <div className="space-y-3">
                <address className="text-sm text-gray-900 not-italic">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </address>
                {/* Tracking number if available */}
              </div>
            </div>
          )}
          
          {/* Payment Details */}
          {order.paymentInfo && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Payment</h2>
                <span className={`badge ${
                  order.paymentInfo.status === 'Paid' ? 'badge-success' : // Example status
                  order.paymentInfo.status === 'Pending' ? 'badge-warning' :
                  'badge-secondary'
                }`}>
                  {order.paymentInfo.status || 'N/A'}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 block">Payment Method</span>
                  <span className="text-sm text-gray-900">
                    {order.paymentInfo.method || 'N/A'}
                  </span>
                </div>
                {/* Transaction ID if available */}
                <div>
                  <span className="text-xs text-gray-500 block">Payment Date</span>
                  <span className="text-sm text-gray-900">
                    {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy, hh:mm a') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Amount</span>
                  <span className="text-sm text-gray-900 font-medium">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              {/* Refund button if applicable and API supports it */}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails