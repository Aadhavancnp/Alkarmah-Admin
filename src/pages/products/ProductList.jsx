import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiShoppingBag,
  FiEye,
  FiAlertCircle,
  FiCheck,
  FiShoppingCart as FiCart,
  FiHeart // Imported FiHeart for wishlist
} from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import SearchFilter from '../../components/ui/SearchFilter'
import EmptyState from '../../components/ui/EmptyState'
import { toast } from 'react-toastify'
import * as api from '../../utils/api'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext' // Import useWishlist

const ProductList = () => {
  const { addToCart, isLoadingCart } = useCart();
  const { 
    addToWishlist, 
    removeFromWishlist, 
    isProductInWishlist,
    isLoadingWishlist // To disable button during global wishlist operations
  } = useWishlist(); // Consume WishlistContext

  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [addingToCart, setAddingToCart] = useState(null);
  const [togglingWishlist, setTogglingWishlist] = useState(null); // For individual wishlist button loading
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState([]) 
  const [selectAll, setSelectAll] = useState(false) 
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get('/products');
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err);
        toast.error('Failed to fetch products.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    setAddingToCart(productId); // Set loading state for this specific button
    try {
      await addToCart(productId, 1); // Add 1 quantity
      toast.success('Product added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add product to cart.');
    } finally {
      setAddingToCart(null); 
    }
  };

  const handleToggleWishlist = async (productId) => {
    setTogglingWishlist(productId);
    try {
      if (isProductInWishlist(productId)) {
        await removeFromWishlist(productId);
        toast.success('Product removed from wishlist!');
      } else {
        await addToWishlist(productId);
        toast.success('Product added to wishlist!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update wishlist.');
    } finally {
      setTogglingWishlist(null);
    }
  };

  // Handle search and filter - Unchanged
  const handleSearch = (query, filters) => {
    let results = [...products]

    // Search by name (product.name.en) or SKU
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(product =>
        (product.name?.en && product.name.en.toLowerCase().includes(lowerQuery)) ||
        (product.sku && product.sku.toLowerCase().includes(lowerQuery))
      )
    }

    // Apply filters
    if (filters.category) {
      results = results.filter(product => product.category === filters.category)
    }
    
    if (filters.status) {
      results = results.filter(product => product.status === filters.status)
    }
    
    if (filters.minPrice) {
      results = results.filter(product => product.price >= parseFloat(filters.minPrice))
    }
    
    if (filters.maxPrice) {
      results = results.filter(product => product.price <= parseFloat(filters.maxPrice))
    }
    
    setFilteredProducts(results)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id))
    }
    setSelectAll(!selectAll)
  }
  
  // Handle individual select
  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
      setSelectAll(false)
    } else {
      setSelectedProducts([...selectedProducts, productId])
      // Check if all products are now selected
      if (selectedProducts.length + 1 === filteredProducts.length) {
        setSelectAll(true)
      }
    }
  }
  
  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      setIsLoading(true) // Optional: set loading state for individual delete
      await api.del(`/products/${productId}`)
      setProducts(products.filter(product => product.id !== productId))
      setFilteredProducts(filteredProducts.filter(product => product.id !== productId))
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
      toast.success('Product deleted successfully')
    } catch (err) {
      console.error("Failed to delete product:", err)
      toast.error('Failed to delete product.')
    } finally {
      setIsLoading(false) // Optional: unset loading state
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected')
      return
    }

    setIsLoading(true)
    try {
      if (action === 'delete') {
        await Promise.all(selectedProducts.map(id => api.del(`/products/${id}`)))
        setProducts(products.filter(product => !selectedProducts.includes(product.id)))
        setFilteredProducts(filteredProducts.filter(product => !selectedProducts.includes(product.id)))
        setSelectedProducts([])
        setSelectAll(false)
        toast.success(`${selectedProducts.length} products deleted successfully`)
      } else if (action === 'active' || action === 'inactive') {
        const newStatus = action === 'active' ? 'Active' : 'Hidden' // Or based on backend
        await Promise.all(selectedProducts.map(id => api.put(`/products/${id}`, { status: newStatus })))
        
        // Refetch or update local state
        // For simplicity, refetching data. Could also update locally if API returns updated items.
        const data = await api.get('/products')
        setProducts(data)
        setFilteredProducts(data)
        setSelectedProducts([])
        setSelectAll(false)
        toast.success(`${selectedProducts.length} products updated successfully`)
      }
    } catch (err) {
      console.error("Bulk action failed:", err)
      toast.error('An error occurred during the bulk action.')
    } finally {
      setIsLoading(false)
    }
  }
      
  // Filter configurations
  const filterOptions = [
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Electronics', label: 'Electronics' },
        { value: 'Clothing', label: 'Clothing' },
        { value: 'Kitchen', label: 'Kitchen' },
        { value: 'Furniture', label: 'Furniture' },
        { value: 'Beauty', label: 'Beauty' },
        { value: 'Accessories', label: 'Accessories' },
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Out of Stock', label: 'Out of Stock' },
        { value: 'Low Stock', label: 'Low Stock' },
        { value: 'Hidden', label: 'Hidden' },
      ]
    },
    {
      name: 'minPrice',
      label: 'Min Price',
      type: 'number',
      placeholder: '0.00',
    },
    {
      name: 'maxPrice',
      label: 'Max Price',
      type: 'number',
      placeholder: '1000.00',
    }
  ]
  
  return (
    <div>
      <PageHeader 
        title="Products"
        subtitle="Manage your product inventory"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Products' }
        ]}
        actionButton={
          <Link to="/products/add" className="btn btn-primary inline-flex items-center">
            <FiPlus className="mr-2 h-5 w-5" />
            Add Product
          </Link>
        }
      />
      
      {/* Search & Filters */}
      <div className="card mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          placeholder="Search products by name or SKU..."
          filters={filterOptions}
        />
      </div>
      
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center mb-4 p-3 bg-primary-50 rounded-md animate-fade-in">
          <span className="text-sm font-medium text-primary-700 mr-4">
            {selectedProducts.length} products selected
          </span>
          <div className="space-x-2">
            <button 
              onClick={() => handleBulkAction('active')}
              className="btn btn-success text-sm py-1"
            >
              <FiCheck className="mr-1 h-4 w-4" />
              Set Active
            </button>
            <button 
              onClick={() => handleBulkAction('inactive')}
              className="btn btn-secondary text-sm py-1"
            >
              <FiEye className="mr-1 h-4 w-4" />
              Hide
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="btn btn-danger text-sm py-1"
            >
              <FiTrash2 className="mr-1 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Products List */}
      <div className="card">
        {isLoading ? (
          // Loading State
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State
          <EmptyState 
            title={error ? "Error" : "No products found"}
            description={error ? "There was an error fetching products. Please try again." : "Try adjusting your search or filter to find what you're looking for."}
            icon={error ? <FiAlertCircle className="h-8 w-8 text-error-500" /> : <FiShoppingBag className="h-8 w-8" />}
            actionLink="/products/add"
            actionText="Add New Product"
          />
        ) : (
          // Products Table
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
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                          <FiShoppingBag className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name?.en || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{product.sku}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{product.category}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">${product.price?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      {product.stock === 0 ? (
                        <span className="text-error-500 flex items-center justify-center">
                          <FiAlertCircle className="h-4 w-4 mr-1" />
                          Out
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="text-warning-500">{product.stock}</span>
                      ) : (
                        <span className="text-gray-700">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`badge ${
                        // Derive status based on stock or use product.status if available
                        (product.status ? product.status : (product.stock === 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'Active')) === 'Active' ? 'badge-success' :
                        (product.status ? product.status : (product.stock === 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'Active')) === 'Out of Stock' ? 'badge-error' :
                        (product.status ? product.status : (product.stock === 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'Active')) === 'Low Stock' ? 'badge-warning' :
                        'badge-info' // For 'Hidden' or other statuses
                      }`}>
                        {/* Display product.status if available, otherwise derive from stock */}
                        {product.status ? product.status : (product.stock === 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'Active')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1"> {/* Reduced space for more icons */}
                        <button
                          onClick={() => handleToggleWishlist(product._id)}
                          className={`p-1 disabled:opacity-50 ${isProductInWishlist(product._id) ? 'text-error-500 hover:text-error-700' : 'text-gray-400 hover:text-error-500'}`}
                          disabled={togglingWishlist === product._id || isLoadingWishlist}
                          aria-label={isProductInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {togglingWishlist === product._id ? (
                            <FiLoader className="h-5 w-5 animate-spin" />
                          ) : (
                            <FiHeart className={`h-5 w-5 ${isProductInWishlist(product._id) ? 'fill-current' : ''}`} />
                          )}
                        </button>
                        <button
                          onClick={() => handleAddToCart(product._id)} 
                          className="text-primary-600 hover:text-primary-800 p-1 disabled:opacity-50"
                          disabled={addingToCart === product._id || isLoadingCart} 
                          aria-label="Add to cart"
                        >
                          {addingToCart === product._id ? (
                            <FiLoader className="h-5 w-5 animate-spin" />
                          ) : (
                            <FiCart className="h-5 w-5" />
                          )}
                        </button>
                        <Link to={`/products/edit/${product._id}`} className="text-gray-600 hover:text-primary-600 p-1"> 
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteProduct(product._id)} 
                          className="text-gray-600 hover:text-error-500 p-1"
                        >
                          <FiTrash2 className="h-5 w-5" />
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
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProducts.length}</span> of{" "}
                  <span className="font-medium">{products.length}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="btn btn-secondary py-1"
                  disabled // Add pagination logic later
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary py-1"
                  disabled // Add pagination logic later
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

export default ProductList
      setSelectedProducts([])
      setSelectAll(false)
      toast.success(`${selectedProducts.length} products updated successfully`)
    }
  }
  
  // Filter configurations
  const filterOptions = [
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'Electronics', label: 'Electronics' },
        { value: 'Clothing', label: 'Clothing' },
        { value: 'Kitchen', label: 'Kitchen' },
        { value: 'Furniture', label: 'Furniture' },
        { value: 'Beauty', label: 'Beauty' },
        { value: 'Accessories', label: 'Accessories' },
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Out of Stock', label: 'Out of Stock' },
        { value: 'Low Stock', label: 'Low Stock' },
        { value: 'Hidden', label: 'Hidden' },
      ]
    },
    {
      name: 'minPrice',
      label: 'Min Price',
      type: 'number',
      placeholder: '0.00',
    },
    {
      name: 'maxPrice',
      label: 'Max Price',
      type: 'number',
      placeholder: '1000.00',
    }
  ]
  
  return (
    <div>
      <PageHeader 
        title="Products"
        subtitle="Manage your product inventory"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Products' }
        ]}
        actionButton={
          <Link to="/products/add" className="btn btn-primary inline-flex items-center">
            <FiPlus className="mr-2 h-5 w-5" />
            Add Product
          </Link>
        }
      />
      
      {/* Search & Filters */}
      <div className="card mb-6">
        <SearchFilter 
          onSearch={handleSearch}
          placeholder="Search products by name or SKU..."
          filters={filterOptions}
        />
      </div>
      
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center mb-4 p-3 bg-primary-50 rounded-md animate-fade-in">
          <span className="text-sm font-medium text-primary-700 mr-4">
            {selectedProducts.length} products selected
          </span>
          <div className="space-x-2">
            <button 
              onClick={() => handleBulkAction('active')}
              className="btn btn-success text-sm py-1"
            >
              <FiCheck className="mr-1 h-4 w-4" />
              Set Active
            </button>
            <button 
              onClick={() => handleBulkAction('inactive')}
              className="btn btn-secondary text-sm py-1"
            >
              <FiEye className="mr-1 h-4 w-4" />
              Hide
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="btn btn-danger text-sm py-1"
            >
              <FiTrash2 className="mr-1 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Products List */}
      <div className="card">
        {isLoading ? (
          // Loading State
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State
          <EmptyState 
            title="No products found"
            description="Try adjusting your search or filter to find what you're looking for."
            icon={<FiShoppingBag className="h-8 w-8" />}
            actionLink="/products/add"
            actionText="Add New Product"
          />
        ) : (
          // Products Table
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
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                          <FiShoppingBag className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{product.sku}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{product.category}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      {product.stock === 0 ? (
                        <span className="text-error-500 flex items-center justify-center">
                          <FiAlertCircle className="h-4 w-4 mr-1" />
                          Out
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="text-warning-500">{product.stock}</span>
                      ) : (
                        <span className="text-gray-700">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`badge ${
                        product.status === 'Active' ? 'badge-success' :
                        product.status === 'Out of Stock' ? 'badge-error' :
                        product.status === 'Low Stock' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/products/edit/${product.id}`} className="text-gray-600 hover:text-primary-600">
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-gray-600 hover:text-error-500"
                        >
                          <FiTrash2 className="h-5 w-5" />
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
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProducts.length}</span> of{" "}
                  <span className="font-medium">{products.length}</span> results
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

export default ProductList