function addToCart(variantId) {
  // Create form data
  const formData = new FormData();
  formData.append('id', variantId);
  formData.append('quantity', 1);

  // Add sections for cart updates
  const cart =
    document.querySelector('cart-drawer') ||
    document.querySelector('cart-notification');
  if (cart) {
    formData.append(
      'sections',
      cart.getSectionsToRender().map((section) => section.id),
    );
    formData.append('sections_url', window.location.pathname);
  }

  // Show loading state
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = 'Adding...';
  button.disabled = true;

  // Make the request
  fetch(`${window.routes.cart_add_url}`, {
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: formData,
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.status) {
        // Handle error
        console.error('Error adding to cart:', response.description);
        alert('Error adding product to cart');
      } else {
        // Success - update cart
        if (cart) {
          cart.renderContents(response);
        } else {
          // Redirect to cart if no cart component found
          window.location = window.routes.cart_url;
        }
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Error adding product to cart');
    })
    .finally(() => {
      // Reset button state
      button.textContent = originalText;
      button.disabled = false;
    });
}
