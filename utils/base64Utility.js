var base64Utility = (function () {
	'use strict';

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function encodeBase64(encodeString){
    var result     = '';

    var i = 0;
    do {
      var a = encodeString.charCodeAt(i++);
      var b = encodeString.charCodeAt(i++);
      var c = encodeString.charCodeAt(i++);

      a = a ? a : 0;
      b = b ? b : 0;
      c = c ? c : 0;

      var b1 = ( a >> 2 ) & 0x3F;
      var b2 = ( ( a & 0x3 ) << 4 ) | ( ( b >> 4 ) & 0xF );
      var b3 = ( ( b & 0xF ) << 2 ) | ( ( c >> 6 ) & 0x3 );
      var b4 = c & 0x3F;

      if( ! b ) {
        b3 = b4 = 64;
      } else if( ! c ) {
        b4 = 64;
      }

      result += characters.charAt( b1 ) + characters.charAt( b2 ) + characters.charAt( b3 ) + characters.charAt( b4 );

    } while ( i < encodeString.length );

    return result; 
  }

  function decodeBase64 (decodeString){
   var result     = '';
  if(decodeString){
    var i = 0;
    do {
      var b1 = characters.indexOf( decodeString.charAt(i++) );
      var b2 = characters.indexOf( decodeString.charAt(i++) );
      var b3 = characters.indexOf( decodeString.charAt(i++) );
      var b4 = characters.indexOf( decodeString.charAt(i++) );

      var a = ( ( b1 & 0x3F ) << 2 ) | ( ( b2 >> 4 ) & 0x3 );
      var b = ( ( b2 & 0xF  ) << 4 ) | ( ( b3 >> 2 ) & 0xF );
      var c = ( ( b3 & 0x3  ) << 6 ) | ( b4 & 0x3F );

      result += String.fromCharCode(a) + (b?String.fromCharCode(b):'') + (c?String.fromCharCode(c):'');

    } while( i < decodeString.length );
  }
    return result;
  
}

return {
  encodeBase64:encodeBase64,
  decodeBase64:decodeBase64
};
} ());

module.exports = base64Utility;