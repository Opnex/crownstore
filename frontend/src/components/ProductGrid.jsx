import { useEffect, useState } from "react";

function getImageSrc(product) {
  if (product.image_preview_url) return product.image_preview_url;
  if (!product.image_url) return "https://via.placeholder.com/800x600?text=Crown+Store";
  return product.image_url;
}

function getDefaultSelection(product) {
  return {
    size: product.sizes[0] || "",
    color: product.colors[0] || ""
  };
}

function getVariantLabel(selection) {
  return [selection.size ? `Size ${selection.size}` : "", selection.color || ""].filter(Boolean).join(" / ");
}

export function ProductGrid({ products, addToCart }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    function openFromHash() {
      if (!window.location.hash.startsWith("#product-")) return;
      const hashId = Number(window.location.hash.replace("#product-", ""));
      if (!Number.isFinite(hashId)) return;
      const match = products.find((product) => product.id === hashId);
      if (match) {
        setSelectedProduct(match);
      }
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [products]);

  function getSelection(product) {
    return selections[product.id] || getDefaultSelection(product);
  }

  function updateSelection(product, key, value) {
    setSelections((current) => ({
      ...current,
      [product.id]: {
        ...getSelection(product),
        [key]: value
      }
    }));
  }

  function openProduct(product) {
    setSelectedProduct(product);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#product-${product.id}`);
  }

  function closeProduct() {
    setSelectedProduct(null);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  function renderSelectors(product) {
    const selection = getSelection(product);

    return (
      <div className="variant-groups">
        {product.sizes.length ? (
          <div className="variant-group">
            <span className="variant-label">Sizes</span>
            <div className="variant-options">
              {product.sizes.map((size) => (
                <button
                  key={`${product.id}-size-${size}`}
                  type="button"
                  className={selection.size === size ? "variant-pill active" : "variant-pill"}
                  onClick={() => updateSelection(product, "size", size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {product.colors.length ? (
          <div className="variant-group">
            <span className="variant-label">Colors</span>
            <div className="variant-options">
              {product.colors.map((color) => (
                <button
                  key={`${product.id}-color-${color}`}
                  type="button"
                  className={selection.color === color ? "variant-pill active" : "variant-pill"}
                  onClick={() => updateSelection(product, "color", color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="product-grid">
        {products.map((product) => {
          const selection = getSelection(product);
          const variantLabel = getVariantLabel(selection);

          return (
            <article key={product.id} className={`product-card ${product.featured ? "product-card-featured" : ""}`}>
              <div className="product-card-head">
                <div className="product-badges">
                  {product.badge ? <span className="product-badge">{product.badge}</span> : null}
                </div>
              </div>

              <div className="product-img-wrapper" onClick={() => openProduct(product)} style={{ cursor: "pointer" }}>
                <img src={getImageSrc(product)} alt={product.name} />
              </div>

              <div className="product-meta">
                <div className="product-topline">
                  <span>{product.category}</span>
                  <span>{product.audience}</span>
                </div>
                <h3 onClick={() => openProduct(product)} style={{ cursor: "pointer" }}>{product.name}</h3>
                <p>{product.description}</p>

                {renderSelectors(product)}

                <span className="selected-option">{variantLabel || "Standard option"}</span>

                <div className="product-footer">
                  <div>
                    <strong>N{product.price.toLocaleString()}</strong>
                    <small>{product.stock_count} left</small>
                  </div>
                  <button onClick={() => addToCart(product, selection)} disabled={!product.in_stock}>
                    {product.in_stock ? "Add to order" : "Sold out"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedProduct ? (
        <div className="modal-overlay" onClick={closeProduct}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeProduct}>&times;</button>
            <img className="modal-image" src={getImageSrc(selectedProduct)} alt={selectedProduct.name} />
            <div className="modal-info">
              <div>
                <div className="product-topline modal-topline">
                  <span className="eyebrow modal-eyebrow">{selectedProduct.category}</span>
                  <span>{selectedProduct.audience}</span>
                </div>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.description}</p>
              </div>

              {renderSelectors(selectedProduct)}

              <div className="modal-price-row">
                <span className="modal-price">N{selectedProduct.price.toLocaleString()}</span>
                <span className="stock-warning">
                  {selectedProduct.stock_count} left in stock
                </span>
              </div>

              <button
                className="modal-add-button"
                onClick={() => {
                  addToCart(selectedProduct, getSelection(selectedProduct));
                  closeProduct();
                }}
                disabled={!selectedProduct.in_stock}
              >
                {selectedProduct.in_stock ? "Add to order" : "Currently sold out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
