$(function(){
    $.loader({
    }, function(loader){
        var tempo;
        function changeTempo(v){
            tempo = v;
            $('.tempo').text(v);
        }
        changeTempo(120);
        var title;
        function changeTitle(s){
            title = s;
            $('.title').text(s);
            $('.btn-save > a').prop('download', s + '.mid');
        }
        changeTitle('kujira');
        var pianoroll = $('#pianoroll');
        pianoroll.pianoroll({sheetHeight: $(window).height() - 128 - pianoroll.position().top});
        var option = pianoroll.data().option;
        var data = $('.pianoroll-sheet', pianoroll).data();
        var endLine = new $.pianoroll.LineObject(pianoroll, 0, {color: 240});
        var playLine = new $.pianoroll.LineObject(pianoroll, 0, {color: 0});
        playLine.ondrag = function(line){
            line.offset = Math.max(Math.min(line.offset, endLine.offset), 0);
        };
        var color = Math.random() * 360;
        data.noteList = [endLine, playLine];
        var space = false;
        $(window).resize(function(){
            pianoroll.data().option.sheetHeight = $(this).height() - 128 - pianoroll.position().top;
            pianoroll.trigger('resizeKeyboard').trigger('resizeSheet');
        }).on('keydown', function(e){
            if(e.keyCode === 32 && !space){
                n = $('.microphone-peek').data('number');
                n != null && pianoroll.trigger('keypressstart', n);
                space = true;
            }
        }).on('keyup', function(e){
            if(e.keyCode === 32){
                pianoroll.trigger('keypressend', n);
                space = false;
            }
        });
        var key = null;
        pianoroll.on('keypressstart', function(_, n){
            if(!data.noteList.reduce(function(a, b){
                var f = b.selected && b.number != null;
                if(f){
                    b.number = n;
                }
                return a || f;
            }, false)){
                key = new $.pianoroll.NoteObject(
                    pianoroll,
                    n,
                    endLine.offset,
                    0,
                    {
                        color: color
                    }
                );
                data.noteList.push(key);
                (function(){
                    if(key){
                        key.gate += option.grid;
                        endLine.offset += option.grid;
                        setTimeout(arguments.callee, 60 * 1000 / tempo * option.grid);
                    }
                })();
            }
        }).on('keypressend', function(){
            key = null;
        }).on('keypresscancel', function(){
            data.noteList.splice(data.noteList.indexOf(key), 1);
            key.gate = 0;
            endLine.offset = data.noteList.reduce(function(a, b){
                return Math.max(a, b.offset + b.gate || 0);
            }, 0);
            key = null;
        });
        var microphone = new Microphone(function(list){
                var l = list.sort(function(a, b){return b.volume - a.volume;});
                $('.pianoroll-keyboard-key')
                    .removeClass('microphone-peek')
                    .filter(function(){
                        return $(this).data('number') === l[0].num;
                    })
                    .addClass('microphone-peek');
        });
        microphone.range = [36, 71];
        $('.btn-save').on('click', function(){
            var s = new Scherzo.SMF();
            var r = s.header.division * 4;
            s.setTimeSignature(4, 4);
            s.setTempo(120);
            s.setTitle(title);
            var t = s.createTrack();
            for(var i = 0; i < data.noteList.length; i++){
                var note = data.noteList[i];
                if(note.number != null){
                    t.createNote(note.offset * r, note.number, note.gate * r, 127);
                }
            }
            $('a', this).prop('href', URL.createObjectURL(s.toBlob()));
        });
        var ctx = new AudioContext();
        var mainv = ctx.createGain();
        mainv.connect(ctx.destination);
        function changeVolume(v){
            mainv.gain.value = Math.max(Math.min(parseInt(v) / 100, 100), 0);
            $('.volume').text(mainv.gain.value * 100 | 0);
        }
        changeVolume(50);
        var os = null, begin;
        $('.btn-play').on('click', function(){
            if(os){
                return;
            }
            var list = data.noteList.map(function(e){return e;}).sort(function(a, b){
                return a.offset - b.offset;
            });
            begin = playLine.offset;
            var end = endLine.offset;
            var i = 0;
            var p = begin;
            for(var i = list.length; ~--i;){
                list[i].gate || list.splice(i, 1);
            }
            i = 0;
            os = [];
            (function(){
                if(os === null){
                    return;
                }
                var t = ctx.currentTime;
                var note = list[i];
                for(; i < list.length; note = list[++i]){
                    if(note.offset + note.gate < begin || end < note.offset){
                        continue;
                    }
                    if(note.offset >= p + option.grid){
                        break;
                    }
                    var start = (note.offset - p) * 60 * 4 / tempo + t;
                    var stop = (note.offset + note.gate - p) * 60 * 4 / tempo + t;
                    var g = ctx.createGain();
                    var o = ctx.createOscillator();
                    o.connect(g);
                    g.connect(mainv);
                    g.gain.setValueAtTime(0, start);
                    g.gain.linearRampToValueAtTime(1, start + 0.01);
                    g.gain.setTargetAtTime(0, stop - 0.1, 0.05);
                    g.gain.setTargetAtTime(0, end * 60 * 4 / tempo + t, 0.2);
                    o.type = 'square';
                    o.frequency.value = 440 * Math.pow(2, (note.number - 69) / 12);
                    o.start(start);
                    o.stop(stop - 0.05);
                    os.push([o, g]);
                }
                p += option.grid;
                if(p <= end){
                    playLine.offset += option.grid;
                    setTimeout(arguments.callee, 60 * 1000 / tempo * option.grid);
                }else{
                    $('.btn-stop').click();
                }
            })();
        });
        $('.btn-stop').on('click', function(){
            if(os){
                playLine.offset = begin;
                t = ctx.currentTime;
                for(i = 0; i < os.length; i++){
                    os[i][0].stop(t + 1);
                    os[i][1].disconnect();
                }
            }
            os = null;
        });
        $('.btn-delete').on('click', function(){
            var list = data.noteList;
            for(var i = list.length; ~--i;){
                if(list[i].number != null && list[i].selected){
                    list.splice(i, 1);
                }
            }
        });
        $('.btn-zoom-key').on('click', function(){
            option.keyWidth *= 1.25;
            option.staffWidth = option.keyWidth * 7 / 12;
            pianoroll.trigger('resizeKeyboard').trigger('resizeSheet');
        });
        $('.btn-zoomout-key').on('click', function(){
            var option = pianoroll.data().option;
            option.keyWidth *= 0.75;
            option.staffWidth = option.keyWidth * 7 / 12;
            pianoroll.trigger('resizeKeyboard').trigger('resizeSheet');
        });
        $('.btn-zoom-bar').on('click', function(){
            var option = pianoroll.data().option;
            option.barHeight *= 1.25;
            pianoroll.trigger('resizeSheet');
        });
        $('.btn-zoomout-bar').on('click', function(){
            var option = pianoroll.data().option;
            option.barHeight *= 0.75;
            pianoroll.trigger('resizeSheet');
        });
        $('.btn-tempo').on('click', function(){
            changeTempo(prompt('テンポを設定', tempo));
        });
        $('.btn-mic').on('click', function(){
            var state = $(this).data('state');
            if(state){
                microphone.stop();
                $('.mic', this).text('Off');
                $('.microphone-peek').removeClass('microphone-peek');
            }else{
                microphone.start();
                $('.mic', this).text('On');
            }
            $(this).data('state', !state);
        });
        $('.btn-title').on('click', function(){
            changeTitle(prompt('タイトルを設定', title));
        });
        $('.btn-volume').on('click', function(){
            changeVolume(prompt('音量を設定(0〜100)', mainv.gain.value * 100 | 0));
        });
        $('.btn-info').on('click', function(){
            $('.versioninfo').toggle();
        });
    });
});
