import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiUser, 
  FiMail, 
  FiPhone,
  FiMapPin,
  FiShoppingBag,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiLoader, // Added
  FiAlertCircle // Added
} from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import SearchFilter from '../../components/ui/SearchFilter'
import EmptyState from '../../components/ui/EmptyState'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import * as api from '../../utils/api' // Import API utility

const CustomerList = () => {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(null) // For individual delete loading
  const [isBulkDeleting, setIsBulkDeleting] = useState(false) // For bulk delete loading
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [error, setError] = useState(null)

  const fetchCustomers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get('/users') // Assuming endpoint is /users
      // Filter out admins if needed, or handle roles appropriately
      // For now, displaying all users as "customers"
      setCustomers(data)
      setFilteredCustomers(data)
    } catch (err) {
      console.error("Failed to fetch customers:", err)
      setError(err)
      toast.error(err.response?.data?.message || 'Failed to fetch customers.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])
  
  // Handle search and filter
  const handleSearch = (query, filters) => { // filters are now empty
    let results = [...customers]
    
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(lowerQuery)) || 
        (customer.email && customer.email.toLowerCase().includes(lowerQuery))
      )
    }
    // No more advanced filters for now based on simplified schema
    setFilteredCustomers(results)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer._id)) // Use _id
    }
    setSelectAll(!selectAll)
  }
  
  // Handle individual select
  const handleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
      setSelectAll(false)
    } else {
      setSelectedCustomers([...selectedCustomers, customerId])
      if (selectedCustomers.length + 1 === filteredCustomers.length) {
        setSelectAll(true)
      }
    }
  }
  
  // Handle customer deletion
  const handleDeleteCustomer = async (customerId) => {
    setIsDeleting(customerId)
    try {
      await api.del(`/users/${customerId}`)
      toast.success('Customer deleted successfully')
      fetchCustomers() // Refresh list
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    } catch (err) {
      console.error("Failed to delete customer:", err)
      toast.error(err.response?.data?.message || 'Failed to delete customer.')
    } finally {
      setIsDeleting(null)
    }
  }
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedCustomers.length === 0) {
      toast.error('No customers selected')
      return
    }
    
    if (action === 'delete') {
      setIsBulkDeleting(true)
      try {
        await Promise.all(selectedCustomers.map(id => api.del(`/users/${id}`)))
        toast.success(`${selectedCustomers.length} customers deleted successfully`)
        fetchCustomers() // Refresh list
        setSelectedCustomers([])
        setSelectAll(false)
      } catch (err) {
        console.error("Failed to delete customers:", err)
        toast.error(err.response?.data?.message || 'Failed to delete customers in bulk.')
      } finally {
        setIsBulkDeleting(false)
      }
    } else if (action === 'export') {
      // Placeholder for export logic
      toast.info(`${selectedCustomers.length} customers exported (simulated)`)
      setSelectedCustomers([])
      setSelectAll(false)
    }
  }
  
  // Filter configurations - Simplified
  const filterOptions = [] // No filters for now as per schema simplification

  return (
    <div>
      <PageHeader 
        title="Customers"
        subtitle="Manage your customer base"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Customers' }
        ]}
        actionButton={
          <Link to="/customers/add" className="btn btn-primary inline-flex items-center">
            <FiPlus className="mr-2 h-5 w-5" />
            Add Customer
          </Link>
        }
      />
      
      {/* Search & Filters */}
      <div className="card mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          placeholder="Search customers by name or email..."
          filters={filterOptions}
        />
      </div>
      
      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="flex items-center mb-4 p-3 bg-primary-50 rounded-md animate-fade-in">
          <span className="text-sm font-medium text-primary-700 mr-4">
            {selectedCustomers.length} customers selected
          </span>
          <div className="space-x-2">
            <button 
              onClick={() => handleBulkAction('export')}
              className="btn btn-secondary text-sm py-1"
              disabled={isBulkDeleting}
            >
              Export
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="btn btn-danger text-sm py-1"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <FiLoader className="animate-spin mr-1 h-4 w-4" /> : <FiTrash2 className="mr-1 h-4 w-4" />}
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Customers List */}
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
            title="Error Fetching Customers"
            description={error.response?.data?.message || "An unexpected error occurred. Please try again."}
            icon={<FiAlertCircle className="h-8 w-8 text-error-500" />}
            actionButton={
              <button onClick={fetchCustomers} className="btn btn-primary">
                Retry
              </button>
            }
          />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState 
            title="No customers found"
            description="No customers match your current search criteria or none have been added yet."
            icon={<FiUser className="h-8 w-8" />}
            actionLink="/customers/add" // This link assumes an add customer page exists
            actionText="Add New Customer"
          />
        ) : (
          // Customers Table
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
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  {/* Removed other columns like Location, Orders, Spent, Last Order, Status */}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50"> {/* Use _id */}
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)} // Use _id
                          onChange={() => handleSelectCustomer(customer._id)} // Use _id
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <FiUser className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <Link 
                            to={`/customers/${customer._id}`} // Use _id
                            className="text-sm font-medium text-gray-900 hover:text-primary-600"
                          >
                            {customer.name || 'N/A'}
                          </Link>
                          <p className="text-xs text-gray-500">
                            ID: {customer._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="flex items-center text-gray-500">
                          <FiMail className="h-4 w-4 mr-1" />
                          {customer.email || 'N/A'}
                        </div>
                        {/* Phone removed as per schema */}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="h-4 w-4 mr-1" />
                        {customer.createdAt ? format(new Date(customer.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </td>
                    {/* Removed other data cells */}
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          to={`/customers/edit/${customer._id}`} // Use _id
                          className="text-gray-600 hover:text-primary-600"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)} // Use _id
                          className="text-gray-600 hover:text-error-500 disabled:opacity-50"
                          disabled={isDeleting === customer._id}
                        >
                          {isDeleting === customer._id ? <FiLoader className="animate-spin h-5 w-5" /> : <FiTrash2 className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            
            </table>
            
            {/* Pagination */}
            <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCustomers.length}</span> of{" "}
                  <span className="font-medium">{customers.length}</span> results
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

export default CustomerList