//Working
import { useEffect, useState } from "react";
import { useSearchParams } from 'react-router-dom';

import CheckoutLayout from "../components/Checkout/CheckoutLayout";
// import { getCart } from "../api/admin";

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const cartId = new URLSearchParams(window.location.search).get("cartId");
  console.log(cartId);

  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Get parameters from URL
        const cartId = searchParams.get('cartId');
        const cartDataParam = searchParams.get('cartData');
        const errorParam = searchParams.get('error');

        console.log('📥 URL Parameters:', { cartId, cartDataParam, errorParam });

        if (errorParam) {
          setError(`Checkout error: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (cartDataParam) {
          try {
            // If cart data was passed in URL
            const decodedCartData = JSON.parse(decodeURIComponent(cartDataParam));
            console.log('📦 Decoded cart data:', decodedCartData);
            
            // Ensure the cart structure matches what OrderSummary expects
            const normalizedCart = {
              ...decodedCartData,
              // Ensure lineItems exists
              lineItems: decodedCartData.lineItems || {
                physicalItems: [],
                digitalItems: []
              },
              // Ensure cartAmount exists
              cartAmount: decodedCartData.cartAmount || 0,
              // Ensure currency exists
              currency: decodedCartData.currency || { code: 'EUR' }
            };
            
            setCart(normalizedCart);
            setLoading(false);
          } catch (parseError) {
            console.error('Failed to parse cart data:', parseError);
            setError('Invalid cart data format');
            setLoading(false);
          }
        } else if (cartId) {
          // If only cartId is provided, fetch from your backend
          await fetchCartById(cartId);
        } else {
          setError('Invalid checkout link - no cart data provided');
          setLoading(false);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to load checkout: ' + err.message);
        setLoading(false);
      }
    };

    initializeCart();
  }, [searchParams]);

  const fetchCartById = async (cartId) => {
    try {
      console.log('🔍 Fetching cart from backend with ID:', cartId);
      const response = await fetch(`https://unpenciled-unhumored-thora.ngrok-free.dev/api/cart-data?cartId=${cartId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cart data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Raw cart data from backend:', data);
      
      // Transform BigCommerce API response to match OrderSummary expected format
      const transformedCart = {
        id: data.id || cartId,
        lineItems: {
          physicalItems: (data.line_items?.physical_items || []).map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            extendedSalePrice: item.extended_sale_price,
            imageUrl: item.image_url || '/placeholder.png',
            options: item.options || []
          })),
          digitalItems: data.line_items?.digital_items || []
        },
        cartAmount: data.cart_amount || 0,
        currency: data.currency || { code: 'EUR' },
        discountAmount: data.discount_amount || 0,
        taxAmount: data.tax_amount || 0,
        grandTotal: data.cart_amount || 0
      };
      
      console.log('🔄 Transformed cart:', transformedCart);
      setCart(transformedCart);
      setLoading(false);
    } catch (err) {
      console.error('Cart fetch error:', err);
      setError('Failed to load cart: ' + err.message);
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
          {cart && <p className="text-sm text-gray-500">Cart ID: {cart.id}</p>}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Checkout Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            Please try again or contact support if the problem persists.
          </p>
          <a 
            href="https://your-bigcommerce-store.com/cart" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Return to Cart
          </a>
        </div>
      </div>
    );
  }

  // Debug info - you can remove this in production
  console.log('🎯 Rendering CheckoutLayout with cart:', cart);

  return <CheckoutLayout cart={cart} />;
}

