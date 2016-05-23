function rgb2hsv(r,g,b,s,v){return{v:v=Math.max(r,g,b),s:(s=v-Math.min(r,g,b))/v,h:(60*(v-r?v-g?(r-g)/s+4:(b-r)/s+2:(g-b)/s)+360)%360|0}}
function hsv2rgb(h,s,v,i,f){h=[v,v-(f=v*s*((f=h/60%6)-(i=f^0))),h=v-v*s,h,f+h,v];return{r:h[i]^0,g:h[(i+4)%6]^0,b:h[(i+2)%6]^0}}
function hash2rgb(s){s=parseInt(s.length>3?s:s.replace(/(.)/g,'$1$1'),16);return{r:s>>16,g:s>>8&255,b:s&255}}
function num2rgb(s){s=parseInt(s);return{r:s>>16,g:s>>8&255,b:s&255}}
function rgbstr(rgb){return'rgb('+[rgb.r,rgb.g,rgb.b].join(', ')+')'};
function rgbastr(rgb,a){return'rgba('+[rgb.r,rgb.g,rgb.b,a||1].join(', ')+')'};
function rgbhash(rgb){return'#'+('000000'+(rgb.r<<16|rgb.g<<8|rgb.b).toString(16)).slice(-6)}
