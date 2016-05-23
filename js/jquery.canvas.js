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
                $.extend(ctx, {
                    line: function(x1, y1, x2, y2){
                        this.beginPath();
                        this.moveTo(x1, y1);
                        this.lineTo(x2, y2);
                        this.closePath();
                    },
                    rect: function(x, y, w, h){
                        this.beginPath();
                        this.moveTo(x, y);
                        this.lineTo(x + w, y);
                        this.lineTo(x + w, y + h);
                        this.lineTo(x, y + h);
                        this.closePath();
                    },
                    roundRect: function(x, y, w, h, r) {
                        this.beginPath();
                        this.moveTo(x, y + r);
                        this.arc(x + r, y + h - r, r, Math.PI, Math.PI * 0.5, 1);
                        this.arc(x + w - r, y + h - r, r, Math.PI * 0.5, 0, 1);
                        this.arc(x + w - r, y + r, r, 0, Math.PI * 1.5, 1);
                        this.arc(x + r, y + r, r, Math.PI * 1.5, Math.PI, 1);
                        this.closePath();
                    }
                });
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
