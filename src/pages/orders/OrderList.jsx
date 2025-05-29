import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  FiPackage, 
  FiFilter, 
  FiDownload,
  FiEye,
  FiTruck,
  FiX,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import SearchFilter from '../../components/ui/SearchFilter'
import EmptyState from '../../components/ui/EmptyState'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import * as api from '../../utils/api' // Import API utility

const OrderList = () => {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [error, setError] = useState(null)
  
  // Get status from URL params
  const statusParam = searchParams.get('status')

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get('/orders')
      setOrders(data)
      // Apply client-side filtering if statusParam exists
      if (statusParam) {
        const normalizedStatusParam = statusParam.toLowerCase();
        setFilteredOrders(data.filter(order => order.status.toLowerCase() === normalizedStatusParam))
      } else {
        setFilteredOrders(data)
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err)
      setError(err)
      toast.error(err.response?.data?.message || 'Failed to fetch orders.')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders()
  }, [statusParam]) // Refetch when statusParam changes
  
  // Handle search and filter
  const handleSearch = (query, filters) => {
    let results = [...orders] // Start with all orders
    
    // Search by order ID, customer name, or email
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(order => 
        order._id.toLowerCase().includes(lowerQuery) || 
        (order.user?.name && order.user.name.toLowerCase().includes(lowerQuery)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(lowerQuery))
      )
    }
    
    // Apply status filter from SearchFilter component
    if (filters.status) {
      results = results.filter(order => order.status === filters.status)
    }
    
    // Apply payment filter (Note: paymentStatus is not directly in OrderSchema, this might need adjustment)
    // If paymentStatus is derived or part of a populated field, adjust access accordingly.
    // For now, this filter might not work as expected if `order.paymentStatus` is not available.
    if (filters.paymentStatus) { 
      results = results.filter(order => order.paymentStatus === filters.paymentStatus) 
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      results = results.filter(order => new Date(order.createdAt) >= fromDate)
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of the day
      results = results.filter(order => new Date(order.createdAt) <= toDate)
    }
    
    if (filters.minTotal) {
      results = results.filter(order => order.totalAmount >= parseFloat(filters.minTotal))
    }
    
    if (filters.maxTotal) {
      results = results.filter(order => order.totalAmount <= parseFloat(filters.maxTotal))
    }
    
    setFilteredOrders(results)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id)) // Use _id
    }
    setSelectAll(!selectAll)
  }
  
  // Handle individual select
  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
      setSelectAll(false)
    } else {
      setSelectedOrders([...selectedOrders, orderId])
      if (selectedOrders.length + 1 === filteredOrders.length) {
        setSelectAll(true)
      }
    }
  }
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected')
      return
    }
    
    let newStatus = ''
    let message = ''

    switch (action) {
      case 'process': newStatus = 'Processing'; break;
      case 'ship': newStatus = 'Shipped'; break;
      case 'deliver': newStatus = 'Delivered'; break;
      case 'cancel': newStatus = 'Cancelled'; break;
      case 'export':
        // Handle export logic (client-side for now)
        toast.info(`${selectedOrders.length} orders exported (simulated)`)
        setSelectedOrders([])
        setSelectAll(false)
        return;
      default:
        toast.error('Invalid action')
        return;
    }

    message = `${selectedOrders.length} orders marked as ${newStatus.toLowerCase()}`
    
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        selectedOrders.map(orderId => api.put(`/orders/${orderId}/status`, { status: newStatus }))
      )
      toast.success(message)
      fetchOrders() // Refresh the list
    } catch (err) {
      console.error(`Failed to update orders to ${newStatus}:`, err)
      toast.error(err.response?.data?.message || `Failed to update orders.`)
    } finally {
      setIsBulkUpdating(false)
      setSelectedOrders([])
      setSelectAll(false)
    }
  }
  
  // Filter configurations - adjust 'payment' to 'paymentStatus' if that's the intended field name
  const filterOptions = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [ // These should match the possible status values from backend
        { value: 'Pending', label: 'Pending' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Shipped', label: 'Shipped' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: 'On Hold', label: 'On Hold'},
        { value: 'Awaiting Payment', label: 'Awaiting Payment'},
        { value: 'Payment Failed', label: 'Payment Failed'},
        { value: 'Refunded', label: 'Refunded'},
        { value: 'Partially Refunded', label: 'Partially Refunded'}
      ]
    },
    // { // Removing payment filter as it's not directly in OrderSchema
    //   name: 'paymentStatus', 
    //   label: 'Payment Status',
    //   type: 'select',
    //   options: [
    //     { value: 'Paid', label: 'Paid' },
    //     { value: 'Pending', label: 'Pending' },
    //     { value: 'Failed', label: 'Failed' },
    //     { value: 'Refunded', label: 'Refunded' },
    //   ]
    // },
    {
      name: 'dateFrom',
      label: 'Date From',
      type: 'date',
    },
    {
      name: 'dateTo',
      label: 'Date To',
      type: 'date',
    },
    {
      name: 'minTotal',
      label: 'Min Total',
      type: 'number',
      placeholder: '0.00',
    },
    {
      name: 'maxTotal',
      label: 'Max Total',
      type: 'number',
      placeholder: '1000.00',
    }
  ]
  
  // Status badge color mapping
  const statusColors = {
    'Pending': 'badge-warning',
    'Processing': 'badge-info',
    'Shipped': 'badge-info',
    'Delivered': 'badge-success',
    'Cancelled': 'badge-error',
  }
  
  return (
    <div>
      <PageHeader 
        title="Orders"
        subtitle="Manage and process customer orders"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Orders' }
        ]}
        actionButton={
          <button 
            onClick={() => handleBulkAction('export')}
            className="btn btn-secondary inline-flex items-center"
          >
            <FiDownload className="mr-2 h-5 w-5" />
            Export Orders
          </button>
        }
      />
      
      {/* Status Tabs */}
      <div className="flex mb-6 overflow-x-auto pb-2">
        <Link 
          to="/orders"
          className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium ${
            !statusParam 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Orders
        </Link>
        <Link 
          to="/orders?status=pending"
          className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium ${
            statusParam === 'pending' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Pending
        </Link>
        <Link 
          to="/orders?status=processing"
          className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium ${
            statusParam === 'processing' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Processing
        </Link>
        <Link 
          to="/orders?status=shipped"
          className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium ${
            statusParam === 'shipped' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Shipped
        </Link>
        <Link 
          to="/orders?status=delivered"
          className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium ${
            statusParam === 'delivered' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Delivered
        </Link>
        <Link 
          to="/orders?status=cancelled"
          className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium ${
            statusParam === 'cancelled' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Cancelled
        </Link>
      </div>
      
      {/* Search & Filters */}
      <div className="card mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          placeholder="Search orders by ID, customer name, or email..."
          filters={filterOptions}
        />
      </div>
      
      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center mb-4 p-3 bg-primary-50 rounded-md animate-fade-in">
          <span className="text-sm font-medium text-primary-700 mr-4">
            {selectedOrders.length} orders selected
          </span>
          <div className="space-x-2">
            <button 
              onClick={() => handleBulkAction('process')}
              className="btn btn-warning text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : null} Process
            </button>
            <button 
              onClick={() => handleBulkAction('ship')}
              className="btn btn-info text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : <FiTruck className="mr-1 h-4 w-4" />} Ship
            </button>
            <button 
              onClick={() => handleBulkAction('deliver')}
              className="btn btn-success text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : null} Mark Delivered
            </button>
            <button 
              onClick={() => handleBulkAction('cancel')}
              className="btn btn-danger text-sm py-1"
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : <FiX className="mr-1 h-4 w-4" />}
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Orders List */}
      <div className="card">
        {isLoading ? (
          // Loading State
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        ) : error ? (
          <EmptyState 
            title="Error Fetching Orders"
            description={error.response?.data?.message || "An unexpected error occurred. Please try again later."}
            icon={<FiAlertCircle className="h-8 w-8 text-error-500" />}
            actionButton={
              <button onClick={fetchOrders} className="btn btn-primary">
                Retry
              </button>
            }
          />
        ) : filteredOrders.length === 0 ? (
          // Empty State
          <EmptyState 
            title="No orders found"
            description={
              statusParam 
                ? `No orders with status "${statusParam}" found.` 
                : "No orders found. They will appear here once customers place orders."
            }
            icon={<FiPackage className="h-8 w-8" />}
          />
        ) : (
          // Orders Table
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {/* <th className="px-4 py-3 text-left">Payment</th> Removed as not in schema */}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50"> {/* Use _id */}
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)} // Use _id
                          onChange={() => handleSelectOrder(order._id)} // Use _id
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/orders/${order._id}`} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                        {order._id} {/* Use _id */}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{order.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.user?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'hh:mm a')}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                      ${order.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      {order.items?.length || 0}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`badge ${statusColors[order.status] || 'badge-secondary'}`}>
                        {order.status}
                      </span>
                    </td>
                    {/* <td className="px-4 py-4 text-sm text-gray-500">{order.paymentStatus || 'N/A'}</td> Removed */}
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <Link to={`/orders/${order._id}`} className="text-primary-600 hover:text-primary-900"> {/* Use _id */}
                        <FiEye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOrders.length}</span> of{" "}
                  <span className="font-medium">{orders.length}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="btn btn-secondary py-1"
                  disabled
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary py-1"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderList