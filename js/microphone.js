var Microphone = function(callback, option){
    var microphone = this;
    option = option || {};
    this.callback = callback || function(){};
    this.range = option.range || [0, 127];
    this.baseFreq = option.baseFreq || 440;
    this.baseNumber = option.baseNumber || 69;
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    this.ctx = new window.AudioContext();
};

Microphone.prototype.goertzel = function(freq, data){
    var len = data.length;
    var k = 0.5 + len * freq / this.ctx.sampleRate | 0;
    var w = 2 * Math.PI / len * k;
    var sin = Math.sin(w);
    var cos = Math.cos(w);
    var coeff = 2 * cos;
    var q = [0, 0, 0];
    for(var i = 0; i < len; i++){
        q[0] = coeff * q[1] - q[2] + data[i];
        q[2] = q[1];
        q[1] = q[0];
    }
    var real = (q[1] - q[2] * cos) / len * 0.5;
    var imag = (q[2] * sin) / len * 0.5;
    return real * real + imag * imag;
};

Microphone.prototype.start = function(){
    var microphone = this;
    navigator.getUserMedia(
        {
            audio: true,
            video: false
        },
        function(stream){
            var audio = new Audio();
            audio.volume = 0;
            microphone.streamURL = URL.createObjectURL(stream);
            microphone.mic = microphone.ctx.createMediaStreamSource(stream);
            microphone.req = microphone.ctx.createScriptProcessor(16384, 1, 1);
            microphone.mic.connect(microphone.req);
            microphone.req.connect(microphone.ctx.destination);
            microphone.req.onaudioprocess = function(e){
                var data = e.inputBuffer.getChannelData(0);
                var list = [];
                for(var i = microphone.range[0]; i <= microphone.range[1]; i++){
                    var f = microphone.baseFreq * Math.pow(2, (i - microphone.baseNumber) / 12);
                    var v = microphone.goertzel(f, data);
                    list.push({
                        volume: v,
                        freq: f,
                        num: i
                    });
                }
                microphone.callback(list);
            };
        },
        function(e){console.error(e);}
    );
};

Microphone.prototype.stop = function(){
    this.mic.disconnect();
    this.req.disconnect();
    URL.revokeObjectURL(this.streamURL);
};
