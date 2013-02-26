/**
 * Soubor: group.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Reprezentuje skupinu, ke ktere se muze uzivatel prihlasit.
 * Posledni uprava: 5.6.2012
 */

/**
 * Konstruktor
 * @param {String} name jmeno skupiny
 * @param {String} uri uri skupiny
 */
annotationExtensionChrome.group = function(name, uri, logged)
{
  //Inicializace
  this.name = name;
  this.uri = uri;
  this.logged = logged;
};

annotationExtensionChrome.group.prototype =
{
  name : "",
  uri : "",
  logged : ""
};