/**
 * Soubor: namespace.jsm
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Jmenny prostor pro .jsm modulu doplnku.
 * Posledni uprava: 5.6.2012
 */

var EXPORTED_SYMBOLS = ["annotationExtension"];

const Cc = Components.classes;
const Ci = Components.interfaces;

/**
 * annotationExtension namespace.
 */
if ("undefined" == typeof(annotationExtension)) {
  var annotationExtension = {};
};
