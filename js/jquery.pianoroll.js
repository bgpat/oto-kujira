jQuery(function(){
    var $ = jQuery;
    $.pianoroll = {
        NoteObject: function(pianoroll, number, offset, gate, style){
            this.pianoroll = pianoroll;
            this.number = number || 0;
            this.offset = offset || 0;
            this.gate = gate || 0;
            this.style = $.extend({
                color: 0,
                dragable: true
            }, style);
            this.hover = false;
            this.selected = false;
        },
        LineObject: function(pianoroll, offset, style){
            this.pianoroll = pianoroll;
            this.offset = offset || 0;
            this.style = $.extend({
                color: 0,
                width: 2,
                dragable: true
            }, style);
            this.hover = false;
            this.selected = false;
        }
    };
    $.extend($.pianoroll.NoteObject.prototype, {
        getCursor: function(number, offset){
            var option = this.pianoroll.data('option');
            if(this.style.dragable && this.number === number){
                if(this.offset <= offset && offset < this.offset + this.gate){
                    if(this.selected){
                        return 'move';
                    }else{
                        return 'pointer';
                    }
                }else if(this.offset - option.resizeWidth / option.barHeight <= offset && offset < this.offset + this.gate + option.resizeWidth / option.barHeight){
                    if(this.selected){
                        return (offset <= this.offset ? 'n' : 's') + '-resize';
                    }
                }
            }
            return 'default';
        },
        ondrag: function(note, prev, list){
            var option = this.pianoroll.data('option');
            note.number = Math.max(Math.min(note.number, option.range[1]), option.range[0]);
            note.offset = Math.max(note.offset, 0);
            if(note.gate <= 0){
                note.gate = option.grid;
                note.offset = prev.offset;
            }
        }
    });
    $.extend($.pianoroll.LineObject.prototype, {
        getCursor: function(_, offset){
            var option = this.pianoroll.data('option');
            if(this.style.dragable){
                if(this.offset - this.style.width / option.barHeight <= offset && offset < this.offset + this.style.width / option.barHeight){
                    return 'row-resize';
                }
            }
            return 'default';
        },
        ondrag: function(line, prev, list){
            line.offset = Math.max(line.offset, 0);
        }
    });
    $.fn.extend({
        pianoroll: function(option){
            option = $.extend({
                black: {
                    scale: 0.6,
                    positions: [null, -0.2, null, 0.2, null, null, -0.2, null, 0, null, 0.2, null]
                },
                keyWidth: 24,
                keyHeight: 128,
                sheetHeight: 480,
                staffWidth: 14,
                barHeight: 192,
                subBarHeight: 4,
                grid: 1 / 16,
                range: [0, 127],
                keyLabel: function(i){
                    if(i % 12 === 0){
                        return 'C' + (i / 12 - 1 | 0);
                    }
                },
                resizeWidth: 3
            }, option);
            var numberOfKeys = option.range[1] - option.range[0] + 1;
            var pianoroll = $(this).addClass('pianoroll').data('option', option);
            var sheet = $('<div>');
            var keyboard = $('<div>').addClass('pianoroll-keyboard');
            var keyElement = $('<div>')
                .addClass('pianoroll-keyboard-key')
                .append($('<span>').addClass('pianoroll-keyboard-key-label'))
                .on('mousedown', function(){
                    $(this).data('drag', false);
                    keyboard.trigger('keypressstart', $(this).data('number'));
                })
                .on('mousemove mouseout', function(){
                    if($(this).data('drag') === false){
                        keyboard.trigger('keypresscancel', $(this).data('number'));
                    }
                    if($(this).data('drag') !== null){
                        $(this).data('drag', true);
                    }
                })
                .on('mouseup', function(){
                    if($(this).data('drag') === false){
                        $(this).data('drag', null);
                        keyboard.trigger('keypressend', $(this).data('number'));
                    }
                })
                .on('mouseover', function(){
                    sheet.data('staffFocus', $(this).data('number'));
                });
            for(var i = option.range[0], key; i <= option.range[1]; i++){
                key = keyElement.clone(true).addClass('pianoroll-keyboard-' + (option.black.positions[i % option.black.positions.length] === null ? 'white' : 'black') + 'key');
                $('.pianoroll-keyboard-key-label', key).text((option.keyLabel || function(){})(i));
                key.data({
                    number: i,
                    drag: null
                }).appendTo(keyboard);
            }
            var staff = $('<canvas>').addClass('pianoroll-sheet-staff');
            var bar = $('<canvas>').addClass('pianoroll-sheet-bar');
            var barLabel = $('<span>').addClass('pianoroll-sheet-barlabel');
            var canvas = $('<canvas>').addClass('pianoroll-sheet-canvas');
            var overlay = $('<canvas>').addClass('pianoroll-sheet-overlay');
            sheet
                .addClass('pianoroll-sheet')
                .append([staff, bar, barLabel, canvas, overlay])
                .data({
                    scroll: 0,
                    drag: null,
                    staffFcus: null,
                    noteList: [],
                    previewList: [],
                    lineList: [],
                })
                .on('mousemove mouseout mousewheel', function(e, o){
                    if(sheet.data('drag')){
                        return;
                    }
                    var pos = sheet.parents('body *').toArray().reduce(function(a, b){
                        var p = $(b).position();
                        return {
                            left: a.left + p.left,
                            top: a.top + p.top
                        };
                    }, sheet.position());
                    var scroll = $(this).data('scroll');
                    var noteList = $(this).data().noteList;
                    var x = ((o && o.clientX) || e.clientX) - pos.left;
                    var y = ((o && o.clientY) || e.clientY) - pos.top + scroll;
                    var n = x / option.staffWidth + option.range[0] | 0;
                    var s = y / option.barHeight;
                    sheet.data('staffFocus', n);
                    for(var i = noteList.length, cursor = false; ~--i;){
                        var note = noteList[i];
                        var c = note.getCursor(n, s);
                        if(note.focus = c !== 'default'){
                            if(!cursor || note.selected){
                                cursor = c;
                            }else{
                                note.focus = false;
                            }
                        }
                    }
                    
                    $(this).css('cursor', cursor || 'default');
                })
                .on('mousedown', function(e){
                    var pos = sheet.parents('body *').toArray().reduce(function(a, b){
                        var p = $(b).position();
                        return {
                            left: a.left + p.left,
                            top: a.top + p.top
                        };
                    }, sheet.position());
                    var scroll = $(this).data('scroll');
                    var noteList = $(this).data().noteList;
                    var x = e.clientX - pos.left;
                    var y = e.clientY - pos.top + scroll;
                    var n = x / option.staffWidth + option.range[0] | 0;
                    var offset = y / option.barHeight;
                    var cursor = 'default';
                    for(var i = noteList.length; ~--i;){
                        var note = noteList[i];
                        var c = note.getCursor(n, offset);
                        if(c !== 'default'){
                            cursor = c;
                            if(c === 'pointer' || c === 'row-resize'){
                                for(var j = noteList.length; ~--j; noteList[j].selected = i === j);
                            }
                            break;
                        }
                    }
                    noteList = noteList.sort(function(a, b){
                        return a.selected ? 1: -1;
                    });
                    if(cursor === 'pointer'){
                        cursor = 'move';
                    }
                    if(cursor === 'default'){
                        for(var i = noteList.length; ~--i; noteList[i].selected = false);
                        cursor = 'crosshair';
                        sheet.data('staffFocus', null);
                    }
                    sheet.data('drag', {
                        x: x,
                        y: y,
                        dx: 0,
                        dy: 0,
                        cursor: cursor
                    });
                    $(this).css('cursor', cursor);
                });
            $(window)
                .on('mousemove', sheet, function(e){
                    var drag = sheet.data().drag;
                    var noteList = sheet.data('noteList');
                    var preview = sheet.data().previewList;
                    var old = preview.splice(0, preview.length);
                    var scroll = sheet.data('scroll');
                    var pos = sheet.parents('body *').toArray().reduce(function(a, b){
                        var p = $(b).position();
                        return {
                            left: a.left + p.left,
                            top: a.top + p.top
                        };
                    }, sheet.position());
                    var x = e.clientX - pos.left;
                    var y = e.clientY - pos.top + scroll;
                    var n = x / option.staffWidth + option.range[0] | 0;
                    var offset = y / option.barHeight;
                    if(drag){
                        var dx = x - drag.x;
                        var dy = y - drag.y;
                        for(var i = noteList.length; ~--i;){
                            var note = noteList[i];
                            if(note.selected){
                                var _note = $.extend({}, note);
                                _note.parent = note;
                                switch(drag.cursor){
                                    case 'move':
                                        _note.number += dx / option.staffWidth | 0;
                                        _note.offset += (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        break;
                                    case 'n-resize':
                                        var d = (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        _note.offset += d;
                                        _note.gate -= d;
                                        break;
                                    case 's-resize':
                                        _note.gate += (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        break;
                                    case 'row-resize':
                                        _note.offset += (dy / option.barHeight / option.grid | 0) * option.grid;
                                }
                                var prev = null;
                                for(var j = old.length; ~--j;){
                                    if(old[j].parent === note){
                                        prev = old[j];
                                    }
                                }
                                if(note.ondrag(_note, prev, noteList) === false){
                                    preview.merge(old);
                                }else{
                                    preview.push(_note);
                                }
                            }
                            if(drag.cursor === 'crosshair'){
                                if(note.number != null){
                                    var x1 = Math.min(x, drag.x) / option.staffWidth | 0;
                                    var x2 = Math.max(x, drag.x) / option.staffWidth | 0;
                                    var y1 = Math.min(y, drag.y) / option.barHeight;
                                    var y2 = Math.max(y, drag.y) / option.barHeight;
                                    note.selected = x1 <= note.number && note.number <= x2 && y1 <= note.offset + note.gate && note.offset < y2;
                                }
                            }
                        }
                        drag.dx = dx;
                        drag.dy = dy;
                    }
                })
                .on('mouseup', sheet, function(e){
                    var drag = sheet.data('drag');
                    var noteList = sheet.data('noteList');
                    var preview = sheet.data().previewList;
                    var old = preview.splice(0, preview.length);
                    var scroll = sheet.data('scroll');
                    var pos = sheet.parents('body *').toArray().reduce(function(a, b){
                        var p = $(b).position();
                        return {
                            left: a.left + p.left,
                            top: a.top + p.top
                        };
                    }, sheet.position());
                    var x = e.clientX - pos.left;
                    var y = e.clientY - pos.top + scroll;
                    var n = x / option.staffWidth + option.range[0] | 0;
                    var offset = y / option.barHeight;
                    if(drag){
                        var dx = x - drag.x;
                        var dy = y - drag.y;
                        for(var i = noteList.length; ~--i;){
                            var note = noteList[i];
                            var _note = $.extend({}, note);
                            if(note.selected){
                                switch(drag.cursor){
                                    case 'move':
                                        _note.number += dx / option.staffWidth | 0;
                                        _note.offset += (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        break;
                                    case 'n-resize':
                                        var d = (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        _note.offset += d;
                                        _note.gate -= d;
                                        break;
                                    case 's-resize':
                                        _note.gate += (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        break;
                                    case 'row-resize':
                                        _note.offset += (dy / option.barHeight / option.grid | 0 ) * option.grid;
                                        break;
                                }
                                var prev = null;
                                for(var j = old.length; ~--j;){
                                    if(old[j].parent === note){
                                        prev = old[j];
                                    }
                                }
                                note.ondrag(_note, prev, noteList);
                                $.extend(note, _note);
                            }
                        }
                    }
                    sheet.data('drag', null).trigger('mousemove', e);
                });
            pianoroll
                .append([sheet, keyboard])
                .on('scroll', function(e){
                    barLabel.css('margin-left', $(this).scrollLeft());
                })
                .on('mousewheel', function(e){
                    e.deltaFactor = e.deltaFactor || 0;
                    e.deltaX = e.deltaX || 0;
                    e.deltaY = e.deltaY || 0;
                    var x = e.deltaX * e.deltaFactor + pianoroll.scrollLeft();
                    var y = e.deltaY * e.deltaFactor;
                    var sheet = $('.pianoroll-sheet', this);
                    var scroll = sheet.data('scroll') - y;
                    if(scroll < 0){
                        scroll = 0;
                    }
                    sheet.data('scroll', scroll);
                    bar.css('margin-top', -scroll % option.barHeight);
                    barLabel
                        .css('margin-top', -(option.barHeight * 0.5 + scroll % option.barHeight))
                        .text(function(){
                            var str = [];
                            for(var i = 0; i < option.sheetHeight / option.barHeight + 1; i++){
                                str.push(scroll / option.barHeight + i + 1| 0);
                            }
                            return str.join('\n');
                        });
                    pianoroll.scrollLeft(x);
                    e.preventDefault();
                })
                .on('resizeKeyboard', function(e){
                    var option = $(this).data().option;
                    var numberOfKeys = option.range[1] - option.range[0] + 1;
                    var keyboard = $('.pianoroll-keyboard', this)
                        .css({
                            width: option.staffWidth * numberOfKeys,
                            height: option.keyHeight,
                        });
                    $('.pianoroll-keyboard-whitekey', keyboard)
                        .width(option.keyWidth)
                        .height(option.keyHeight)
                        .css('left', function(i){
                            return i * option.keyWidth;
                        });
                    $('.pianoroll-keyboard-blackkey', keyboard)
                        .width(option.keyWidth * option.black.scale)
                        .height(option.keyHeight * option.black.scale)
                        .css('left', function(){
                            return $(this).next('.pianoroll-keyboard-whitekey').position().left + (option.black.positions[$(this).data('number') % option.black.positions.length] - 0.5) * option.keyWidth * option.black.scale;
                        });
                    var first = $('.pianoroll-keyboard-key:eq(0)', keyboard);
                    if(first.hasClass('pianoroll-keyboard-blackkey')){
                        var x = first.position().left;
                        $('.pianoroll-keyboard-key', keyboard).css('left', function(i, v){
                            return parseFloat(v) - x;
                        });
                    }
                })
                .on('resizeSheet', function(){
                    var option = $(this).data().option;
                    var numberOfKeys = option.range[1] - option.range[0] + 1;
                    $('.pianoroll-sheet', this)
                        .width(option.staffWidth * numberOfKeys)
                        .height(option.sheetHeight);
                    $('.pianoroll-sheet-barlabel', sheet).css('line-height', option.barHeight + 'px');
                    $(this)
                        .trigger('drawStaff')
                        .trigger('drawBar');
                })
                .on('drawStaff', function(){
                    var option = $(this).data().option;
                    var numberOfKeys = option.range[1] - option.range[0] + 1;
                    var staff = $('.pianoroll-sheet-staff', this)
                        .prop({
                            width: option.staffWidth * numberOfKeys,
                            height: option.sheetHeight
                        })
                        .canvas(function(c){
                            c.clearRect(0, 0, option.staffWidth * numberOfKeys, option.sheetHeight);
                            c.fillStyle = '#fff';
                            c.fillRect(0, 0, option.staffWidth * numberOfKeys, option.sheetHeight);
                            c.fillStyle = '#eee';
                            c.strokeStyle = '#ccc';
                            c.lineWidth = 1;
                            c.beginPath();
                            for(var i = 0, n = option.range[0]; n <= option.range[1]; i++, n++){
                                c.moveTo(i * option.staffWidth, 0);
                                c.lineTo(i * option.staffWidth, option.sheetHeight);
                                if(option.black.positions[n % option.black.positions.length] !== null){
                                    c.fillRect(i * option.staffWidth, 0, option.staffWidth, option.sheetHeight);
                                }
                            }
                            c.closePath();
                            c.stroke();
                        });
                })
                .on('drawBar', function(){
                    var option = $(this).data().option;
                    var numberOfKeys = option.range[1] - option.range[0] + 1;
                    var bar = $('.pianoroll-sheet-bar', this)
                        .prop({
                            width: option.staffWidth * numberOfKeys,
                            height: (option.sheetHeight / option.barHeight + 2 | 0) * option.barHeight
                        })
                        .canvas(function(c){
                            c.clearRect(0, 0, option.staffWidth * numberOfKeys, option.sheetHeight);
                            for(var x  = 0; x < option.sheetHeight / option.barHeight + 2; x ++){
                                c.beginPath();
                                c.moveTo(0, x * option.barHeight);
                                c.lineTo(option.staffWidth * numberOfKeys, x * option.barHeight);
                                c.closePath();
                                c.strokeStyle = '#ccc';
                                c.lineWidth = 2;
                                c.stroke();
                                c.beginPath();
                                for(var i = 1; i < option.subBarHeight; i++){
                                    c.moveTo(0, (x + i / option.subBarHeight) * option.barHeight);
                                    c.lineTo(option.staffWidth * numberOfKeys, (x + i / option.subBarHeight) * option.barHeight);
                                }
                                c.closePath();
                                c.lineWidth = 0.5;
                                c.stroke();
                            }
                        });
                })
                .on('drawCanvas', function(){
                    var option = $(this).data().option;
                    var numberOfKeys = option.range[1] - option.range[0] + 1;
                    var canvas = $('.pianoroll-sheet-canvas', this)
                        .prop({
                            width: option.staffWidth * numberOfKeys,
                            height: option.sheetHeight
                        })
                        .canvas(function(c){
                            c.clearRect(0, 0, option.staffWidth * numberOfKeys, option.sheetHeight);
                            var notes = sheet.data('noteList');
                            var scroll = sheet.data('scroll');
                            for(var i = 0; i < notes.length; i++){
                                var note = notes[i];
                                switch(note.constructor){
                                    case $.pianoroll.NoteObject:
                                        c.lineWidth = 3;
                                        var x = (note.number - option.range[0]) * option.staffWidth + c.lineWidth * 0.5;
                                        var y = note.offset * option.barHeight - scroll + c.lineWidth * 0.5;
                                        var w = option.staffWidth - c.lineWidth;
                                        var h = note.gate * option.barHeight - c.lineWidth;
                                        c.roundRect(x, y, w, h, 2);
                                        c.fillStyle = rgbstr(hsv2rgb(note.style.color, note.focus ? 0.5 : 0.7, 255));
                                        c.strokeStyle = rgbstr(hsv2rgb(note.style.color, note.focus ? 0.5 : 0.7, 200));
                                        if(note.selected){
                                            c.lineWidth = 9;
                                        }
                                        c.stroke();
                                        c.fill();
                                        break;
                                    case $.pianoroll.LineObject:
                                        c.lineWidth = note.style.width;
                                        note.selected && (c.lineWidth *= 2);
                                        var y = note.offset * option.barHeight - scroll;
                                        c.line(0, y, numberOfKeys * option.staffWidth, y);
                                        c.strokeStyle = rgbstr(hsv2rgb(note.style.color, note.focus ? 0.5 : 1, 255));
                                        c.stroke();
                                        break;
                                }
                            }
                        });
                    pianoroll.trigger('drawOverlay');
                    requestAnimationFrame(function(){
                        pianoroll.trigger('drawCanvas');
                    });
                })
                .on('drawOverlay', function(_){
                    var option = $(this).data().option;
                    var numberOfKeys = option.range[1] - option.range[0] + 1;
                    var scroll = sheet.data('scroll');
                    var canvas = $('.pianoroll-sheet-overlay', this)
                        .prop({
                            width: option.staffWidth * numberOfKeys,
                            height: option.sheetHeight
                        })
                        .canvas(function(c){
                            c.clearRect(0, 0, option.staffWidth * numberOfKeys, option.sheetHeight);
                            var drag = sheet.data('drag');
                            if(drag && drag.cursor === 'crosshair'){
                                c.rect(drag.x, drag.y - scroll, drag.dx, drag.dy);
                                c.lineWidth = 1;
                                c.strokeStyle = 'rgba(52, 108, 255, 0.8)';
                                c.fillStyle = 'rgba(52, 108, 255, 0.3)';
                                c.stroke();
                                c.fill();
                            }
                            var staffFocus = sheet.data('staffFocus');
                            if(staffFocus != null){
                                var i = staffFocus - option.range[0];
                                c.strokeStyle = '#666';
                                c.lineWidth = 1;
                                c.beginPath();
                                c.moveTo(i * option.staffWidth, 0);
                                c.lineTo(i * option.staffWidth, option.sheetHeight);
                                c.moveTo(++i * option.staffWidth, 0);
                                c.lineTo(i * option.staffWidth, option.sheetHeight);
                                c.closePath();
                                c.stroke();
                            }
                            var notes = sheet.data('previewList');
                            for(var i = 0; i < notes.length; i++){
                                var note = notes[i];
                                switch(note.parent.constructor){
                                    case $.pianoroll.NoteObject:
                                        c.lineWidth = 3;
                                        var x = (note.number - option.range[0]) * option.staffWidth + c.lineWidth * 0.5;
                                        var y = note.offset * option.barHeight - scroll + c.lineWidth * 0.5;
                                        var w = option.staffWidth - c.lineWidth;
                                        var h = note.gate * option.barHeight - c.lineWidth;
                                        c.roundRect(x, y, w, h, 2);
                                        c.fillStyle = rgbastr(hsv2rgb(note.style.color, 0.5, 255), 0.5);
                                        c.strokeStyle = rgbastr(hsv2rgb(note.style.color, 0.5, 200), 0.5);
                                        c.stroke();
                                        c.fill();
                                        break;
                                    case $.pianoroll.LineObject:
                                        c.lineWidth = note.style.width;
                                        var y = note.offset * option.barHeight - scroll + c.lineWidth * 0.5;
                                        c.line(0, y, numberOfKeys * option.staffWidth, y);
                                        c.strokeStyle = rgbastr(hsv2rgb(note.style.color, 0.7, 255), 0.3);
                                        c.stroke();
                                        break;
                                }
                            }
                        });
                })
                .trigger('mousewheel')
                .trigger('resizeKeyboard')
                .trigger('resizeSheet')
                .trigger('drawCanvas');
            return this;
        }
    });
});
