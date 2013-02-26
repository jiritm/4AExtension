/**
 * Soubor: typesDatasource.js
 * Autor: Jiri Trhlik
 * Datum: 18.6.2011
 * Popis: Funkce pro praci s datasource typu.
 * Posledni uprava: 18.6.2012
 */

/**
 * Trida TypesDatasource rozsiruje tridu Datasource
 */
annotationExtensionChrome.TypesDatasource = function(rootName, dsTypes)
{
  annotationExtensionChrome.Datasource.call(this, rootName, dsTypes);
}

annotationExtensionChrome.TypesDatasource.prototype = Object.create(new annotationExtensionChrome.Datasource("types", []),
{
  /**
   * Prida typ do datasource
   * @param {type} type, typ pro pridani do datasource
   * @returns {Bool} true, pokud se typ uspesne vlozil, jinak false
   */
  addType : { value: function(type)
  {    
    //Pridani "originalniho" resource - s primarni cestou predku
    type.primaryURI = type.uri;
    if (!this.addNewObject(type))
      return false;
    
    //Jeden resource "nemuze" byt ve vice kontejnerech, pro se vytvori "kopie"
    var primaryAncestor = type.ancestor;
    for (var i = 0; i < type.ancestorsArray.length; i++)
    {
      if (type.ancestorsArray[i] == primaryAncestor)
        continue;
      
      var typeRefURI = 'annotationExtension://' + type.ancestorsArray[i] + '/' + type.name;
      var typeRef = {
                      uri : typeRefURI,
                      ancestor : type.ancestorsArray[i],
                      name : type.name,
                      primaryURI : type.uri,
                      comment : type.comment
                    };
    
      if (!this.addNewObject(typeRef, 'annotTypeRef'))
        return false;
    }
    
    return true;
    
  }, enumerable: true, configurable: true, writable: true },
  
  /**
   * Smaze typ z datasource
   * @param {type} type, typ ke smazani, staci pokud obsahuje atributy: name,
   *               ancestor a uri
   *               atribut uri musi byt primarni uri typu
   */
  deleteType : { value: function(type)
  {      
    var typeAncestorsString = this.getResourceProp(type.uri, 'ancestorsArray');
        typeAncestorsString = typeAncestorsString.replace(/'/g, '"');
    var typeAncestors = JSON.parse(typeAncestorsString);
    
    for (var i = 0; i < typeAncestors.length; i++)
    {//Smaze vsechny typ, v ostatnich predcich
      if (typeAncestors[i] == type.ancestor)
        continue;
      
      var typeRefUri = 'annotationExtension://' + typeAncestors[i] + '/' + type.name;
      this.deleteObject(typeRefUri, typeAncestors[i]);
    }
    
    //Smazani typu s primarni uri
    var typesDatasourceAncestor = type.ancestor;
    if (typesDatasourceAncestor == "")
      typesDatasourceAncestor = this.baseURI + this.rootName;
      
    this.deleteObject(type.uri, typesDatasourceAncestor);
    
  }, enumerable: true, configurable: true, writable: true },
  
  /**
   * Ziska primarni uri pro typ
   * @param {String} typeURI, uri typu, pro ktery chceme primarni uri
   * @returns {String} primarni uri
   */
  getPrimaryTypeURI : { value: function(typeURI)
  {    
    var primaryURI;
    var objType = this.getResourceProp(typeURI, this.typeOfObjectPropName);
    
    if (objType == 'annotTypeRef')
      primaryURI = this.getResourceProp(typeURI, 'primaryURI');
    else
      primaryURI = typeURI;
    
    return primaryURI;
    
  }, enumerable: true, configurable: true, writable: true }  
  
})