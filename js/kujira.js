/* Kujira MIDI Library
 * Copyright (c) 2014 bgpat (bgpat.tak@gmail.com)
 * Licensed under the MIT License.
 * Version: 0.1
 */

var Kujira = {
    MIDI: function(){
        this.resolution = this.resolution;
        this.parts = [];
    },
    Track: function(){
    },
    Part: function(){
        this.events = [];
    },
    Note: function(num, bar, len){
        this.number = num;
        this.bar = bar;
        this.length = len;
    },
    SMF: function(){
        this.tracks = [];
        this.smfFormat = this.smfFormat;
    }
};

Kujira.MIDI.prototype.resolution = 480;

/*
Kujira.MIDI.prototype.chunkType = {
    header: 'MThd',
    track: 'MTrk'
};
Kujira.MIDI.prototype.smfFormat = 0;

Kujira.MIDI.Event = function(){
    this.deltaTime = 0;
};

Kujira.MIDI.Note = function(num, len){
    this.number = num;
    this.length = len;
    this.events = [];
};
Kujira.MIDI.Note.prototype.toEvents = function(){
};
*/
