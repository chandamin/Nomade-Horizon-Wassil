// export default function OrderSummary() {
//   return (
//     <div className="bg-white border rounded p-4 text-sm">
//       {/* TITLE */}
//       <h3 className="font-semibold text-gray-900 mb-4">
//         Order summary
//       </h3>

//       {/* PRODUCT */}
//       <div className="flex gap-3 mb-4">
//         {/* PRODUCT IMAGE */}
//         <img
//           src="/product-placeholder.png"
//           alt="Product"
//           className="w-16 h-16 border rounded object-cover"
//         />

//         {/* PRODUCT DETAILS */}
//         <div className="flex-1">
//           <div className="font-medium text-gray-900 leading-snug">
//             LED Projector HY300 – Android 11 – WiFi – Bluetooth
//           </div>
//           <div className="text-xs text-gray-600 mt-1">
//             Quantity: 1
//           </div>
//         </div>

//         {/* PRODUCT PRICE */}
//         <div className="font-semibold text-gray-900">
//           €43.98
//         </div>
//       </div>

//       {/* DIVIDER */}
//       <hr className="my-4" />

//       {/* PRICE BREAKDOWN */}
//       <div className="space-y-2 text-gray-700">
//         <div className="flex justify-between">
//           <span>Subtotal</span>
//           <span>€43.98</span>
//         </div>

//         <div className="flex justify-between">
//           <span>Delivery</span>
//           <span>€1.99</span>
//         </div>

//         <div className="flex justify-between text-green-600 font-medium">
//           <span>Discount</span>
//           <span>-€0.00</span>
//         </div>
//       </div>

//       {/* DIVIDER */}
//       <hr className="my-4" />

//       {/* TOTAL */}
//       <div className="flex justify-between items-center text-base font-semibold text-gray-900">
//         <span>Total (EUR)</span>
//         <span>€45.97</span>
//       </div>

//       {/* VAT NOTE */}
//       <div className="text-xs text-gray-500 mt-1">
//         Including VAT
//       </div>

//       {/* PROMO CODE */}
//       <div className="mt-4">
//         <label className="block text-xs text-gray-600 mb-1">
//           Promotional code
//         </label>
//         <div className="flex gap-2">
//           <input
//             type="text"
//             placeholder="Enter your code"
//             className="flex-1 border rounded px-2 py-1.5 text-sm"
//           />
//           <button
//             type="button"
//             className="border rounded px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
//           >
//             OK
//           </button>
//         </div>
//       </div>

//       {/* CUSTOMER SUPPORT */}
//       <div className="mt-6 text-xs text-gray-600 space-y-1">
//         <div className="font-medium text-gray-900">
//           Need help?
//         </div>
//         <div>
//           Contact our customer service
//         </div>
//         <div className="font-medium text-gray-900">
//           support@flashventes.com
//         </div>
//       </div>
//     </div>
//   );
// }
export default function OrderSummary({ cart, deliveryPrice = 1.99 }) {
  // Default values if cart is not provided (for development/testing)
  const defaultCart = {
    lineItems: {
      physicalItems: [
        {
          id: '1',
          name: 'LED Projector HY300 – Android 11 – WiFi – Bluetooth',
          quantity: 1,
          extendedSalePrice: 43.98,
          imageUrl: '/product-placeholder.png'
        }
      ]
    },
    cartAmount: 43.98,
    discountAmount: 0,
    taxAmount: 0,
    currency: { code: 'EUR' }
  };

  // Use provided cart or default
  const displayCart = cart || defaultCart;
  
  // Extract items from cart
  const items = Array.isArray(displayCart.lineItems?.physicalItems) 
    ? displayCart.lineItems.physicalItems 
    : [];

  // Calculate prices
  const subtotal = Number(displayCart.cartAmount || 0);
  const discount = Number(displayCart.discountAmount || 0);
  const tax = Number(displayCart.taxAmount || 0);
  const total = subtotal + deliveryPrice - discount + tax;
  const currency = displayCart.currency?.code || "EUR";

  // Format price helper
  const formatPrice = (value) => {
    return `€${Number(value).toFixed(2)}`;
  };

  return (
    <div className="bg-white border rounded p-4 text-sm">
      {/* TITLE */}
      <h3 className="font-semibold text-gray-900 mb-4">
        Order summary
      </h3>

      {/* PRODUCTS */}
      {items.length === 0 ? (
        // Fallback if no items
        <div className="flex gap-3 mb-4">
          <img
            src="/product-placeholder.png"
            alt="Product"
            className="w-16 h-16 border rounded object-cover"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 leading-snug">
              Your cart is empty
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Quantity: 0
            </div>
          </div>
          <div className="font-semibold text-gray-900">
            €0.00
          </div>
        </div>
      ) : (
        // Dynamic items
        items.map((item, index) => {
          const itemPrice = Number(item.extendedSalePrice || 0);
          const quantity = Number(item.quantity || 1);

          return (
            <div key={item.id || index} className="flex gap-3 mb-4">
              {/* PRODUCT IMAGE */}
              <img
                src={item.imageUrl || "/product-placeholder.png"}
                alt={item.name || "Product"}
                className="w-16 h-16 border rounded object-cover"
              />

              {/* PRODUCT DETAILS */}
              <div className="flex-1">
                <div className="font-medium text-gray-900 leading-snug">
                  {item.name || "Unnamed product"}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Quantity: {quantity}
                </div>
              </div>

              {/* PRODUCT PRICE */}
              <div className="font-semibold text-gray-900">
                {formatPrice(itemPrice)}
              </div>
            </div>
          );
        })
      )}

      {/* DIVIDER */}
      <hr className="my-4" />

      {/* PRICE BREAKDOWN */}
      <div className="space-y-2 text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{formatPrice(deliveryPrice)}</span>
        </div>

        {discount > 0 ? (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount</span>
            <span>-€0.00</span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
      </div>

      {/* DIVIDER */}
      <hr className="my-4" />

      {/* TOTAL */}
      <div className="flex justify-between items-center text-base font-semibold text-gray-900">
        <span>Total ({currency})</span>
        <span>{formatPrice(total)}</span>
      </div>

      {/* VAT NOTE */}
      <div className="text-xs text-gray-500 mt-1">
        Including VAT{subtotal > 0 ? ' (estimated)' : ''}
      </div>

      {/* PROMO CODE */}
      <div className="mt-4">
        <label className="block text-xs text-gray-600 mb-1">
          Promotional code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your code"
            className="flex-1 border rounded px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            className="border rounded px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
          >
            OK
          </button>
        </div>
      </div>

      {/* CUSTOMER SUPPORT */}
      <div className="mt-6 text-xs text-gray-600 space-y-1">
        <div className="font-medium text-gray-900">
          Need help?
        </div>
        <div>
          Contact our customer service
        </div>
        <div className="font-medium text-gray-900">
          support@flashventes.com
        </div>
      </div>
    </div>
  );
}

