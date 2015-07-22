"use strict";

(function(window) {

    function openMenu(self) {
        self.$menu.show().addClass('opened');
        setTimeout(function() {
            self.$menuExpandedClassTarget['addClass'](self.menuExpandedClass);
            self.$menuToggle.attr({'aria-expanded': 'true'}).attr('disabled', 'disabled');
        }, 100);
    }

    function closeMenu(self, transitionDuration) {
        self.$menuExpandedClassTarget['removeClass'](self.menuExpandedClass);
        self.$menuToggle.attr({'aria-expanded': 'false'});
        self.$overlay.removeAttr('style');
        setTimeout(function() {
            self.$menu.removeAttr('style').removeClass('opened');
            self.$menuToggle.removeAttr('disabled');
        }, transitionDuration);
    }

    window.OffCanvasMenuController = function(options){

        options = options || {};

        // The menu
        this.$menu = options.$menu;
        this.menu = this.$menu[0];
        this.menuExpandedClass = options.menuExpandedClass;

        // Escape if the menu is not found.
        if(this.$menu.length == 0 || !this.menuExpandedClass)
            return;

        this.$menuToggle = options.$menuToggle || [];
        this.position = options.position || 'left';
        this.$wrapper = options.wrapper || this.$menu.parent();
        this.wrapper = this.$wrapper[0];
        this.$menuExpandedClassTarget = options.$menuExpandedClassTarget || this.$wrapper;
        this.dragHandleOffset = options.dragHandleOffset || this.$menuToggle.outerWidth();
        this.expandedWidth = this.$menu.outerWidth();
        this.ariaControls = options.ariaControls || this.$menu.selector.replace('#', '');

        // The overlay
        if ( !$('.off-canvas-overlay').length ) {
            this.$wrapper.append('<div class="off-canvas-overlay"></div>');
        }
        this.$overlay = options.$overlay || $('.off-canvas-overlay');
        this.overlay = this.$overlay[0];
        this.overlayOpacity = options.overlayOpacity || '0.5';

        // Get set transition
        var transition = this.$menu.css('transition-duration');
        this.transitionDuration = transition.replace('s', '') * 1000;

        // If we have a toggle button available
        if(this.$menuToggle.length > 0){
            var self = this;

            // Set ARIA attributes
            this.$menuToggle.attr({
                'role': 'button',
                'aria-controls': self.ariaControls,
                'aria-expanded': 'false'
            });

            // Set up toggle button:
            this.$menuToggle.click(function(event){
                event.stopPropagation();
                openMenu(self, self.transitionDuration);
            });

            // Close menu by clicking anywhere
            this.$wrapper.click(function(){
                closeMenu(self, self.transitionDuration);
            });

            // Don't close the menu when clicked on sidemenu
            this.$menu.click(function(event){ event.stopPropagation(); });

            if (this.position === 'left') {
                // At start of navigation block, return focus to toggle button
                this.$menu.find('li:first-child a').bind('keydown', function(e) {
                    if (e.keyCode === 9 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        if (e.shiftKey) {
                            e.preventDefault();
                            self.$menuToggle.focus();
                        }
                    }
                });

                // Set focus to menu when tabbing on toggle button
                this.$menuToggle.bind('keydown', function(e) {
                    if (e.keyCode === 9 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            self.$menu.find('li:first-child a').focus();
                        }
                    }
                });
            }

            if (this.position === 'right') {
                // Set focus to menu when tabbing on toggle button
                this.$menuToggle.bind('keydown', function(e) {
                    if (e.keyCode === 9 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        if (e.shiftKey) {
                            e.preventDefault();
                            self.$menu.find('li:last-child a').focus();
                        }
                    }
                });

                // At end of navigation block, return focus to toggle button
                this.$menu.find('li:last-child a').bind('keydown', function(e) {
                    if (e.keyCode === 9 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            self.$menuToggle.focus();
                        }
                    }
                });
            }

            // Close menu if esc keydown and menu is open and set focus to toggle button
            $(document).bind('keydown', function(e) {
                if (e.keyCode === 27 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
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
            return (this.position == 'left' && position >= 0 && position <= this.expandedWidth) ||
                (position >= -this.expandedWidth && position <= 0);
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
            this.menu.style.MozTransitionDuration = this.menu.style.webkitTransitionDuration = 0;

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
                this.menu.style.MozTransform = this.menu.style.webkitTransform = 'translate(' + newPos + 'px,0)';
                this.overlay.style.opacity = opacity;

                e.stopPropagation();
            }


        },

        onTouchEnd: function(e){

            var self = this;

            // Escape if invalid start:
            if(!this.start)
                return;

            var newPos = this.position == 'left' ? this.start.startingX + this.deltaX
                : this.deltaX - ($(window).width() - this.start.startingX);

            // Converting into positive number
            newPos = Math.abs(newPos);

            // if not scrolling vertically
            if (!this.isScrolling) {

                this.$menu.removeAttr('style');

                if ( newPos <= (self.expandedWidth * 0.66) ) {
                    closeMenu(self, self.transitionDuration);
                } else {
                    openMenu(self);
                    this.$overlay.removeAttr('style');
                }
            }

            // Reset start object:
            this.start = null;

            e.stopPropagation();
        }

    }
})(window);
