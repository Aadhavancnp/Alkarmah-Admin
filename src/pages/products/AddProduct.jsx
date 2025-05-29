import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiSave, FiX, FiChevronLeft, FiImage, FiPlus, FiLoader } from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import * as api from '../../utils/api' // Import the api utility

const AddProduct = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const [productData, setProductData] = useState({
    name: { en: '', ar: '' }, // Updated for localized names
    description: { en: '', ar: '' }, // Updated for localized descriptions
    sku: '',
    price: '',
    salePrice: '', // Will not be sent directly, schema has price only
    cost: '', // Will not be sent directly
    category: '',
    stock: '',
    image: [], // Updated to match schema (array of strings for URLs)
    status: 'Active', // Default status
    featured: false,
    tags: [],
    weight: '',
    dimensions: { // Will not be sent directly, schema has no dimensions
      length: '',
      width: '',
      height: '',
    },
    variations: [], // Will not be sent directly, schema has no variations
  })
  
  // Temporary state for comma-separated image URLs
  const [imageUrls, setImageUrls] = useState('')

  // Options for categories
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
    setIsLoading(true)

    // Basic validation (adjust as per your needs)
    if (!productData.name.en || !productData.name.ar || !productData.price || !productData.category || !productData.stock) {
      toast.error('Please fill in all required fields (English Name, Arabic Name, Price, Category, Stock).')
      setIsLoading(false)
      return
    }

    const imagesArray = imageUrls.split(',').map(url => url.trim()).filter(url => url)

    const payload = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      category: productData.category,
      stock: parseInt(productData.stock, 10),
      image: imagesArray, // Use the processed array of URLs
      // Optional fields based on schema, add if needed:
      // sku: productData.sku,
      // status: productData.status,
      // featured: productData.featured,
      // tags: productData.tags,
      // weight: parseFloat(productData.weight)
    }

    try {
      await api.post('/products', payload)
      toast.success('Product added successfully!')
      navigate('/products')
    } catch (error) {
      console.error('Failed to add product:', error)
      toast.error(error.response?.data?.message || 'Failed to add product. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle variations (Keep or remove based on whether it's part of ProductSchema)
  // For now, this part is not directly mapped to the simplified ProductSchema for POST
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

  return (
    <div>
      <PageHeader 
        title="Add New Product"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Products', link: '/products' },
          { text: 'Add New' }
        ]}
        actionButton={
          <Link to="/products" className="btn btn-secondary inline-flex items-center">
            <FiChevronLeft className="mr-2 h-5 w-5" />
            Back to Products
          </Link>
        }
      />
      
      {/* Product Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Product Name (English) <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name.en"
                    name="name.en"
                    className="form-input"
                    value={productData.name.en}
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
                    value={productData.name.ar}
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
                    value={productData.description.en}
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
                    value={productData.description.ar}
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
                  Enter URLs separated by commas.
                </p>
              </div>
            </div>
            
            {/* Variations - This section might be removed or simplified if not in ProductSchema for POST */}
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
            {/* Dimensions */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dimensions & Weight</h2>
              
              <div className="form-group">
                <label htmlFor="weight" className="form-label">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="weight"
                  name="weight"
                  className="form-input"
                  value={productData.weight}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="form-group">
                  <label htmlFor="dimensions.length" className="form-label text-xs">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="dimensions.length"
                    name="dimensions.length"
                    className="form-input"
                    value={productData.dimensions.length}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dimensions.width" className="form-label text-xs">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="dimensions.width"
                    name="dimensions.width"
                    className="form-input"
                    value={productData.dimensions.width}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dimensions.height" className="form-label text-xs">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="dimensions.height"
                    name="dimensions.height"
                    className="form-input"
                    value={productData.dimensions.height}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="card">
              <div className="space-y-3">
                <button
                  type="submit"
                  className="btn btn-primary w-full justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : <FiSave className="h-5 w-5 mr-2" />}
                  {isLoading ? 'Saving...' : 'Save Product'}
                </button>
                
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => navigate('/products')}
                  className="btn btn-secondary w-full justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddProduct