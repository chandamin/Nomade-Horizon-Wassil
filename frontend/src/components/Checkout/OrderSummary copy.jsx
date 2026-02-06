//Working
export default function OrderSummary({ cart, deliveryPrice = 0 }) {
  if (!cart || !cart.lineItems) return null;

  const items = Array.isArray(cart.lineItems.physicalItems)
    ? cart.lineItems.physicalItems
    : [];

  const subtotal = Number(cart.cartAmount ?? 0);
  const discount = Number(cart.discountAmount ?? 0);
  const tax = Number(cart.taxAmount ?? 0);
  const total = Number(cart.grandTotal ?? subtotal + deliveryPrice);
  const currency = cart.currency?.code ?? "EUR";

  const formatPrice = (value) =>
    `€${Number(value ?? 0).toFixed(2)}`;

  return (
    <div className="bg-white border rounded p-4 text-sm sticky top-6">
      {/* TITLE */}
      <h3 className="font-semibold text-gray-900 mb-4">
        Order summary
      </h3>

      {/* EMPTY CART STATE */}
      {items.length === 0 && (
        <div className="text-sm text-gray-500">
          Your cart is empty
        </div>
      )}

      {/* PRODUCTS */}
      {items.map((item) => {
        const itemPrice = Number(item.extendedSalePrice ?? 0);
        const quantity = Number(item.quantity ?? 1);

        return (
          <div key={item.id} className="flex gap-3 mb-4">
            <img
              src={item.imageUrl || "/placeholder.png"}
              alt={item.name || "Product"}
              className="w-16 h-16 border rounded object-cover"
            />

            <div className="flex-1">
              <div className="font-medium text-gray-900 leading-snug">
                {item.name || "Unnamed product"}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Quantity: {quantity}
              </div>
            </div>

            <div className="font-semibold text-gray-900">
              {formatPrice(itemPrice)}
            </div>
          </div>
        );
      })}

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

        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
      </div>

      <hr className="my-4" />

      {/* TOTAL */}
      <div className="flex justify-between items-center text-base font-semibold text-gray-900">
        <span>Total ({currency})</span>
        <span>{formatPrice(total)}</span>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        Including VAT (estimated)
      </div>

      {/* PROMO CODE (UI ONLY) */}
      <div className="mt-4 opacity-60 cursor-not-allowed">
        <label className="block text-xs text-gray-600 mb-1">
          Promotional code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your code"
            className="flex-1 border rounded px-2 py-1.5 text-sm"
            disabled
          />
          <button
            type="button"
            className="border rounded px-3 py-1.5 text-xs font-medium"
            disabled
          >
            OK
          </button>
        </div>
      </div>

      {/* SUPPORT */}
      <div className="mt-6 text-xs text-gray-600 space-y-1">
        <div className="font-medium text-gray-900">
          Need help?
        </div>
        <div>Contact our customer service</div>
        <div className="font-medium text-gray-900">
          support@flashventes.com
        </div>
      </div>
    </div>
  );
}


