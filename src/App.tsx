import React from 'react';
import { RouterProvider, useRouter, matchPath } from './router/Router';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/Toast';
import { SearchModal } from './components/common/SearchModal';
import { QuickViewModal } from './components/common/QuickViewModal';

// Pages
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { GuidesPage } from './pages/GuidesPage';
import { GuideDetailPage } from './pages/GuideDetailPage';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useRouter();

  const renderCurrentPage = () => {
    // 1. Home
    if (currentPath === '/' || currentPath === '') {
      return <HomePage />;
    }

    // 2. Catalog & Filters
    if (currentPath === '/catalog') {
      return <CatalogPage />;
    }

    // 3. Category Page (/category/:slug)
    const categoryMatch = matchPath('/category/:slug', currentPath);
    if (categoryMatch.isMatch) {
      return <CatalogPage forcedCategorySlug={categoryMatch.params.slug} />;
    }

    // 4. Product Detail (/product/:slug)
    const productMatch = matchPath('/product/:slug', currentPath);
    if (productMatch.isMatch) {
      return <ProductDetailPage slug={productMatch.params.slug} />;
    }

    // 5. Shopping Bag
    if (currentPath === '/cart') {
      return <CartPage />;
    }

    // 6. Checkout
    if (currentPath === '/checkout') {
      return <CheckoutPage />;
    }

    // 7. Order Confirmation (/order-success/:orderNumber)
    const orderSuccessMatch = matchPath('/order-success/:orderNumber', currentPath);
    if (orderSuccessMatch.isMatch) {
      return <OrderSuccessPage orderNumber={orderSuccessMatch.params.orderNumber} />;
    }

    // 8. Order Tracking (/track or /track/:orderNumber)
    const trackMatch = matchPath('/track/:orderNumber', currentPath);
    if (trackMatch.isMatch) {
      return <TrackOrderPage initialOrderNumber={trackMatch.params.orderNumber} />;
    }
    if (currentPath === '/track') {
      return <TrackOrderPage />;
    }

    // 9. Customer Account & Orders
    if (currentPath === '/account') {
      return <AccountPage />;
    }

    // 10. Admin Portal
    if (currentPath === '/admin') {
      return <AdminDashboardPage />;
    }

    // 11. Crockery Guides & Articles
    const guideDetailMatch = matchPath('/guides/:slug', currentPath);
    if (guideDetailMatch.isMatch) {
      return <GuideDetailPage slug={guideDetailMatch.params.slug} />;
    }
    if (currentPath === '/guides') {
      return <GuidesPage />;
    }

    // 12. Fallback 404
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
          404 Error
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-950">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
          The crockery collection or page you are looking for might have been moved or is currently unavailable.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-stone-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Go to Home
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Browse All Products
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      <Navbar />
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      <Footer />

      {/* Global Interactive Portals */}
      <SearchModal />
      <QuickViewModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <RouterProvider>
            <AppContent />
          </RouterProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
