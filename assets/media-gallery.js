if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        this.scrollTimeout = null;

        // Initialize viewer functionality even without thumbnails
        if (this.elements.viewer) {
          this.elements.viewer.setAttribute('data-gallery-listener', 'true');
          this.elements.viewer.addEventListener(
            'slideChanged',
            this.onSlideChanged.bind(this),
          );

          // Also listen to scroll events as a backup
          const viewerSlider =
            this.elements.viewer.slider ||
            this.elements.viewer.querySelector('[id^="Slider-"]');
          if (
            viewerSlider &&
            !viewerSlider.hasAttribute('data-gallery-scroll-listener')
          ) {
            viewerSlider.setAttribute('data-gallery-scroll-listener', 'true');
            viewerSlider.addEventListener('scroll', () => {
              clearTimeout(this.scrollTimeout);
              this.scrollTimeout = setTimeout(() => {
                this.updateActiveThumbnailFromScroll();
              }, 100);
            });
          }
        }

        if (!this.elements.thumbnails) return;
        this.elements.thumbnails
          .querySelectorAll('[data-target]')
          .forEach((mediaToSwitch) => {
            mediaToSwitch
              .querySelector('button')
              .addEventListener(
                'click',
                this.setActiveMedia.bind(
                  this,
                  mediaToSwitch.dataset.target,
                  false,
                ),
              );
          });
        if (
          this.dataset.desktopLayout &&
          this.dataset.desktopLayout.includes('thumbnail') &&
          this.mql.matches
        )
          this.removeListSemantic();
      }

      connectedCallback() {
        // Re-initialize elements if they weren't available in constructor
        if (!this.elements.viewer) {
          this.elements.viewer = this.querySelector('[id^="GalleryViewer"]');
        }
        if (!this.elements.thumbnails) {
          this.elements.thumbnails = this.querySelector(
            '[id^="GalleryThumbnails"]',
          );
        }

        // Set up slideChanged event listener if viewer exists
        if (
          this.elements.viewer &&
          !this.elements.viewer.hasAttribute('data-gallery-listener')
        ) {
          this.elements.viewer.setAttribute('data-gallery-listener', 'true');
          this.elements.viewer.addEventListener(
            'slideChanged',
            this.onSlideChanged.bind(this),
          );

          // Also listen to scroll events as a backup
          const viewerSlider =
            this.elements.viewer.slider ||
            this.elements.viewer.querySelector('[id^="Slider-"]');
          if (
            viewerSlider &&
            !viewerSlider.hasAttribute('data-gallery-scroll-listener')
          ) {
            viewerSlider.setAttribute('data-gallery-scroll-listener', 'true');
            viewerSlider.addEventListener('scroll', () => {
              clearTimeout(this.scrollTimeout);
              this.scrollTimeout = setTimeout(() => {
                this.updateActiveThumbnailFromScroll();
              }, 100);
            });
          }
        }

        // Set up thumbnail click handlers if not already set up
        if (this.elements.thumbnails) {
          const thumbnails =
            this.elements.thumbnails.querySelectorAll('[data-target]');
          thumbnails.forEach((mediaToSwitch) => {
            const button = mediaToSwitch.querySelector('button');
            if (button && !button.hasAttribute('data-gallery-handler')) {
              button.setAttribute('data-gallery-handler', 'true');
              button.addEventListener(
                'click',
                this.setActiveMedia.bind(
                  this,
                  mediaToSwitch.dataset.target,
                  false,
                ),
              );
            }
          });
        }
      }

      updateActiveThumbnailFromScroll() {
        if (!this.elements.viewer || !this.elements.thumbnails) return;

        const viewerSlider =
          this.elements.viewer.slider ||
          this.elements.viewer.querySelector('[id^="Slider-"]');
        if (!viewerSlider) return;

        const slides = viewerSlider.querySelectorAll('[data-media-id]');
        if (slides.length === 0) return;

        // Find the slide that's most visible
        let mostVisibleSlide = null;
        let maxVisibility = 0;

        slides.forEach((slide) => {
          const rect = slide.getBoundingClientRect();
          const viewerRect = viewerSlider.getBoundingClientRect();

          // Calculate how much of the slide is visible
          const visibleLeft = Math.max(rect.left, viewerRect.left);
          const visibleRight = Math.min(rect.right, viewerRect.right);
          const visibleWidth = Math.max(0, visibleRight - visibleLeft);
          const visibility = visibleWidth / rect.width;

          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisibleSlide = slide;
          }
        });

        if (mostVisibleSlide) {
          const mediaId = mostVisibleSlide.getAttribute('data-media-id');
          if (mediaId) {
            const thumbnail = this.elements.thumbnails.querySelector(
              `[data-target="${mediaId}"]`,
            );
            if (thumbnail) {
              this.setActiveThumbnail(thumbnail);
            }
          }
        }
      }

      onSlideChanged(event) {
        if (!this.elements.thumbnails) return;
        if (!event || !event.detail) return;

        // Try to get the current element from the event
        let currentElement = event.detail.currentElement;

        // If currentElement is not available, try to find it from the viewer
        if (!currentElement && this.elements.viewer) {
          const viewerSlider =
            this.elements.viewer.slider ||
            this.elements.viewer.querySelector('[id^="Slider-"]');
          if (viewerSlider) {
            const currentPage = event.detail.currentPage || 1;
            const slides = viewerSlider.querySelectorAll('[data-media-id]');
            if (slides.length >= currentPage) {
              currentElement = slides[currentPage - 1];
            }
          }
        }

        if (!currentElement) {
          console.warn('MediaGallery: No currentElement found', event.detail);
          return;
        }

        // Get data-media-id from the currentElement (the <li> slide element)
        let mediaId = currentElement.getAttribute('data-media-id');

        // If not found, try to find it in a child element
        if (!mediaId) {
          const mediaIdElement =
            currentElement.querySelector('[data-media-id]');
          if (mediaIdElement) {
            mediaId = mediaIdElement.getAttribute('data-media-id');
          }
        }

        if (!mediaId) {
          console.warn('MediaGallery: No data-media-id found', currentElement);
          return;
        }

        // Find the corresponding thumbnail
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${mediaId}"]`,
        );

        if (thumbnail) {
          this.setActiveThumbnail(thumbnail);
        } else {
          console.warn(
            'MediaGallery: No thumbnail found for mediaId',
            mediaId,
            'Available targets:',
            Array.from(
              this.elements.thumbnails.querySelectorAll('[data-target]'),
            ).map((el) => el.getAttribute('data-target')),
          );
        }
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer
          .querySelectorAll('[data-media-id]')
          .forEach((element) => {
            element.classList.remove('is-active');
          });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia &&
            activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(
              `[data-target="${mediaId}"]`,
            );
            activeThumbnail.parentElement.firstChild !== activeThumbnail &&
              activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            // For the main viewer, use the slider-component's slider
            const viewerSlider =
              this.elements.viewer?.slider || activeMedia.parentElement;
            if (viewerSlider) {
              viewerSlider.scrollTo({
                left: activeMedia.offsetLeft,
                behavior: 'smooth',
              });
            }
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${mediaId}"]`,
        );
        if (activeThumbnail) {
          this.setActiveThumbnail(activeThumbnail);
          const position = activeThumbnail.dataset?.mediaPosition || '1';
          this.announceLiveRegion(activeMedia, position);
        }
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        const button = thumbnail.querySelector('button');
        if (button) {
          button.setAttribute('aria-current', 'true');
        }

        // Check if slider is vertical or horizontal
        const isVertical = this.elements.thumbnails.isVertical || false;
        const slider =
          this.elements.thumbnails.slider ||
          this.elements.thumbnails.querySelector('[id^="Slider-"]');

        if (slider) {
          if (isVertical) {
            // Center the thumbnail vertically
            const thumbnailTop = thumbnail.offsetTop;
            const thumbnailHeight = thumbnail.clientHeight;
            const sliderHeight = slider.clientHeight;
            const scrollPosition =
              thumbnailTop - sliderHeight / 2 + thumbnailHeight / 2;

            slider.scrollTo({
              top: Math.max(0, scrollPosition),
              behavior: 'smooth',
            });
          } else {
            // Center the thumbnail horizontally
            const thumbnailLeft = thumbnail.offsetLeft;
            const thumbnailWidth = thumbnail.clientWidth;
            const sliderWidth = slider.clientWidth;
            const scrollPosition =
              thumbnailLeft - sliderWidth / 2 + thumbnailWidth / 2;

            slider.scrollTo({
              left: Math.max(0, scrollPosition),
              behavior: 'smooth',
            });
          }
        }
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector(
          '.product__modal-opener--image img',
        );
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML =
            window.accessibilityStrings.imageAvailable.replace(
              '[index]',
              position,
            );
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader =
          this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) =>
          slide.setAttribute('role', 'presentation'),
        );
      }
    },
  );
}
