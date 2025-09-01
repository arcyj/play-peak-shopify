class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems =
        this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') ||
      document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (event.source === 'cart-items') {
          return;
        }
        this.onCartUpdate();
      },
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = '';

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace(
        '[min]',
        event.target.dataset.min,
      );
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace(
        '[max]',
        event.target.max,
      );
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace(
        '[step]',
        event.target.step,
      );
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId,
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            'text/html',
          );
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            'text/html',
          );
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;

          // Handle empty state after cart update
          setTimeout(() => {
            this.handleEmptyCartState(this.classList.contains('is-empty'));
          }, 10);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    const sections = [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
    ];

    // Add main-cart-footer if it exists
    const mainCartFooter = document.getElementById('main-cart-footer');
    if (mainCartFooter) {
      sections.push({
        id: 'main-cart-footer',
        section: mainCartFooter.dataset.id,
        selector: '.js-contents',
      });
    }

    // Add sticky footer totals if it exists (for cart-with-sticky-footer section)
    const stickyFooterTotals = document.getElementById(
      'cart-sticky-footer-totals',
    );
    if (stickyFooterTotals) {
      const mainCartItems = document.getElementById('main-cart-items');
      if (mainCartItems) {
        sections.push({
          id: 'cart-sticky-footer-totals',
          section: mainCartItems.dataset.id,
          selector: '#cart-sticky-footer-totals',
        });
      }
    }

    return sections;
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) ||
          document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');
        const cartStickyFooter = document.querySelector('.cart-footer-sticky');

        if (cartFooter)
          cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper)
          cartDrawerWrapper.classList.toggle(
            'is-empty',
            parsedState.item_count === 0,
          );

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document
              .getElementById(section.id)
              .querySelector(section.selector) ||
            document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector,
          );
        });

        // Handle empty state for cart-with-sticky-footer section AFTER sections are rendered
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
          this.handleEmptyCartState(parsedState.item_count === 0);
        }, 10);
        const updatedValue = parsedState.items[line - 1]
          ? parsedState.items[line - 1].quantity
          : undefined;
        let message = '';
        if (
          items.length === parsedState.items.length &&
          updatedValue !== parseInt(quantityElement.value)
        ) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace(
              '[quantity]',
              updatedValue,
            );
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) ||
          document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(
                cartDrawerWrapper,
                lineItem.querySelector(`[name="${name}"]`),
              )
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper.querySelector('.drawer__inner-empty'),
            cartDrawerWrapper.querySelector('a'),
          );
        } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper,
            document.querySelector('.cart-item__name'),
          );
        }

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'cart-items',
          cartData: parsedState,
          variantId: variantId,
        });
      })
      .catch(() => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) =>
          overlay.classList.add('hidden'),
        );
        const errors =
          document.getElementById('cart-errors') ||
          document.getElementById('CartDrawer-CartErrors');
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) ||
      document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError)
      lineItemError.querySelector('.cart-item__error-text').textContent =
        message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') ||
      document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  handleEmptyCartState(isEmpty) {
    // Get the section ID from the main-cart-items element
    const mainCartItems = document.getElementById('main-cart-items');
    const sectionId = mainCartItems ? mainCartItems.dataset.id : null;

    if (!sectionId) {
      return;
    }

    const cartContainer = document.querySelector(
      '.cart-container-' + sectionId,
    );

    if (!cartContainer) {
      return;
    }

    // Find the main flex container that holds both cart items and sticky footer
    // Try multiple selectors to find the flex container
    let cartFlexContainer = cartContainer.querySelector(
      '.tw-flex.tw-flex-col.tablet\\:tw-flex-row',
    );
    if (!cartFlexContainer) {
      cartFlexContainer = cartContainer.querySelector(
        '[class*="tw-flex"][class*="tw-flex-col"]',
      );
    }
    if (!cartFlexContainer) {
      cartFlexContainer = cartContainer.querySelector('div[class*="tw-flex"]');
    }
    const emptyState = cartContainer.querySelector('.cart__warnings');

    // Alternative approach: target specific elements directly
    const cartItemsWrapper = cartContainer.querySelector(
      '.cart-items-wrapper-' + sectionId,
    );
    const stickyFooter = cartContainer.querySelector('.scroll-trigger');

    if (isEmpty) {
      // Hide the cart items and sticky footer, show empty state
      if (cartFlexContainer) {
        cartFlexContainer.style.display = 'none';
      }
      // Also try hiding individual elements as backup
      if (cartItemsWrapper) {
        cartItemsWrapper.style.display = 'none';
      }
      if (stickyFooter) {
        stickyFooter.style.display = 'none';
      }
      if (emptyState) {
        emptyState.style.display = 'block';
      }
    } else {
      // Show cart items and sticky footer when cart has items
      if (cartFlexContainer) {
        cartFlexContainer.style.display = 'flex';
      }
      // Also try showing individual elements as backup
      if (cartItemsWrapper) {
        cartItemsWrapper.style.display = 'block';
      }
      if (stickyFooter) {
        stickyFooter.style.display = 'block';
      }
      if (emptyState) {
        emptyState.style.display = 'none';
      }
    }
  }

  enableLoading(line) {
    const mainCartItems =
      document.getElementById('main-cart-items') ||
      document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`,
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`,
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove('hidden'),
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems =
      document.getElementById('main-cart-items') ||
      document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`,
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`,
    );

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) =>
      overlay.classList.add('hidden'),
    );
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, {
              ...fetchConfig(),
              ...{ body },
            });
          }, ON_CHANGE_DEBOUNCE_TIMER),
        );
      }
    },
  );
}
