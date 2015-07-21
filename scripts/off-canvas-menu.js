"use strict";

(function(window) {

    window.OffCanvasMenuController = function(options){

        options = options || {};

        this.$menu = options.$menu;
        this.menuExpandedClass = options.menuExpandedClass;

        // Escape if the menu is not found.
        if(this.$menu.length == 0 || !this.menuExpandedClass)
            return;

        this.$menuToggle = options.$menuToggle || [];
        this.$menuExpandedClassTarget = options.$menuExpandedClassTarget || $('body');
        this.position = options.position || 'left';

        this.$wrapper = options.wrapper || $('#outer-wrapper');
        this.wrapper = this.$wrapper[0];

        this.dragHandleOffset = options.dragHandleOffset || this.$menuToggle.outerWidth();
        this.expandedWidth = this.$menu.outerWidth();

        this.ariaControls = options.ariaControls || this.$menu.selector.replace('#', '');

        var transition = this.$wrapper.css('transition-duration');
        var transitionDuration = transition.replace('s', '') * 1000;

        if(this.$menuToggle.length > 0){
            var self = this;

            console.log(transition,transitionDuration);

            this.$menuToggle.attr({
                'role': 'button',
                'aria-controls': self.ariaControls,
                'aria-expanded': 'false'
            });

            function openMenu() {
                self.$menuExpandedClassTarget['addClass'](self.menuExpandedClass);
                self.$menu.css('display', 'block');
                self.$menuToggle.attr({'aria-expanded': 'true'});
            }

            function closeMenu() {
                self.$menuExpandedClassTarget['removeClass'](self.menuExpandedClass);
                self.$menuToggle.attr({'aria-expanded': 'false'});
                setTimeout(function() { self.$menu.removeAttr('style'); }, transitionDuration);
            }

            function toggleMenu() {
                var method = !self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass) ? 'closed' : 'opened';
                if ( method === 'closed' ) { openMenu(); }
                if ( method === 'opened' ) { closeMenu(); }
            }

            // Set up toggle button:
            this.$menuToggle.click(function(event){
                event.stopPropagation();
                toggleMenu();
            });

            // Close menu on clicking next to sidebar
            this.$wrapper.click(function(){
                closeMenu();
            });

            // Close menu if esc keydown and menu is open and set focus to toggle button
            this.$menuExpandedClassTarget.bind('keydown', function(e) {
                if (e.keyCode === 27 && self.$menuExpandedClassTarget.hasClass(self.menuExpandedClass)) {
                    closeMenu();
                    self.$menuToggle.focus();
                }
            });

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


            // Don't close the menu when clicked on sidemenu
            this.$menu.click(function(event){ event.stopPropagation(); });


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

            var pageX = e.touches[0].pageX;

            // Escape if invalid start touch position
            if(this.currentPosition() - this.dragHandleOffset > pageX ||
                this.currentPosition() + this.dragHandleOffset < pageX)
                return;

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

            e.stopPropagation();
        },

        onTouchMove: function(e){

            // Escape if invalid start or not in bounds:
            if(!this.start)
                return;

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

                if(!this.inBounds(newPos))
                    return;

                // translate immediately 1-to-1
                this.wrapper.style.MozTransform = this.wrapper.style.webkitTransform = 'translate3d(' + newPos + 'px,0,0)';

                e.stopPropagation();
            }


        },

        onTouchEnd: function(e){

            // Escape if invalid start:
            if(!this.start)
                return;

            // if not scrolling vertically
            if (!this.isScrolling) {

                // determine if swipe will trigger open/close menu
                var isOpeningMenu = (this.position == 'left' && this.deltaX > 0) ||
                    (this.position == 'right' && this.deltaX < 0);

                // Reset styles
                this.$wrapper.attr('style', '');

                // open/close menu:
                var method = isOpeningMenu ? 'addClass' : 'removeClass';
                this.$menuExpandedClassTarget[method](this.menuExpandedClass);
                if ( method === 'addClass' ) {
                    this.$menuToggle.attr({'aria-expanded': 'true'});
                    this.$menu.css('display', 'block');
                } else {
                    this.$menuToggle.attr({'aria-expanded': 'false'});
                    this.$menu.removeAttr('style');
                }
            }

            // Reset start object:
            this.start = null;

            e.stopPropagation();
        }

    }
})(window);
