import { useState } from "react";

export function OrderForm({ cart, updateCart, submitOrder, lastOrder, storeSettings }) {
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    notes: ""
  });
  const [status, setStatus] = useState("");

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!cart.length) {
      setStatus("Add at least one product to the order.");
      return;
    }

    try {
      await submitOrder(form);
      setForm({
        customer_name: "",
        phone: "",
        address: "",
        notes: ""
      });
      setStatus("WhatsApp is ready. Review the message and send it.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <p className="eyebrow">Order Bag</p>
        <h2>Your WhatsApp order</h2>
        <p className="checkout-intro">
          Add items, enter your details, and send the prepared order to {storeSettings.store_name}.
        </p>
      </div>

      <div className="cart-list">
        {cart.length ? (
          cart.map((item) => (
            <div key={item.cart_key} className="cart-item">
              <div>
                <strong>{item.name}</strong>
                {item.variant_label ? <small>{item.variant_label}</small> : null}
                <small>N{item.price.toLocaleString()}</small>
              </div>
              <div className="cart-quantity-box">
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(event) => updateCart(item.cart_key, Number(event.target.value))}
                />
                <button type="button" className="ghost-button cart-remove-button" onClick={() => updateCart(item.cart_key, 0)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty empty-cart">
            <p>Your shopping bag is empty.</p>
            <p>Choose a product to begin.</p>
          </div>
        )}
      </div>

      <div className="total">
        <span>Estimated total:</span>
        <span>N{total.toLocaleString()}</span>
      </div>
      <p className="delivery-note">{storeSettings.delivery_note}</p>
      <div className="payment-note">
        <strong>Payment method</strong>
        <p>{storeSettings.payment_note}</p>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <input
          name="customer_name"
          placeholder="Customer name"
          value={form.customer_name}
          onChange={handleChange}
          required
        />
        <input type="tel" name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} required />
        <textarea
          name="address"
          placeholder="Delivery address"
          value={form.address}
          onChange={handleChange}
          required
        />
        <textarea name="notes" placeholder="Extra note, preferred color, pickup note..." value={form.notes} onChange={handleChange} />
        <button type="submit">Send to WhatsApp</button>
      </form>

      {status ? <p className="form-status status-block">{status}</p> : null}

      {lastOrder ? (
        <div className="success-card">
          <p className="eyebrow">Last Checkout</p>
          <h3>Order prepared successfully</h3>
          <p>{lastOrder.customer_name} | N{lastOrder.total_amount.toLocaleString()}</p>
          <a className="wa-link" href={lastOrder.whatsapp_url} target="_blank" rel="noreferrer">
            Re-open WhatsApp summary
          </a>
        </div>
      ) : null}
    </section>
  );
}
