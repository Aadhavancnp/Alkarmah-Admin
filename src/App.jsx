import { Routes, Route } from 'react-router-dom' // Removed Navigate, useAuth as they are in ProtectedRoute
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute' // Import ProtectedRoute
import Dashboard from './pages/Dashboard'
import ProductList from './pages/products/ProductList'
import AddProduct from './pages/products/AddProduct'
import EditProduct from './pages/products/EditProduct'
import OrderList from './pages/orders/OrderList'
import OrderDetails from './pages/orders/OrderDetails'
import CustomerList from './pages/customers/CustomerList'
import Settings from './pages/settings/Settings'
import Help from './pages/help/Help'
import NotFound from './pages/NotFound'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import CartPage from './pages/cart/CartPage'
import WishlistPage from './pages/wishlist/WishlistPage'

// ProtectedRoute component is now imported

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}> {/* Use ProtectedRoute for Outlet-based protection */}
        <Route path="/" element={<Layout />}> {/* Layout is now a child of ProtectedRoute element */}
          <Route index element={<Dashboard />} />
        <Route path="products">
          <Route index element={<ProductList />} />
          <Route path="add" element={<AddProduct />} />
          <Route path="edit/:id" element={<EditProduct />} />
        </Route>
        <Route path="orders">
          <Route index element={<OrderList />} />
          <Route path=":id" element={<OrderDetails />} />
        </Route>
        <Route path="customers" element={<CustomerList />} />
        {/* <Route path="customers/add" element={<AddCustomer />} /> */}
        {/* <Route path="customers/edit/:id" element={<EditCustomer />} /> */}
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} /> {/* Add WishlistPage route */}
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        {/* All other routes within Layout are implicitly protected */}
      </Route>
      
      {/* Fallback for unmatched routes (can be inside or outside Layout depending on desired behavior) */}
      <Route path="*" element={<NotFound />} /> 
    </Route>
  )
}

export default App