"use strict";

(function(window) {

    function openMenu(self) {
        self.$menu.show();
        self.$menuExpandedClassTarget['addClass'](self.menuExpandedClass);
        self.$menuToggle.attr({'aria-expanded': 'true'});
        self.$wrapper.addClass('opened').parent().css('overflow-x', 'hidden');
        self.$wrapper.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(e) {
            // When $wrapper transition has ended add the 'opened' class
            // We do this to always win over the closing transitionend
            self.$menu.addClass('opened');
            self.$wrapper.addClass('opened');
        });
    }

    function closeMenu(self, transitionDuration) {
        self.$menuExpandedClassTarget['removeClass'](self.menuExpandedClass);
        self.$menuToggle.attr({'aria-expanded': 'false'});
        self.$overlay.removeAttr('style');
        self.$wrapper.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(e) {
            // Remove style and class only on transationend
            // We do this so the menu stays visible on closing
            self.$menu.removeAttr('style').removeClass('opened');
            self.$wrapper.removeClass('opened');
        });
    }

    function toggleMenu(self, transitionDuration) {
        var method = !self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass) ? 'closed' : 'opened';
        if ( method === 'closed' ) { openMenu(self); }
        if ( method === 'opened' ) { closeMenu(self, transitionDuration); }
    }

    window.OffCanvasMenuController = function(options){

        options = options || {};

        // The menu
        this.$menu = options.$menu;
        this.position = options.position || 'left';
        this.menuExpandedClass = options.menuExpandedClass || 'show-' + this.position + '-menu';

        // Escape if the menu is not found.
        if(this.$menu.length == 0)
            return;

        this.$menuToggle = options.$menuToggle || [];
        this.$wrapper = options.wrapper || this.$menu.parent();
        this.wrapper = this.$wrapper[0];
        this.$menuExpandedClassTarget = options.$menuExpandedClassTarget || this.$wrapper;
        this.expandedWidth = this.$menu.outerWidth();
        this.ariaControls = options.ariaControls || this.$menu.selector.replace('#', '');
        this.offCanvasOverlay = options.offCanvasOverlay || 'off-canvas-overlay';
        this.$offCanvasOverlay = $('.' + this.offCanvasOverlay);
        // The overlay
        if ( !this.$offCanvasOverlay.length ) {
            this.$wrapper.append('<div class="' + this.offCanvasOverlay + '"></div>');
        }
        this.$overlay = $('.' + this.offCanvasOverlay);
        this.overlay = this.$overlay[0];
        this.overlayOpacity = options.overlayOpacity || '0.75';
        this.transitionDuration = this.$wrapper.css('transition-duration').replace('s', '') * 1000;

        // If we have a toggle button available
        if(this.$menuToggle.length){
            var self = this;

            // Set ARIA attributes
            this.$menuToggle.attr({
                'role': 'button',
                'aria-controls': self.ariaControls,
                'aria-expanded': 'false'
            });

            // Toggle button:
            this.$menuToggle.click(function(event){
                event.stopPropagation();
                toggleMenu(self, self.transitionDuration);
            });

            // Close menu by clicking anywhere
            this.$wrapper.click(function(event){
                if ( self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass) ) {
                    event.stopPropagation();
                    closeMenu(self, self.transitionDuration);
                }
            });

            // Don't close the menu when clicked on sidemenu
            this.$menu.click(function(event){
                event.stopPropagation();
            });

            // Keyboard accessible left menu
            if (this.position === 'left') {
                // At start of navigation block, return focus to toggle button
                this.$menu.find('li:first-child a').bind('keydown', function(e) {
                    if (e.keyCode === 9 && e.shiftKey && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        e.preventDefault();
                        self.$menuToggle.focus();
                    }
                });

                // Set focus to menu when tabbing on toggle button
                this.$menuToggle.bind('keydown', function(e) {
                    if (e.keyCode === 9 && !e.shiftKey && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        e.preventDefault();
                        self.$menu.find('li:first-child a').focus();
                    }
                });
            }

            // Keyboard accessible right menu
            if (this.position === 'right') {

                // Set focus to menu when tabbing on toggle button
                this.$menuToggle.bind('keydown', function(e) {
                    if (e.keyCode === 9 && e.shiftKey && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        e.preventDefault();
                        self.$menu.find('li:last-child a').focus();
                    }
                });

                // At end of navigation block, return focus to toggle button
                this.$menu.find('li:last-child a').bind('keydown', function(e) {
                    if (e.keyCode === 9 && !e.shiftKey && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        e.preventDefault();
                        self.$menuToggle.focus();
                    }
                });
            }

            // Close menu if esc keydown and menu is open and set focus to toggle button
            $(document).bind('keydown', function(event) {
                if (event.keyCode === 27 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                    event.stopPropagation();
                    closeMenu(self, self.transitionDuration);
                    self.$menuToggle.focus();
                }
            });

        }

        // add event listeners
        if (this.wrapper.addEventListener) {
            this.wrapper.addEventListener('touchstart', this, false);
            this.wrapper.addEventListener('touchmove', this, false);
            this.wrapper.addEventListener('touchend', this, false);
            this.wrapper.addEventListener('touchcancel', this, false);
        }

    }

    window.OffCanvasMenuController.prototype = {

        start: null,

        handleEvent: function (e) {
            switch (e.type) {
                case 'touchstart': this.onTouchStart(e); break;
                case 'touchmove':  this.onTouchMove(e); break;
                case 'touchcancel':
                case 'touchend': this.onTouchEnd(e); break;
            }
        },

        currentPosition: function(){
            return this.position == 'left' ? this.$menu.offset().left + this.expandedWidth
                : this.$menu.offset().left;
        },

        inBounds: function(position){
            return (this.position == 'left' && position >= -25 && position <= this.expandedWidth) ||
                (this.position == 'right' && position >= -this.expandedWidth && position <= 25);
        },

        onTouchStart: function(e){

            // Escape if Menu is closed
            if(!this.$menuExpandedClassTarget.hasClass(this.menuExpandedClass))
                return;

            var pageX = e.touches[0].pageX;

            this.start = {
                startingX: this.currentPosition(),

                // get touch coordinates for delta calculations in onTouchMove
                pageX: pageX,
                pageY: e.touches[0].pageY
            };

            // reset deltaX
            this.deltaX = this.$wrapper.position().left;

            // used for testing first onTouchMove event
            this.isScrolling = undefined;

            // set transition time to 0 for 1-to-1 touch movement
            this.wrapper.style.MozTransitionDuration = this.wrapper.style.webkitTransitionDuration = 0;
            this.overlay.style.MozTransitionDuration = this.overlay.style.webkitTransitionDuration = 0;

            e.stopPropagation();
        },

        onTouchMove: function(e){

            this.deltaX = e.touches[0].pageX - this.start.pageX;

            // determine if scrolling test has run - one time test
            if (typeof this.isScrolling == 'undefined') {
                this.isScrolling = !!(this.isScrolling || Math.abs(this.deltaX) < Math.abs(e.touches[0].pageY - this.start.pageY));
            }

            // if user is not trying to scroll vertically
            if (!this.isScrolling) {

                // prevent native scrolling
                e.preventDefault();

                var newPos = this.position == 'left' ? this.start.startingX + this.deltaX
                    : this.deltaX - ($(window).width() - this.start.startingX);

                var opacity = (this.overlayOpacity / this.expandedWidth) * Math.abs(newPos);

                if(!this.inBounds(newPos))
                    return;

                // translate immediately 1-to-1
                this.wrapper.style.MozTransform = this.wrapper.style.webkitTransform = 'translate(' + newPos + 'px,0)';
                this.overlay.style.opacity = opacity;

                e.stopPropagation();
            }


        },

        onTouchEnd: function(e){

            // Escape if invalid start:
            if(!this.start)
                return;

            var newPos = this.position == 'left' ? this.start.startingX + this.deltaX
                : this.deltaX - ($(window).width() - this.start.startingX);

            // Converting to positive number
            var absNewPos = Math.abs(newPos);

            // if not scrolling vertically
            if (!this.isScrolling) {

                this.$wrapper.removeAttr('style');

                if ( ( this.position == 'left' && ( absNewPos <= (this.expandedWidth * 0.66) || newPos <= 0 ) ) ||
                    ( this.position == 'right' && ( absNewPos <= (this.expandedWidth * 0.66) || newPos >= 0 ) ) ) {
                    closeMenu(this, this.transitionDuration);
                } else {
                    openMenu(this);
                    this.$overlay.removeAttr('style');
                }
            }

            // Reset start object:
            this.start = null;

            e.stopPropagation();
        }

    }
})(window);