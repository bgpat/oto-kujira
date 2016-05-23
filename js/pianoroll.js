$(function(){
    $.loader({
        pianoroll: {url: 'pianoroll.json'}
    }, function(loader){
        var data = loader.pianoroll;
        var noteList = [];
        var selections = null;
        var resizeNote = null;
        var noteReload = false;
        var pianoroll = $('#pianoroll');
        var keyboard = $('.keyboard', pianoroll);
        var roll = $('.roll', pianoroll);
        var graph = $('.graph', pianoroll);
        var keyboardHeight = data.keyboard.whiteKeyHeight;
        var whiteKeyWidth = data.keyboard.whiteKeyWidth;
        var blackKeyWidth = data.keyboard.blackKeyWidth;
        var blackKeyHeight = data.keyboard.blackKeyHeight;
        var staffWidth = whiteKeyWidth * 7 / 12;
        var barHeight = data.roll.barHeight;
        function resizePianoroll(){
            var w = $(window).width();
            var h = $(window).height();
            var rollHeight = h - keyboardHeight;
            pianoroll.width(w).height(h);
            roll.height(rollHeight).css('top', keyboardHeight);
            $('canvas', roll).prop('height', rollHeight);
            $('.roll-bar', roll).prop('height', function(i, h){return (h / barHeight + 1 | 0) * barHeight;}).canvas(function(c){
                c.clearRect(0, 0, this.width, this.height);
                c.beginPath();
                for(var y = 0; y <= this.height; y += barHeight){
                    c.moveTo(0, y);
                    c.lineTo(this.width, y);
                }
                c.closePath();
                c.strokeStyle = data.roll.barColor;
                c.lineWidth = data.roll.barWidth;
                c.stroke();
            });
            roll.mousewheel();
        };
        (function drawPianoroll(){
            var _key = $('<div>').addClass('keyboard-key').on('mousedown', function(){
                var number = $(this).data('number');
                if(selections){
                    for(var i = selections.length; i-- > 0;){
                        var selection = selections[i];
                        selection.number = number;
                    }
                    noteReload = true;
                }else{
                    addNote(number);
                }
            });
            for(var i = 0, x = 0; i < data.keyboard.numberOfKeys; i++){
                var key = _key.clone(true).data('number', i);
                var blackKeyPosition = data.keyboard.blackKeyPositions[i % 12];
                if(blackKeyPosition === null){
                    key.addClass('keyboard-white-key').css({
                        width: whiteKeyWidth - 2,
                        height: keyboardHeight - 3,
                        left: x
                    });
                    x += whiteKeyWidth;
                }else{
                    key.addClass('keyboard-black-key').css({
                        width: blackKeyWidth - 2,
                        height: blackKeyHeight - 2,
                        left: x - blackKeyWidth * (0.5 - blackKeyPosition)
                    });
                }
                if(i % 12 === 0){
                    key.append($('<span>').text(i / 12 - 1));
                }
                key.appendTo(keyboard);
            }
            keyboard.css({
                width: x,
                height: keyboardHeight
            });
            roll.width(x).data('scroll', 0);
            $('canvas', roll).prop('width', x);
            $('.roll-staff', roll).prop({
                width: whiteKeyWidth * 7,
                height: 1
            }).canvas(function(c){
                c.beginPath();
                c.rect(0, 0, this.width, this.height);
                c.closePath();
                c.fillStyle = data.roll.whiteColor;
                c.fill();
                c.fillStyle = data.roll.blackColor;
                c.strokeStyle = data.roll.staffColor;
                c.lineWidth = data.roll.staffWidth;
                for(var i = 0; i < 12; i++){
                    if(data.keyboard.blackKeyPositions[i] !== null){
                        c.beginPath();
                        c.rect(i * staffWidth , 0, staffWidth, this.height);
                        c.closePath();
                        c.fill();
                    }
                    c.beginPath();
                    c.moveTo(i * staffWidth, 0);
                    c.lineTo(i * staffWidth, this.height);
                    c.closePath();
                    c.stroke();
                }
                roll.css('background-image', 'url(' + this.toDataURL() + ')');
            });
            $('.roll-bar-label', roll).css({
                marginTop: 12 - barHeight * 0.5,
                marginLeft: 4,
                lineHeight: barHeight + 'px'
            });
            roll.mousewheel(function(e){
                e.preventDefault();
                if(e.deltaFactor === 0[0]){
                    e.deltaFactor = 0;
                    e.deltaX = 0;
                    e.deltaY = 0;
                }
                pianoroll.scrollLeft(pianoroll.scrollLeft() + e.deltaX * e.deltaFactor);
                var scroll = Math.min(0, +roll.data('scroll') + e.deltaY * e.deltaFactor);
                roll.data('scroll', scroll);
                $('.roll-bar-label', this).each(function(){
                    var n = [];
                    for(var y = 0, i = 1 - scroll / barHeight | 0; y < $(window).height() + barHeight; y += barHeight, i++){
                        n.push(i);
                    }
                    $(this).text(n.join('\n')).css({marginTop: 12 - barHeight * 0.5 + scroll % barHeight});
                });
                $('.roll-bar', this).css('top', scroll % barHeight);
                $('.roll-notes', this).css('top', function(){return scroll - $(this).data('scroll');});
                $('.roll-seekbar, .roll-endbar', this).css('margin-top', scroll);
                noteReload = true;
            });
        })();
        function drawNotes(){
            if(noteReload){
                var scroll = roll.data('scroll');
                var end = 0;
                $('.roll-notes', roll).css('top', 0).canvas(function(c){
                    c.clearRect(0, 0, this.width, this.height);
                    c.strokeStyle = rgbstr(hsv2rgb(150, 0.5, 0x99));
                    c.lineWidth = 1;
                    for(var i = 0; i < noteList.length; i++){
                        var note = noteList[i];
                        var y = note.start * barHeight + scroll;
                        var h = note.length * barHeight;
                        if(0 <= y + h && y <= this.height){
                            c.fillStyle = rgbastr(hsv2rgb(150, 1, 0xff), selections && selections.reduce(function(a, b){return a || b === note;}, false) ? 0.6 : 0.2);
                            c.beginPath();
                            c.rect(note.number * staffWidth, y, staffWidth, h);
                            c.closePath();
                            c.fill();
                            c.stroke();
                        }
                        end = Math.max(end, note.start + note.length);
                    }
                }).data('scroll', scroll);
                $('.roll-endbar', roll).css('top', end * barHeight);
                noteReload = false;
            }
            setTimeout(drawNotes, data.animationInterval);
        }
        function rollPosition(x, y){
            var p = roll.position();
            var ax = (x || window.x) - p.left;
            var ay = (y || window.y) - p.top - roll.data('scroll');
            var rx = ax / staffWidth;
            var ry = ay / barHeight;
            return {
                x: Math.min(data.keyboard.numberOfKeys, Math.max(0, rx)),
                y: Math.max(0, ry),
                ax: ax,
                ay: ay,
                rx: rx,
                ry: ry
            };
        }
        function getNotes(x1, y1, x2, y2){
            var res = [];
            var tmp;
            if(x1 > x2){
                tmp = x1;
                x1 = x2;
                x2 = tmp;
            }
            if(y1 > y2){
                tmp = y1;
                y1 = y2;
                y2 = tmp;
            }
            for(var i = noteList.length; i > 0;){
                var note = noteList[--i];
                if(x1 <= note.number && note.number + 1 <= x2 && y1 <= note.start && note.start + note.length <= y2){
                    res.push(note);
                }
            }
            if(res.length){
                return res;
            }else{
                return null;
            }
        }
        function getNote(x, y){
            for(var i = noteList.length; i > 0;){
                var note = noteList[--i];
                if(x - 1 <= note.number && note.number < x && note.start <= y && y < note.start + note.length){
                    return note;
                }
            }
            return null;
        }
        function getBarPosition(selector){
            var e = $(selector);
            return (e.position().top + parseFloat(e.css('margin-top'))) / barHeight;
        }
        function addNote(number, start, length){
            noteList.push(new Scherzo.Note(number, start || (getBarPosition($('.roll-endbar', roll)) * 16 | 0) / 16, length || 0.25));
            noteReload = true;
        }
        function changeCursor(){
            var p = rollPosition();
            if(roll.data('drag')){
                if($('.roll-seekbar', roll).data('drag')){
                    $(this).css('cursor', 'row-resize');
                }else{
                    if(selections === null){
                        $(this).css('cursor', 'crosshair');
                    }else if(resizeNote === null){
                        $(this).css('cursor', 'move');
                    }
                }
            }else{
                var note = getNote(p.x, p.y);
                for(var i = selections && selections.length; i-- > 0;){
                    var selection = selections[i];
                    if(selection === note){
                        if(getNote(p.x, p.y - 4 / barHeight) !== selection){
                            $(this).css('cursor', 'n-resize');
                        }else if(getNote(p.x, p.y + 4 / barHeight) !== selection){
                            $(this).css('cursor', 's-resize');
                        }else{
                            $(this).css('cursor', 'move');
                        }
                        return;
                    }
                }
                $(this).css('cursor', note === null ? 'default' : 'pointer');
            }
        }
        roll.on('mousedown', function(e){
            var p = rollPosition();
            var note = getNote(p.x, p.y);
            roll.data('drag', {
                position: p,
                time: e.timeStamp
            });
            if(note !== null){
                if(~(selections || []).indexOf(note)){
                    if(getNote(p.x, p.y + 4 / barHeight) !== note){
                        resizeNote = 1;
                    }else if(getNote(p.x, p.y - 4 / barHeight) !== note){
                        resizeNote = -1;
                    }
                }else{
                    if(e.shiftKey){
                        selections.push(note);
                    }else{
                        selections = [note];
                    }
                }
            }else{
                selections = null;
                var seekbar = $('.roll-seekbar', roll);
                if(seekbar.is(e.target)){
                    seekbar.data('drag', p.ay);
                }else{
                    seekbar.removeData('drag');
                }
            }
            noteReload = true;
        }).on('mousemove mousedown mouseup mousewheel', changeCursor);
        drawNotes();
        $(window).resize(function(){
            resizePianoroll();
        }).on('mousemove', roll, function(e){
            e.preventDefault();
            var drag = roll.data('drag');
            if(drag){
                var p = rollPosition(e.clientX, e.clientY);
                if(selections){
                    selections.x = selections.x || 0;
                    selections.y = selections.y || 0;
                    var dx = p.x - drag.position.x - selections.x | 0;
                    var dy = ((p.y - drag.position.y - selections.y) * 16 | 0) / 16;
                    selections.x += dx;
                    selections.y += dy;
                    for(var i = selections.length; i-- > 0;){
                        var selection = selections[i];
                        if(resizeNote === null){
                            selection.number += dx;
                            selection.start += dy;
                        }else{
                            selection.length += dy * resizeNote;
                            if(resizeNote < 0){
                                selection.start += dy;
                            }
                        }
                        noteReload = true;
                    }
                }else{
                    var seekbar = $('.roll-seekbar', roll);
                    var dragSeekbar = seekbar.data('drag');
                    if(dragSeekbar !== 0[0]){
                        var y = Math.max(0, Math.min(parseFloat($('.roll-endbar', roll).css('top')), p.ay));
                        seekbar.css('top', function(i, v){
                            return parseFloat(v) + y - dragSeekbar;
                        }).data('drag', y);
                    }else{
                        $('.roll-overlay', roll).canvas(function(c){
                            c.clearRect(0, 0, this.width, this.height);
                            c.strokeStyle = 'rgba(52, 108, 255, 0.8)';
                            c.lineWidth = 1;
                            c.fillStyle = 'rgba(52, 108, 255, 0.5)';
                            c.beginPath();
                            c.rect(drag.position.ax, drag.position.ay + roll.data('scroll'), p.ax - drag.position.ax, p.ay - drag.position.ay);
                            c.closePath();
                            c.stroke();
                            c.fill();
                        });
                    }
                }
            }
        }).on('mousedown', function(e){
            e.preventDefault();
        }).on('mouseup', roll, function(e){
            $('.roll-overlay', roll).canvas(function(c){
                c.clearRect(0, 0, this.width, this.height);
            });
            var drag = roll.data('drag');
            var p = rollPosition(e.clientX, e.clientY);
            if(selections === null && drag){
                if(resizeNote === null){
                    selections = getNotes(drag.position.x, drag.position.y, p.x, p.y);
                    noteReload = true;
                }
            }else{
                if(selections){
                    selections.x = 0;
                    selections.y = 0;
                }
            }
            resizeNote = null;
        }).on('mouseup', function(e){
            e.preventDefault();
            var drag = roll.data('drag');
            roll.data('drag', null);
        }).resize().on('mousemove mousewheel', function(e){
            e.preventDefault();
            window.x = e.clientX;
            window.y = e.clientY;
        }).on('contextmenu', function(e){e.preventDefault();});
    });
});
