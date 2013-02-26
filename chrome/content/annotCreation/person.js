/**
 * Soubor: person.js
 * Autor: Jiri Trhlik
 * Datum: 25.2.2013
 * Popis: Reprezentuje uzivatele na serveru.
 * Posledni uprava:
 */

/**
 * Konstruktor
 * @param {String} id
 * @param {String} login
 * @param {String} name
 * @param {String} email
 */
annotationExtensionChrome.person = function(id, login, name, email)
{
  //Inicializace
  this.uri = id;
  this.login = login;
  this.name = name;
  this.email = email;
};

annotationExtensionChrome.person.prototype =
{
  uri : "",
  login : "",
  name : "",
  email : ""
};