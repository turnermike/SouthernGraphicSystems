import React from 'react';

const ProductCard = ({ product }) => {
  // Handle missing or invalid product data
  if (!product || typeof product !== 'object') {
    return (
      <div className="bg-gray-100 rounded-lg shadow-md p-4 text-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Product data unavailable</p>
        </div>
      </div>
    );
  }

  const {
    title = 'Product Name Unavailable',
    price = 0,
    discountPercentage = 0,
    rating = 0,
    brand,
    thumbnail
  } = product;

  // Safely calculate discounted price
  const safePrice = typeof price === 'number' ? price : 0;
  const safeDiscount = typeof discountPercentage === 'number' ? discountPercentage : 0;
  const discountedPrice = safePrice - (safePrice * safeDiscount / 100);
  
  // Safely handle rating
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    
      <div className="relative">
        <img
          src={thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={title || 'Product image'}
          className="w-full h-48 object-cover bg-gray-200"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
            e.target.onerror = null; // Prevent infinite loop
          }}
        />
        {safeDiscount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
            -{safeDiscount.toFixed(0)}%
          </div>
        )}
      </div>

      <div className="p-4">
        {brand && (
          <div className="mb-2">
            <span className="text-sm text-gray-500 font-medium">{brand}</span>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(safeRating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-sm text-gray-600">
              ({safeRating > 0 ? safeRating.toFixed(1) : 'No rating'})
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-gray-900">
            ${discountedPrice.toFixed(2)}
          </span>
          {safeDiscount > 0 && safePrice > discountedPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${safePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
