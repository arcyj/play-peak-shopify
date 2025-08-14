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

    this.currentMin = minInputValue !== null ? minInputValue : 0;
    this.currentMax = maxInputValue !== null ? maxInputValue : this.maxValue;

    // Ensure valid range
    if (this.currentMin >= this.currentMax) {
      this.currentMin = 0;
      this.currentMax = this.maxValue;
    }

    this.isDragging = false;
    this.dragTarget = null; // 'min' or 'max'

    this.init();
  }

  init() {
    // Set text input values
    this.minInput.value = this.currentMin.toLocaleString();
    this.maxInput.value = this.currentMax.toLocaleString();

    this.setupEventListeners();
    this.updateRange();

    // Debug logging
    console.log('PriceRangeSlider initialized:', {
      minValue: this.minValue,
      maxValue: this.maxValue,
      currentMin: this.currentMin,
      currentMax: this.currentMax,
      minInputValue: this.minInput.value,
      maxInputValue: this.maxInput.value,
    });
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

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const track = this.container.querySelector('.price-range-slider__track');
      const rect = track.getBoundingClientRect();
      const thumbWidth = 20; // Width of the thumb in pixels
      const adjustedX = e.clientX - rect.left - thumbWidth / 2;
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
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragTarget = null;
        this.minThumb.classList.remove('dragging');
        this.maxThumb.classList.remove('dragging');
        this.enableTransitions();
        this.syncInputValues(); // Sync values when drag ends
        this.triggerFormUpdate();
      }
    });

    // Input field events
    this.minInput.addEventListener('input', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value <= this.currentMax) {
        this.currentMin = value;
        this.updateRange();
      }
    });

    this.maxInput.addEventListener('input', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value >= this.currentMin) {
        this.currentMax = value;
        this.updateRange();
      }
    });

    // Handle input blur to format values and trigger form update
    this.minInput.addEventListener('blur', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value <= this.currentMax) {
        this.currentMin = value;
        this.updateRange();
        e.target.value = value.toLocaleString();
        this.triggerFormUpdate();
      }
    });

    this.maxInput.addEventListener('blur', (e) => {
      const value = this.parseInputValue(e.target.value);
      if (value !== null && value >= this.currentMin) {
        this.currentMax = value;
        this.updateRange();
        e.target.value = value.toLocaleString();
        this.triggerFormUpdate();
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
    // Trigger form submission to update filters
    const form = this.container.closest('form');
    if (form) {
      // Dispatch a custom event that Shopify's facet system can listen to
      const event = new CustomEvent('priceRangeChanged', {
        detail: {
          min: this.currentMin,
          max: this.currentMax,
        },
      });
      form.dispatchEvent(event);

      // Also trigger the form submission with a small delay to ensure values are set
      setTimeout(() => {
        try {
          if (form.requestSubmit) {
            form.requestSubmit();
          } else {
            // Fallback for older browsers
            form.submit();
          }
        } catch (error) {
          console.warn('Form submission failed:', error);
        }
      }, 200);
    }
  }

  // Public method to get current values
  getValues() {
    return {
      min: this.currentMin,
      max: this.currentMax,
    };
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
  sliders.forEach((slider) => {
    new PriceRangeSlider(slider);
  });
});

// Export for use in other scripts
window.PriceRangeSlider = PriceRangeSlider;
