import React, { useEffect, useState, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [allProducts, setAllProducts] = useState([]); 
  const [sortBy, setSortBy] = useState('none'); 
  const [sortOrder, setSortOrder] = useState('desc'); 
  const [isSorted, setIsSorted] = useState(false); 
  
  const observerRef = useRef(null);
  const loadingTriggerRef = useRef(null);

  
  const sortProducts = useCallback((productsToSort, sortType, order) => {
    if (sortType === 'none') return productsToSort;
    
    return [...productsToSort].sort((a, b) => {
      let valueA, valueB;
      
      if (sortType === 'rating') {
        valueA = typeof a.rating === 'number' ? a.rating : 0;
        valueB = typeof b.rating === 'number' ? b.rating : 0;
      } else if (sortType === 'price') {
        
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const discountA = typeof a.discountPercentage === 'number' ? a.discountPercentage : 0;
        valueA = priceA - (priceA * discountA / 100);
        
        const priceB = typeof b.price === 'number' ? b.price : 0;
        const discountB = typeof b.discountPercentage === 'number' ? b.discountPercentage : 0;
        valueB = priceB - (priceB * discountB / 100);
      }
      
      if (order === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }, []);

  const fetchAllProducts = useCallback(async () => {
    if (allProducts.length > 0) {
      return allProducts; 
    }

    const controller = new AbortController();
    
    try {
      setLoadingMore(true);
      
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(`https://dummyjson.com/products?limit=0&skip=0`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data || !Array.isArray(data.products)) {
        throw new Error('Invalid response format');
      }
      
      const validProducts = data.products.filter(product => 
        product && 
        typeof product === 'object' && 
        product.id && 
        product.title
      );
      
      setAllProducts(validProducts);
      setTotalProducts(validProducts.length);
      return validProducts;
      
    } catch (err) {
      console.error('Failed to fetch all products:', err);
      setError('Failed to fetch products for sorting');
      return [];
    } finally {
      setLoadingMore(false);
    }
  }, [allProducts]);

  
  const handleSort = useCallback(async (newSortBy) => {
    try {
      
      await fetchAllProducts();
      
      if (sortBy === newSortBy) {
        
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
      } else {
        
        setSortBy(newSortBy);
        setSortOrder('desc');
      }
      
      setIsSorted(true);
    } catch (err) {
      console.error('Failed to apply sorting:', err);
    }
  }, [sortBy, fetchAllProducts]);

  
  const clearSort = useCallback(() => {
    setSortBy('none');
    setSortOrder('desc');
    setIsSorted(false);
  }, []);

  
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  
  const sortedProducts = isSorted 
    ? sortProducts(allProducts, sortBy, sortOrder)
    : sortProducts(products, sortBy, sortOrder);

  const fetchProducts = useCallback(async (page = 0, retryAttempt = 0, isLoadMore = false) => {
    const controller = new AbortController();
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      
      const skip = page * 10;
      const limit = 10;
      
      const res = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      
      if (!res.ok) {
        const statusMessages = {
          404: 'Products not found',
          500: 'Server error - please try again later',
          503: 'Service unavailable - please try again later',
        };
        const message = statusMessages[res.status] || `HTTP Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }
      
      const data = await res.json();
      
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      if (!Array.isArray(data.products)) {
        throw new Error('No products found in response');
      }
      
      
      if (page === 0) {
        setTotalProducts(data.total || 0);
      }
      
      
      const validProducts = data.products.filter(product => 
        product && 
        typeof product === 'object' && 
        product.id && 
        product.title
      );
      
      if (validProducts.length === 0 && page === 0) {
        throw new Error('No valid products found');
      }
      
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...validProducts]);
      } else {
        setProducts(validProducts);
      }
      
      
      const totalLoaded = (page + 1) * limit;
      setHasMore(totalLoaded < (data.total || 0));
      
      setRetryCount(0); 
      
    } catch (err) {
      if (err.name === 'AbortError') {
        if (retryAttempt === 0) {
          setError('Request timed out');
        }
        return;
      }
      
      
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
        return;
      }
      
      
      const retryableErrors = ['fetch', 'network', 'timeout', 'server'];
      const isRetryable = retryableErrors.some(keyword => 
        err.message.toLowerCase().includes(keyword)
      );
      
      if (isRetryable && retryAttempt < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchProducts(page, retryAttempt + 1, isLoadMore);
        }, 1000 * (retryAttempt + 1)); 
        return;
      }
      
      setError(err.message || 'Failed to load products');
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  
  useEffect(() => {
    fetchProducts(0);
  }, [fetchProducts]);

  
  const loadMore = useCallback(() => {
    
    if (isSorted) return;
    
    if (!loadingMore && hasMore && !error) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchProducts(nextPage, 0, true);
    }
  }, [loadingMore, hasMore, error, currentPage, fetchProducts, isSorted]);

  
  useEffect(() => {
    const triggerElement = loadingTriggerRef.current;
    if (!triggerElement || !hasMore || loadingMore || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('Intersection Observer triggered:', { 
          isIntersecting: entry.isIntersecting, 
          hasMore, 
          loadingMore,
          currentProducts: products.length 
        });
        
        if (entry.isIntersecting && hasMore && !loadingMore && !error) {
          console.log('Loading more products...');
          loadMore();
        }
      },
      {
        threshold: 0,
        rootMargin: '100px',
      }
    );

    observer.observe(triggerElement);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loadingMore, error, products.length]);


  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setLoadingMore(false);
    setRetryCount(0);
    setCurrentPage(0);
    setHasMore(true);
    setProducts([]);
    setAllProducts([]);
    setTotalProducts(0);
    setSortBy('none');
    setSortOrder('desc');
    setIsSorted(false);
    
    fetchProducts(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 text-gray-600">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" className="opacity-75" />
          </svg>
          <div className="text-center">
            <p className="font-medium text-lg">Loading products…</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Retrying... (Attempt {retryCount}/3)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        
          <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          
          {!navigator.onLine && (
            <p className="text-xs text-gray-500 mt-4">
              Please check your internet connection
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSort('rating')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  sortBy === 'rating'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Sort by Rating
                {sortBy === 'rating' && (
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortOrder === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                    )}
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => handleSort('price')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  sortBy === 'price'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Sort by Price
                {sortBy === 'price' && (
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortOrder === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                    )}
                  </svg>
                )}
              </button>
              
              {sortBy !== 'none' && (
                <button
                  onClick={clearSort}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {totalProducts > 0 && (
            <div className="text-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p>
                  Showing {isSorted ? sortedProducts.length : products.length} of {totalProducts} products
                  {sortBy !== 'none' && (
                    <span className="ml-2 text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      Sorted by {sortBy} ({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
                    </span>
                  )}
                </p>
                {!isSorted && (
                  <p className="text-sm text-gray-500">
                    Page: {currentPage + 1} | Has More: {hasMore ? 'Yes' : 'No'} | Loading: {loadingMore ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3 text-gray-600">
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" className="opacity-75" />
              </svg>
              <span className="font-medium">Loading more products…</span>
            </div>
          </div>
        )}
        
        {hasMore && !loadingMore && !error && !isSorted && (
          <div 
            ref={loadingTriggerRef}
            className="h-20 flex items-center justify-center my-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg"
          >
            <div className="text-center text-blue-600">
              <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p className="text-sm opacity-70">Scroll to load more</p>
            </div>
          </div>
        )}
        
        {((!hasMore && products.length > 0 && !error && !isSorted) || (isSorted && sortedProducts.length > 0)) && (
          <div className="flex items-center justify-center py-12">
            <div className="bg-white rounded-lg shadow-md px-6 py-6 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isSorted ? 'All products sorted!' : 'All products loaded!'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isSorted 
                  ? `Showing all ${sortedProducts.length} products sorted by ${sortBy}.`
                  : `You've seen all ${totalProducts} products in our catalog.`
                }
              </p>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
              >
                Back to Top
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsList;

