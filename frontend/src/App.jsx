import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDiscovery from "./pages/ProductDiscovery";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerOrders from "./pages/BuyerOrders";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { getUserRole } from "./utils/auth";
import AdminDashboard from "./pages/AdminDashboard";
import { Toaster } from "react-hot-toast";
import React from "react";

function HomeRedirect() {
  let role = null;
  try {
    role = getUserRole();
  } catch (e) {
    role = null;
  }
  if (role === "farmer") return <Navigate to="/farmer-dashboard" replace />;
  if (role === "delivery_partner") return <Navigate to="/deliveries" replace />;
  return <Navigate to="/marketplace" replace />;
}

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-8xl">🌾</div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tight">Page Not Found</h1>
      <p className="text-slate-500 font-medium text-center max-w-sm">
        Looks like this field doesn't exist. Head back to the marketplace.
      </p>
      <a
        href="/marketplace"
        className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg"
      >
        Back to Marketplace
      </a>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    // Log to monitoring in production (e.g. Sentry)
    if (process.env.NODE_ENV !== "production") {
      console.error("App error:", error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
          <p className="text-slate-500 text-center max-w-sm">
            An unexpected error occurred. Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/marketplace" element={<ProductDiscovery />} />
          {/* /profile must be before the wildcard */}
          <Route path="/profile" element={<Navigate to="/my-orders" replace />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <BuyerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
