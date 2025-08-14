class PriceRangeSlider {
  constructor(container) {
    this.container = container;
    this.minInput = container.querySelector('[data-slider-input="min"]');
    this.maxInput = container.querySelector('[data-slider-input="max"]');
    this.minThumb = container.querySelector('[data-slider-thumb="min"]');
    this.maxThumb = container.querySelector('[data-slider-thumb="max"]');
    this.rangeInput = container.querySelector('[data-slider-input-range]');
    this.range = container.querySelector('[data-slider-range]');

    this.minValue = 0;
    this.maxValue = parseInt(this.rangeInput.max);

    // Get initial values from inputs
    const minInputValue = this.parseInputValue(this.minInput.value);
    const maxInputValue = this.parseInputValue(this.maxInput.value);

    console.log('Price range slider initial values:', {
      minInputValue,
      maxInputValue,
      maxValue: this.maxValue,
      minInputName: this.minInput.name,
      maxInputName: this.maxInput.name,
    });

    this.currentMin = minInputValue !== null ? minInputValue : 0;
    this.currentMax = maxInputValue !== null ? maxInputValue : this.maxValue;

    // Ensure valid range
    if (this.currentMin >= this.currentMax) {
      this.currentMin = 0;
      this.currentMax = this.maxValue;
    }

    this.isDragging = false;
    this.dragTarget = null; // 'min' or 'max'

    // Debounce for AJAX updates during dragging
    this.updateTimeout = null;

    this.init();
  }

  init() {
    // Set text input values
    this.minInput.value = this.currentMin.toLocaleString();
    this.maxInput.value = this.currentMax.toLocaleString();

    this.setupEventListeners();
    this.updateRange();
  }

  setupEventListeners() {
    // Mouse events for dragging thumbs
    this.minThumb.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragTarget = 'min';
      this.minThumb.classList.add('dragging');
      this.disableTransitions();
      e.preventDefault();
    });

    this.maxThumb.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragTarget = 'max';
      this.maxThumb.classList.add('dragging');
      this.disableTransitions();
      e.preventDefault();
    });

    // Touch events for mobile devices
    this.minThumb.addEventListener('touchstart', (e) => {
      this.isDragging = true;
      this.dragTarget = 'min';
      this.minThumb.classList.add('dragging');
      this.disableTransitions();
      e.preventDefault();
    });

    this.maxThumb.addEventListener('touchstart', (e) => {
      this.isDragging = true;
      this.dragTarget = 'max';
      this.maxThumb.classList.add('dragging');
      this.disableTransitions();
      e.preventDefault();
    });

    // Handle both mouse and touch movement
    const handleMove = (e) => {
      if (!this.isDragging) return;

      const track = this.container.querySelector('.price-range-slider__track');
      const rect = track.getBoundingClientRect();
      const thumbWidth = 20; // Width of the thumb in pixels

      // Get clientX from either mouse or touch event
      const clientX =
        e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);

      const adjustedX = clientX - rect.left - thumbWidth / 2;
      const percent = Math.max(
        0,
        Math.min(100, (adjustedX / (rect.width - thumbWidth)) * 100),
      );
      const value = Math.round((percent / 100) * this.maxValue);

      console.log('Dragging:', {
        dragTarget: this.dragTarget,
        percent: percent.toFixed(2),
        value: value,
        currentMin: this.currentMin,
        currentMax: this.currentMax,
      });

      if (this.dragTarget === 'min') {
        if (value <= this.currentMax) {
          this.currentMin = value;
          this.updateRange();
          this.syncInputValues();
        }
      } else if (this.dragTarget === 'max') {
        if (value >= this.currentMin) {
          this.currentMax = value;
          this.updateRange();
          this.syncInputValues();
        }
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });

    // Handle both mouse and touch end
    const handleEnd = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragTarget = null;
        this.minThumb.classList.remove('dragging');
        this.maxThumb.classList.remove('dragging');
        this.enableTransitions();
        this.syncInputValues(); // Sync values when drag ends
        this.triggerFormUpdate(); // Trigger AJAX update when drag ends
      }
    };

    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    // Input field events
    this.minInput.addEventListener('input', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value <= this.currentMax) {
        this.currentMin = value;
        this.updateRange();
        // Trigger AJAX update on input change
        this.triggerFormUpdate();
      }
    });

    this.maxInput.addEventListener('input', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value >= this.currentMin) {
        this.currentMax = value;
        this.updateRange();
        // Trigger AJAX update on input change
        this.triggerFormUpdate();
      }
    });

    // Handle input blur to format values
    this.minInput.addEventListener('blur', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value <= this.currentMax) {
        this.currentMin = value;
        this.updateRange();
        e.target.value = value.toLocaleString();
      }
    });

    this.maxInput.addEventListener('blur', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value >= this.currentMin) {
        this.currentMax = value;
        this.updateRange();
        e.target.value = value.toLocaleString();
      }
    });

    // Handle input focus to show raw values
    this.minInput.addEventListener('focus', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null) {
        e.target.value = value.toString();
      }
    });

    this.maxInput.addEventListener('focus', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null) {
        e.target.value = value.toString();
      }
    });

    // Add touch support for clicking on the slider track
    const sliderArea = this.container.querySelector('[data-slider-area]');
    if (sliderArea) {
      sliderArea.addEventListener('click', (e) => {
        this.handleTrackClick(e);
      });

      sliderArea.addEventListener('touchend', (e) => {
        this.handleTrackClick(e);
      });
    }
  }

  parseInputValue(value) {
    if (!value || value === '') return null;

    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    const numValue = parseFloat(cleanValue);

    if (isNaN(numValue) || numValue < 0) {
      return null;
    }

    return Math.round(numValue);
  }

  updateRange() {
    const minPercent =
      ((this.currentMin - this.minValue) / (this.maxValue - this.minValue)) *
      100;
    const maxPercent =
      ((this.currentMax - this.minValue) / (this.maxValue - this.minValue)) *
      100;

    this.range.style.left = `${minPercent}%`;
    this.range.style.width = `${maxPercent - minPercent}%`;

    // Update visual thumb positions
    this.minThumb.style.left = `${minPercent}%`;
    this.maxThumb.style.left = `${maxPercent}%`;
  }

  syncInputValues() {
    // Update input values with formatted numbers
    this.minInput.value = this.currentMin.toLocaleString();
    this.maxInput.value = this.currentMax.toLocaleString();
  }

  disableTransitions() {
    this.minThumb.style.transition = 'none';
    this.maxThumb.style.transition = 'none';
    this.range.style.transition = 'none';
  }

  enableTransitions() {
    this.minThumb.style.transition = '';
    this.maxThumb.style.transition = '';
    this.range.style.transition = '';
  }

  triggerFormUpdate() {
    // Clear any existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Debounce the update to prevent too many AJAX requests
    this.updateTimeout = setTimeout(
      () => {
        // Update the form inputs with current values
        const form = this.container.closest('form');
        if (form) {
          // Update the hidden input values for the form submission
          const minInput = form.querySelector(`[name="${this.minInput.name}"]`);
          const maxInput = form.querySelector(`[name="${this.maxInput.name}"]`);

          if (minInput) {
            minInput.value = this.currentMin; // Convert back to cents for Shopify
          }
          if (maxInput) {
            maxInput.value = this.currentMax; // Convert back to cents for Shopify
          }

          // Dispatch a custom event that the facet system can listen to
          const event = new CustomEvent('priceRangeChanged', {
            detail: {
              min: this.currentMin,
              max: this.currentMax,
            },
          });
          form.dispatchEvent(event);

          // Trigger the facet form's AJAX update instead of form submission
          const facetForm = form.closest('facet-filters-form');
          if (facetForm && facetForm.onSubmitHandler) {
            console.log('Triggering facet form update');
            // Create a synthetic event to trigger the AJAX update
            const syntheticEvent = {
              preventDefault: () => {},
              target: this.minInput,
              srcElement: this.minInput,
            };

            // Use the existing debounced submit handler
            if (facetForm.debouncedOnSubmit) {
              facetForm.debouncedOnSubmit(syntheticEvent);
            }
          } else {
            console.log('No facet form found or onSubmitHandler not available');
          }
        } else {
          console.log('No form found for price range slider');
        }
      },
      this.isDragging ? 300 : 100,
    ); // Longer delay when dragging, shorter when typing
  }

  // Public method to get current values
  getValues() {
    return {
      min: this.currentMin,
      max: this.currentMax,
    };
  }

  // Handle clicking on the slider track
  handleTrackClick(e) {
    const track = this.container.querySelector('.price-range-slider__track');
    const rect = track.getBoundingClientRect();
    const thumbWidth = 20;

    // Get clientX from either mouse or touch event
    const clientX =
      e.clientX ||
      (e.changedTouches && e.changedTouches[0]
        ? e.changedTouches[0].clientX
        : 0);

    const adjustedX = clientX - rect.left - thumbWidth / 2;
    const percent = Math.max(
      0,
      Math.min(100, (adjustedX / (rect.width - thumbWidth)) * 100),
    );
    const value = Math.round((percent / 100) * this.maxValue);

    // Determine which thumb to move based on which is closer
    const minDistance = Math.abs(value - this.currentMin);
    const maxDistance = Math.abs(value - this.currentMax);

    if (minDistance <= maxDistance) {
      // Move min thumb
      if (value <= this.currentMax) {
        this.currentMin = value;
        this.updateRange();
        this.syncInputValues();
        this.triggerFormUpdate();
      }
    } else {
      // Move max thumb
      if (value >= this.currentMin) {
        this.currentMax = value;
        this.updateRange();
        this.syncInputValues();
        this.triggerFormUpdate();
      }
    }
  }

  // Public method to set values
  setValues(min, max) {
    this.currentMin = Math.max(this.minValue, Math.min(max, min));
    this.currentMax = Math.min(this.maxValue, Math.max(min, max));

    this.updateRange();
    this.syncInputValues();
  }
}

// Initialize all price range sliders on the page
document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.price-range-slider');
  console.log('Found price range sliders:', sliders.length);
  sliders.forEach((slider, index) => {
    console.log('Initializing price range slider', index + 1);
    new PriceRangeSlider(slider);
  });
});

// Export for use in other scripts
window.PriceRangeSlider = PriceRangeSlider;
