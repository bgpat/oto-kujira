/*! Copyright (c) 2014 bgpat (bgpat.tak@gmail.com)
 * Licensed under the MIT License.
 * Version: 0.1
 * Requires: jQuery 1.6.0+
 */

jQuery(function() {
    jQuery.extend({
    });
    jQuery.fn.extend({
        canvasContext: function() {
            try {
                return this.get(0).getContext('2d');
            } catch(e) {
                return null;
            }
        },
        canvas: function(callback) {
            return this.each(function() {
                var ctx = $(this).canvasContext();
                callback.call(this, ctx);
            });
        },
        pattern: function(f, width, height, type) {
            if(typeof f === 'function'){
                return $(this).canvasContext().createPattern($('<canvas>').prop({
                    width: width,
                    height: height
                }).canvas(f).get(0), type || 'repeat');
            }else{
                return $(this).canvasContext().createPattern($(f).get(0), width || 'repeat');
            }
        }
    });
});
