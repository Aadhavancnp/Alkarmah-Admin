import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { FiSave, FiX, FiChevronLeft, FiImage, FiPlus, FiTrash2, FiEye, FiLoader, FiShoppingCart, FiHeart } from 'react-icons/fi' // Added FiHeart
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import * as api from '../../utils/api'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext' // Import useWishlist

const EditProduct = () => {
  const { addToCart, isLoadingCart: isCartLoading } = useCart();
  const { 
    addToWishlist, 
    removeFromWishlist, 
    isProductInWishlist,
    isLoadingWishlist 
  } = useWishlist(); // Consume WishlistContext
  const navigate = useNavigate()
  const { id } = useParams()
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false); // State for wishlist button
  
  const [productData, setProductData] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    sku: '',
    price: '',
    // salePrice: '', // Not in schema, remove or handle if needed
    // cost: '', // Not in schema
    category: '',
    stock: '',
    image: [], // Expecting array of URLs from API
    status: 'Active',
    featured: false,
    tags: [],
    // weight: '', // Not in schema
    // dimensions: { length: '', width: '', height: '' }, // Not in schema
    // variations: [], // Not in schema
  })

  // Temporary state for comma-separated image URLs for the form
  const [imageUrls, setImageUrls] = useState('')
  
  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoadingPage(true)
      try {
        const fetchedProduct = await api.get(`/products/${id}`)
        
        // Ensure name and description are objects, even if API returns null/undefined for them
        fetchedProduct.name = fetchedProduct.name || { en: '', ar: '' };
        fetchedProduct.description = fetchedProduct.description || { en: '', ar: '' };
        
        setProductData(fetchedProduct)
        // Convert array of image URLs to comma-separated string for form input
        if (fetchedProduct.image && Array.isArray(fetchedProduct.image)) {
          setImageUrls(fetchedProduct.image.join(', '))
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
        toast.error(error.response?.data?.message || 'Failed to fetch product details.')
        // Optional: Redirect if product not found or critical error
        // navigate('/products'); 
      } finally {
        setIsLoadingPage(false)
      }
    }
    fetchProduct()
  }, [id, navigate])
  
  // Options for categories (Keep as is or fetch from API if dynamic)
  const categories = [
    'Electronics',
    'Clothing',
    'Kitchen',
    'Furniture',
    'Beauty',
    'Accessories',
    'Books',
    'Sports',
    'Toys',
  ]
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === "name.en" || name === "name.ar" || name === "description.en" || name === "description.ar") {
      const [parent, child] = name.split('.')
      setProductData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value
        }
      }))
    } else if (name === "imageUrls") {
      setImageUrls(value) // Update temporary state for image URLs
    } else if (type === 'checkbox') {
      setProductData({
        ...productData,
        [name]: checked
      })
    } else {
      setProductData({
        ...productData,
        [name]: value
      })
    }
  }
  
  // Handle tags input
  const [tagInput, setTagInput] = useState('')
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value)
  }
  
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      
      // Add tag if it doesn't already exist
      if (!productData.tags.includes(tagInput.trim())) {
        setProductData({
          ...productData,
          tags: [...productData.tags, tagInput.trim()]
        })
      }
      
      setTagInput('')
    }
  }
  
  const removeTag = (tagToRemove) => {
    setProductData({
      ...productData,
      tags: productData.tags.filter(tag => tag !== tagToRemove)
    })
  }
  
  // Removed handleImageChange and removeImage as we are using text input for URLs

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUpdating(true)

    // Basic validation
    if (!productData.name?.en || !productData.name?.ar || !productData.price || !productData.category || !productData.stock) {
      toast.error('Please fill in all required fields (English Name, Arabic Name, Price, Category, Stock).')
      setIsUpdating(false)
      return
    }

    const imagesArray = imageUrls.split(',').map(url => url.trim()).filter(url => url)
    
    const payload = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      category: productData.category,
      stock: parseInt(productData.stock, 10),
      image: imagesArray,
      // Include other fields from productData that are part of the schema and editable
      sku: productData.sku,
      status: productData.status,
      featured: productData.featured,
      tags: productData.tags,
      // weight: productData.weight ? parseFloat(productData.weight) : undefined, // Example if weight was in schema
    }

    try {
      await api.put(`/products/${id}`, payload)
      toast.success('Product updated successfully!')
      navigate('/products')
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error(error.response?.data?.message || 'Failed to update product. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Handle delete product
  const handleDeleteProduct = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setIsDeleting(true)
      try {
        await api.del(`/products/${id}`)
        toast.success('Product deleted successfully')
        navigate('/products')
      } catch (error) {
        console.error('Failed to delete product:', error)
        toast.error(error.response?.data?.message || 'Failed to delete product.')
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  // Handle variations (Keep or remove based on schema) - Unchanged
  const [showVariationForm, setShowVariationForm] = useState(false)
  const [variationAttribute, setVariationAttribute] = useState('')
  const [variationOptions, setVariationOptions] = useState('')
  
  const addVariation = () => {
    if (!variationAttribute || !variationOptions) {
      toast.error('Please fill in all variation fields')
      return
    }
    
    const options = variationOptions.split(',').map(option => option.trim())
    
    setProductData({
      ...productData,
      variations: [
        ...productData.variations,
        {
          id: Math.random().toString(36).substring(2, 15),
          attribute: variationAttribute,
          options
        }
      ]
    })
    
    // Reset the form
    setVariationAttribute('')
    setVariationOptions('')
    setShowVariationForm(false)
  }
  
  const removeVariation = (variationId) => {
    setProductData({
      ...productData,
      variations: productData.variations.filter(variation => variation.id !== variationId)
    })
  }
  
  // Handle Add to Cart - Unchanged
  const handleAddToCart = async () => {
    if (!productData || !productData._id) {
      toast.error('Product data is not available.');
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(productData._id, 1); // Add 1 quantity
      toast.success(`${productData.name?.en || 'Product'} added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add product to cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle Toggle Wishlist
  const handleToggleWishlist = async () => {
    if (!productData || !productData._id) {
      toast.error('Product data is not available.');
      return;
    }
    setIsTogglingWishlist(true);
    try {
      if (isProductInWishlist(productData._id)) {
        await removeFromWishlist(productData._id);
        toast.success('Removed from wishlist!');
      } else {
        await addToWishlist(productData._id);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update wishlist.');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Loading UI - Unchanged
  if (isLoadingPage) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div> {/* Adjusted color for consistency if needed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div> {/* Adjusted color */}
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title={productData.name?.en ? `Edit Product: ${productData.name.en}` : 'Edit Product'}
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Products', link: '/products' },
          { text: 'Edit' }
        ]}
        actionButton={
          <div className="flex flex-wrap gap-2"> {/* Use flex-wrap and gap for better responsiveness */}
            <Link to="/products" className="btn btn-secondary inline-flex items-center">
              <FiChevronLeft className="mr-2 h-5 w-5" />
              Back
            </Link>
            {/* Preview button might be removed if not functional or relevant 
            <Link to={`/products/preview/${id}`} className="btn btn-info inline-flex items-center">
              <FiEye className="mr-2 h-5 w-5" />
              Preview
            </Link> */}
            <button
              onClick={handleToggleWishlist}
              className={`btn btn-secondary inline-flex items-center ${isProductInWishlist(productData?._id) ? 'text-error-500' : ''}`}
              disabled={isTogglingWishlist || isLoadingWishlist || !productData?._id}
              aria-label={isProductInWishlist(productData?._id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isTogglingWishlist ? (
                <FiLoader className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <FiHeart className={`mr-2 h-5 w-5 ${isProductInWishlist(productData?._id) ? 'fill-current' : ''}`} />
              )}
              {isProductInWishlist(productData?._id) ? 'Wishlisted' : 'Wishlist'}
            </button>
            <button 
              onClick={handleAddToCart}
              className="btn btn-success inline-flex items-center"
              disabled={isAddingToCart || isCartLoading || !productData?._id}
            >
              {isAddingToCart ? (
                <FiLoader className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <FiShoppingCart className="mr-2 h-5 w-5" />
              )}
              Add to Cart
            </button>
          </div>
        }
      />
      
      {/* Product Form - Unchanged for this step, assuming form fields remain the same */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="name.en" className="form-label">
                    Product Name (English) <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name.en"
                    name="name.en"
                    className="form-input"
                    value={productData.name?.en || ''}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name.ar" className="form-label">
                    Product Name (Arabic) <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name.ar"
                    name="name.ar"
                    className="form-input"
                    value={productData.name?.ar || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description.en" className="form-label">
                    Description (English)
                  </label>
                  <textarea
                    id="description.en"
                    name="description.en"
                    rows="3"
                    className="form-input"
                    value={productData.description?.en || ''}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="description.ar" className="form-label">
                    Description (Arabic)
                  </label>
                  <textarea
                    id="description.ar"
                    name="description.ar"
                    rows="3"
                    className="form-input"
                    value={productData.description?.ar || ''}
                    onChange={handleChange}
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="sku" className="form-label">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      className="form-input"
                      value={productData.sku}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category" className="form-label">
                      Category <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="form-input"
                      value={productData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="tags" className="form-label">
                    Tags
                  </label>
                  <div className="flex flex-wrap items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent p-2">
                    {productData.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center bg-primary-100 text-primary-800 text-xs font-medium rounded-full px-3 py-1 mr-2 mb-2"
                      >
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-primary-600 hover:text-primary-900"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="flex-1 min-w-[120px] outline-none text-sm p-1"
                      placeholder="Add tags (press Enter)"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Press Enter to add a tag</p>
                </div>
              </div>
            </div>
            
            {/* Pricing & Inventory */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Regular Price <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      id="price"
                      name="price"
                      className="form-input pl-7"
                      value={productData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="salePrice" className="form-label">
                    Sale Price
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      id="salePrice"
                      name="salePrice"
                      className="form-input pl-7"
                      value={productData.salePrice}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="cost" className="form-label">
                    Cost Price
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      id="cost"
                      name="cost"
                      className="form-input pl-7"
                      value={productData.cost}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-group">
                  <label htmlFor="stock" className="form-label">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    className="form-input"
                    value={productData.stock}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Product Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-input"
                    value={productData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={productData.featured}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Feature this product</span>
                </label>
              </div>
            </div>
            
            {/* Images */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images (URLs)</h2>
              <div className="form-group">
                <label htmlFor="imageUrls" className="form-label">
                  Image URLs (comma-separated)
                </label>
                <input
                  type="text"
                  id="imageUrls"
                  name="imageUrls"
                  className="form-input"
                  value={imageUrls}
                  onChange={handleChange}
                  placeholder="e.g., http://example.com/image1.jpg, http://example.com/image2.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter URLs separated by commas. Previous images: {productData.image?.join(', ')}
                </p>
              </div>
            </div>
            
            {/* Variations - Remove or adapt if not in schema */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Product Variations</h2>
                <button
                  type="button"
                  onClick={() => setShowVariationForm(true)}
                  className="btn btn-primary text-sm inline-flex items-center"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  Add Variation
                </button>
              </div>
              
              {productData.variations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No variations added yet. Add variations like size, color, material, etc.
                </p>
              ) : (
                <div className="space-y-3">
                  {productData.variations.map((variation) => (
                    <div key={variation.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{variation.attribute}</h3>
                          <div className="flex flex-wrap mt-2">
                            {variation.options.map((option, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-3 py-1 mr-2 mb-1"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariation(variation.id)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Variation Form */}
              {showVariationForm && (
                <div className="mt-4 border border-gray-200 rounded-md p-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Attribute Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Size, Color, Material"
                        value={variationAttribute}
                        onChange={(e) => setVariationAttribute(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Options (comma separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Small, Medium, Large"
                        value={variationOptions}
                        onChange={(e) => setVariationOptions(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowVariationForm(false)}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addVariation}
                      className="btn btn-primary text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dimensions & Weight - Remove or adapt if not in schema */}
            {/* For this refactor, assuming these are not part of the main product schema for PUT */}
            {/* <div className="card"> ... </div> */}
            
            {/* Product Information */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
              <div className="space-y-3">
                {productData.createdAt && (
                  <div>
                    <span className="text-sm text-gray-500">Created On</span>
                    <p className="text-sm font-medium text-gray-900">{new Date(productData.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
                {productData.updatedAt && (
                  <div>
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <p className="text-sm font-medium text-gray-900">{new Date(productData.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Product ID</span>
                  <p className="text-sm font-medium text-gray-900">{id}</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="card">
              <div className="space-y-3">
                <button
                  type="submit"
                  className="btn btn-primary w-full justify-center"
                  disabled={isUpdating || isLoadingPage}
                >
                  {isUpdating ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : <FiSave className="h-5 w-5 mr-2" />}
                  {isUpdating ? 'Updating...' : 'Update Product'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="btn btn-secondary w-full justify-center"
                  disabled={isUpdating || isLoadingPage || isDeleting}
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="btn btn-danger w-full justify-center"
                  disabled={isDeleting || isLoadingPage || isUpdating}
                >
                  {isDeleting ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : <FiTrash2 className="h-5 w-5 mr-2" />}
                  {isDeleting ? 'Deleting...' : 'Delete Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditProduct