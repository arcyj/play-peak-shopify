class MobileSearch {
  constructor() {
    this.searchToggle = document.querySelector('[data-search-toggle]');
    this.searchDesktop = document.querySelector('.header__search-desktop');
    this.searchInput = document.querySelector('#Search-In-Modal');
    this.header = document.querySelector('.section-header');

    this.init();
  }

  init() {
    if (!this.searchToggle || !this.searchDesktop) return;

    this.searchToggle.addEventListener('click', this.toggleSearch.bind(this));

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'Escape' &&
        this.searchDesktop.classList.contains('is-active')
      ) {
        this.closeSearch();
      }
    });

    // Close when clicking outside the search area
    document.addEventListener('click', (e) => {
      if (
        this.searchDesktop.classList.contains('is-active') &&
        !this.searchDesktop.contains(e.target) &&
        !this.searchToggle.contains(e.target)
      ) {
        this.closeSearch();
      }
    });
  }

  toggleSearch() {
    if (this.searchDesktop.classList.contains('is-active')) {
      this.closeSearch();
    } else {
      this.openSearch();
    }
  }

  openSearch() {
    this.searchDesktop.classList.add('is-active');

    // Focus the search input after a short delay to ensure the animation completes
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    }, 300);
  }

  closeSearch() {
    this.searchDesktop.classList.remove('is-active');

    // Clear the search input
    if (this.searchInput) {
      this.searchInput.value = '';
    }
  }
}

// Initialize mobile search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MobileSearch();
});
