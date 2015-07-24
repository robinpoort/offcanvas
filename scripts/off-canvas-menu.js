/* @preserve
 * Off canvas menu
 * Copyright 2015 Robin Poort
 * http://www.robinpoort.com
 */

"use strict";

(function($) {

    $.offCanvasMenu = function(element, options) {

        var defaults = {
                menu: $(element),
                position: 'left',
                menuExpandedClass: 'show-left-menu',
                container: $(element).parent(),
                menuToggle: [],
                expandedWidth: $(element).outerWidth(),
                offCanvasOverlay: 'off-canvas-overlay'
            },
            plugin = this;


        plugin.settings = {};

        plugin.init = function() {

            plugin.settings = $.extend({}, defaults, options);

            var $element = $(element),
                element = element,
                menu = plugin.settings.menu,
                position = plugin.settings.position,
                menuExpandedClass = plugin.settings.menuExpandedClass,
                container = plugin.settings.container,
                menuToggle = plugin.settings.menuToggle,
                ariaControls = plugin.settings.ariaControls,
                wrapper = container.parent(),
                expandedWidth = menu.outerWidth(),
                offCanvasOverlay = $('.' + plugin.settings.offCanvasOverlay);

            // Set proper menuExpandedClass if not set manually
            if ( position === 'right' && !options.menuExpandedClass ) {
                menuExpandedClass = 'show-right-menu';
            }

            // Set proper menuExpandedClass if not set manually
            if ( wrapper.is('body') ) {
                wrapper = $('html, body');
            }

            // Create overlay container
            if ( !offCanvasOverlay.length ) {
                container.append('<div class="' + plugin.settings.offCanvasOverlay + '"></div>');
            }

            // Vars after corrections
            var overlay = $('.' + plugin.settings.offCanvasOverlay),
                overlayOpacity = '0.75',
                transitionDuration = container.css('transition-duration').replace('s', '') * 1000;

            function tabToggle(menu) {
                // When tabbing on toggle button
                menuToggle.bind('keydown', function(e) {
                    if (e.keyCode === 9 && menu.is(':visible')) {
                        e.preventDefault();
                        if ( e.shiftKey ) {
                            menu.find(':tabbable').last().focus();
                        } else {
                            menu.find(':tabbable').first().focus();
                        }
                    }
                });

                // When tabbing on first tabbable menu item
                menu.find(':tabbable').first().bind('keydown', function(e) {
                    if (e.keyCode === 9 && menu.is(':visible')) {
                        if ( e.shiftKey ) {
                            e.preventDefault();
                            menuToggle.focus();
                        }
                    }
                });

                // When tabbing on last tabbable menu item
                menu.find(':tabbable').last().bind('keydown', function(e) {
                    if (e.keyCode === 9 && menu.is(':visible')) {
                        if ( !e.shiftKey ) {
                            e.preventDefault();
                            menuToggle.focus();
                        }
                    }
                });
            }

            function openMenu(menu) {
                menu.show();
                container.addClass(menuExpandedClass);
                menuToggle.attr({'aria-expanded': 'true'});
                container.addClass('opened');
                wrapper.css({'overflow-x': 'hidden', 'position': 'relative'});
                container.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(e) {
                    // When container transition has ended add the 'opened' class
                    // We do this to always win over the closing transitionend
                    menu.addClass('opened');
                    container.addClass('opened');
                    wrapper.css({'overflow-x': 'hidden', 'position': 'relative'});
                });
                // Enable toggling
                tabToggle(menu);
            }

            function closeMenu(menu) {
                container.removeClass(menuExpandedClass);
                menuToggle.attr({'aria-expanded': 'false'});
                //overlay.removeAttr('style');
                container.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(e) {
                    // Remove style and class only on transationend
                    // We do this so the menu stays visible on closing
                    menu.removeAttr('style').removeClass('opened');
                    container.removeClass('opened');
                    wrapper.removeAttr('style');
                });
            }

            function toggleMenu(menu, transitionDuration) {
                var method = !container.hasClass(menuExpandedClass) ? 'closed' : 'opened';
                if ( method === 'closed' ) { openMenu(menu); }
                if ( method === 'opened' ) { closeMenu(menu, transitionDuration); }
            }

            // If we have a toggle button available
            if(menuToggle.length){

                // Set ARIA attributes
                menuToggle.attr({
                    'role': 'button',
                    'aria-controls': ariaControls,
                    'aria-expanded': 'false'
                });

                // Toggle button:
                menuToggle.click(function(event){
                    event.stopPropagation();
                    toggleMenu(menu, transitionDuration);
                });

                // Close menu by clicking anywhere
                container.click(function(event){
                    if ( container.hasClass(menuExpandedClass) ) {
                        event.stopPropagation();
                        closeMenu(menu, transitionDuration);
                    }
                });

                // Don't close the menu when clicked on sidemenu
                menu.click(function(event){
                    event.stopPropagation();
                });

                // Close menu if esc keydown and menu is open and set focus to toggle button
                $(document).bind('keydown', function(event) {
                    if (event.keyCode === 27 && container.hasClass(menuExpandedClass)) {
                        event.stopPropagation();
                        closeMenu(menu, transitionDuration);
                        menuToggle.focus();
                    }
                });
            }


            // Touch actions
            if ('ontouchstart' in document.documentElement) {
                wrapper.on('touchstart', onTouchStart);
                wrapper.on('touchmove', onTouchMove);
                wrapper.on('touchend', onTouchEnd);
            }

            // vars
            var started = null,
                start = {},
                deltaX,
                pageX,
                isScrolling = false;

            // Functions
            function currentPosition() {
                return position == 'left' ? menu.offset().left + expandedWidth
                    : menu.offset().left;
            }

            function inBounds(newPos) {
                return (position == 'left' && newPos >= -25 && newPos <= expandedWidth) ||
                    (position == 'right' && newPos >= -(expandedWidth) && newPos <= 25);
            }

            function onTouchStart(e) {

                // Escape if Menu is closed
                if(!container.hasClass(menuExpandedClass))
                    return;

                // Set started to true (used by touchend)
                started = true;

                // Get original starting point
                pageX = e.originalEvent.touches[0].pageX;

                // Setting the start object for 'move' and 'end'
                start = {
                    startingX: currentPosition(),
                    // get touch coordinates for delta calculations in onTouchMove
                    pageX: pageX,
                    pageY: e.originalEvent.touches[0].pageY
                };

                // reset deltaX
                deltaX = container.position().left;

                // used for testing first onTouchMove event
                isScrolling = undefined;

                // Add class to remove transition for 1-to-1 touch movement
                container.addClass('no-transition');
                overlay.addClass('no-transition');

                e.stopPropagation();
            }

            function onTouchMove(e) {

                deltaX = e.originalEvent.touches[0].pageX - start.pageX;

                // determine if scrolling test has run - one time test
                if (typeof isScrolling == 'undefined') {
                    isScrolling = !!(isScrolling || Math.abs(deltaX) < Math.abs(e.originalEvent.touches[0].pageY - start.pageY));
                }

                // if user is not trying to scroll vertically
                if (!isScrolling) {

                    // prevent native scrolling
                    e.preventDefault();

                    var newPos = position == 'left' ? start.startingX + deltaX
                        : deltaX - ($(window).width() - start.startingX);

                    var opacity = (overlayOpacity / expandedWidth) * Math.abs(newPos);

                    if(!inBounds(newPos))
                        return;

                    // translate immediately 1-to-1
                    $(container).css({
                        '-webkit-transform' : 'translate(' + newPos + 'px, 0)',
                        '-moz-transform'    : 'translate(' + newPos + 'px, 0)',
                        '-ms-transform'     : 'translate(' + newPos + 'px, 0)',
                        '-o-transform'      : 'translate(' + newPos + 'px, 0)',
                        'transform'         : 'translate(' + newPos + 'px, 0)'
                    });
                    overlay.css('opacity' ,opacity);

                    e.stopPropagation();
                }


            }

            function onTouchEnd(e){

                // Escape if invalid start:
                if(!started)
                    return;

                // Escape if Menu is closed
                if(!container.hasClass(menuExpandedClass))
                    return;

                var newPos = position == 'left' ? start.startingX + deltaX
                    : deltaX - ($(window).width() - start.startingX);

                // Converting to positive number
                var absNewPos = Math.abs(newPos);

                // if not scrolling vertically
                if (!isScrolling) {

                    container.removeAttr('style').removeClass('no-transition');
                    overlay.removeAttr('style').removeClass('no-transition');

                    if ( ( position == 'left' && ( absNewPos <= (expandedWidth * 0.66) || newPos <= 0 ) ) ||
                        ( position == 'right' && ( absNewPos <= (expandedWidth * 0.66) || newPos >= 0 ) ) ) {
                        closeMenu(menu, transitionDuration);
                    } else {
                        openMenu(menu);
                    }
                }

                // Reset start object and starting variable:
                started = null;
                start = {};

                e.stopPropagation();
            }

        };

        plugin.init();

    };


    // add the plugin to the jQuery.fn object
    $.fn.offCanvasMenu = function(options) {
        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function() {
            // if plugin has not already been attached to the element
            if (undefined == $(this).data('offCanvasMenu')) {
                // create a new instance of the plugin
                var plugin = new $.offCanvasMenu(this, options);
                // in the jQuery version of the element
                // store a reference to the plugin object
                $(this).data('offCanvasMenu', plugin);
            }
        });
    }

})(jQuery);