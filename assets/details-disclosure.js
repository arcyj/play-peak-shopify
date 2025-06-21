class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content =
      this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener(
      'focusout',
      this.onFocusOut.bind(this),
    );
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle
      .querySelector('summary')
      .setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');

    // Add hover functionality for mega menu
    this.setupHoverEvents();
  }

  setupHoverEvents() {
    const summary = this.mainDetailsToggle.querySelector('summary');
    const content = this.mainDetailsToggle.querySelector('.mega-menu__content');

    if (!summary || !content) return;

    let hoverTimeout;

    // Open menu on mouse enter
    this.mainDetailsToggle.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      this.open();
    });

    // Close menu on mouse leave with delay
    this.mainDetailsToggle.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.close();
      }, 150); // 150ms delay to prevent accidental closing
    });

    // Prevent closing when moving from summary to content
    content.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
    });

    content.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.close();
      }, 250);
    });
  }

  open() {
    this.mainDetailsToggle.setAttribute('open', '');
    this.mainDetailsToggle
      .querySelector('summary')
      .setAttribute('aria-expanded', 'true');
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (
      document.documentElement.style.getPropertyValue(
        '--header-bottom-position-desktop',
      ) !== ''
    )
      return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`,
    );
  }
}

customElements.define('header-menu', HeaderMenu);
