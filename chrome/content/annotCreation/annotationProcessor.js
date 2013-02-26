/**
 * Soubor: annotationProcessor.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Obsahuje funkce pro vztvoreni zpravy anotace,
 *        ktera se odesle s dalsimi inf. na server.
 * Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.annotationProcessor = 
{  
  /**
   * Vytvori anotaci
   * @param {Int} rangeIndex, pro ktery range (z hlavni anotace - annotationExtensionChrome.bottomAnnotationWindow.annotation)
   *              se ma vytvorit anotace
   */
  makeAnnotation : function(rangeIndex)
  {
    try
    {
      if (annotationExtensionChrome.bottomAnnotationWindow.editingAnnotTmpId != null)
      {//Anotace se edituje, ale jde o nabidnutou anotaci, takze se postupuje
       //jakoby se anotace prave pridavala.
        annotationExtensionChrome.bottomAnnotationWindow.editing = false;
      }
      
      annotation = "";
      
      //TODO: oprav email(je email prihlasovaci jmeno uzivatele?)
      this.email = annotationExtension.user.userID;  /* TODO: oprav jmeno promenne i v make nested!! */
      //alert(this.email);
      this.authorName = annotationExtension.user.userNameAndSurname;
      this.document = annotationExtensionChrome.document.syncURI;
      var annotationObj = annotationExtensionChrome.bottomAnnotationWindow.annotation;
      var fragments = annotationObj.fragments.rangesFragments[rangeIndex];
      
      if (annotationExtensionChrome.bottomAnnotationWindow.editing == true)
        annotation += '<rdf:Description rdf:about="' + annotationExtensionChrome.bottomAnnotationWindow.editingAnnotID + '">\n';
      else
        annotation += '<rdf:Description>\n';
        
      annotation += '<rdf:type rdf:resource="'+annotationExtensionChrome.bottomAnnotationWindow.selectedTypeURI+'"/>\n';
      annotation += '<a:author name="'+this.authorName+'" id="'+this.email+'"/>\n';
      annotation += '<a:source rdf:resource="'+this.document+'"/>\n';
      if (annotationExtensionChrome.bottomAnnotationWindow.documentAnnotation != true)
      {
        fragmentsLen = fragments.length;
        for (var i = 0; i < fragmentsLen; i++)
        {
          var fragment = fragments[i];
          annotation += '<a:fragment>\n';
            annotation += '<a:path>'+fragment.xpath+'</a:path>\n';
            annotation += '<a:offset>'+fragment.offset+'</a:offset>\n';
            annotation += '<a:length>'+fragment.length+'</a:length>\n';
            annotation += '<a:annotatedText>'+fragment.textRepEnt+'</a:annotatedText>\n';
          annotation += '</a:fragment>\n';
        }
      }
      annotation +='<a:content>\n';
      annotation +='<![CDATA['+annotationObj.content+']]>';
      annotation +='</a:content>\n';
      annotation += this.makeAttributes(annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName);
      annotation += '</rdf:Description>';
    }
    catch(ex)
    {
      alert('makeAnnotation.js : makeAnnotation\n' + ex.message);
      return null;
    }
    
    return annotation;
  },
  
  /**
   * "Precte" atributy. (Projde vytvorena rozhrani pro typ v attrDatasource)
   * @param {Int} id, udava pod ktere uziv. rozhrani maji atributy spadat.
   * @returns {Strig} Cast zpravy s atributy pro typ.
   */
  makeAttributes : function(id)
  {
    var attributes = "";
    
    var attributesElems = this.getAtributeElems(id);
    
    for (var i = 0; i < attributesElems.length; i++)
    {
      var attrUI = attributesElems[i];

      if (annotationExtensionChrome.attributes.attributeIsFilled(attrUI.getAttribute('id')))
        attributes += this.makeAttribute(attrUI);
    }
    
    return attributes;
  },
  
  /**
   * Ziska atributy anotace, podle vytvoreneho uzivatelskeho rozhrani
   * id udava pod ktere uziv. rozhrani maji atributy spadat.
   */
  getAtributeElems : function(id)
  {
    var elems = [];
    var attributesUI = document.getElementById('tab'+ annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if (attributesUI.hasChildNodes())
    {
      var attrUI = attributesUI.firstChild;
      while(attrUI)
      {
        var attrID = attrUI.getAttribute('id');
        var attrName = annotationExtensionChrome.attrDatasource.getResourceProp(attrID, 'name');
        
        attrID = attrID.replace(id, "");
        
        var slash = /\//g;
        var result = attrID.match(slash);
        //samotne jmeno atributu muze obsahovat lomitka
        var slashInAttrName = attrName.match(slash);
        var slashCountInAttrName = (slashInAttrName != null) ? slashInAttrName.length : 0;
        
      
        //result - "pocet" nalezenych lomitek v attrID  
        if(result != null)
          if((result.length - slashCountInAttrName) == 1) //pocet lomitek je jedna ->
          //je primym atributem (vnorene) anotace
            elems.push(attrUI);
      
        var attrUI = attrUI.nextSibling;
      }
    }
    
    return elems;
  },
  
  /**
   * Vytvori cast zpravy obsahujici atribut podle id uziv. rozhrani atributu = attrUI
   * @param {Element} attrUI, uziv. rozhrani atributu
   * @returns {string} atribut ve formatu XML 
   */
  makeAttribute : function(attrUI)
  {
    var attribute = ""
    var id = attrUI.getAttribute('id');

    var type = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'type');
    var name = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'name');
    
    var lcType = type.toLocaleLowerCase();
    
    if (annotationExtension.attrConstants.isSimple(type))
    {//Jednodychy typ
      var data = annotationExtensionChrome.attributes.getDataFromUI(id);
      
      //type = type.toLowerCase();
      with (annotationExtension.attrConstants)
      {
        if (lcType == SIMPLE_STRING.toLowerCase())
        {//String
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_URI.toLowerCase())
        {//URI
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_DATETIME.toLowerCase())
        {//Date and Time
          if (data[1] != undefined && data[1] != null && data[2] != undefined && data[2] != null)
          {
            attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
            attribute += 'rdf:value="'+data[1]+'T'+data[2]+'Z"/>\n';
          }
        }
        else if (lcType == SIMPLE_INTEGER.toLowerCase())
        {//Integer
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_DECIMAL.toLowerCase())
        {//Decimal
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_DATE.toLowerCase())
        {//Date
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';    
        }
        else if (lcType == SIMPLE_TIME.toLowerCase())
        {//Time
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'Z"/>\n'; 
        }
        else if (lcType == SIMPLE_BOOLEAN.toLowerCase())
        {//Bool
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_PERSON.toLowerCase())
        {//Person
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += '>\n';
          attribute += '<a:person id="'+data[1]+'"/>\n';
          attribute += '</a:attribute>\n';
        }
        else if (lcType == SIMPLE_GEOPOINT.toLowerCase())
        {//Geopoint
          if (data[1] != undefined && data[1] != null && data[2] != undefined && data[2] != null)
          {
            attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
            attribute += '>\n';
            attribute += '<geo:Point>';
            attribute += '<geo:lat>'+data[1]+'</geo:lat>\n';
            attribute += '<geo:long>'+data[2]+'</geo:long>\n';
            attribute += '</geo:Point>\n';
            attribute += '</a:attribute>\n';
          }
        }
        else if (lcType == SIMPLE_DURATION.toLowerCase())
        {//Duration
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_IMAGE.toLowerCase())
        {//Image
          attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
          attribute += 'rdf:value="'+data[1]+'"/>\n';
        }
        else if (lcType == SIMPLE_TEXT.toLowerCase())
        {//Text
          attribute += '<a:attribute name="'+name+'" type="'+type+'">\n';
          //TODO: zkontroluj jestli retezec neobsahuje nepovolene sekvence <![CDATA[ a ]]>
          attribute += '<a:Content><![CDATA['+data[1]+']]></a:Content>\n';
          attribute += '</a:attribute>';
        }
        else if (lcType == SIMPLE_BINARY.toLowerCase())
        {//Binary
          
          var encoded = "";
          try
          {
            if ((annotationExtensionChrome.bottomAnnotationWindow.editing == true) && (data[1] == annotationExtension.SAVED_DATA))
            {// Pokud se edituje anotace, binarni data hledej v ulozene anotaci(pokud se atributu nenahrala jina data)     
              var savedAnnot = annotationExtensionChrome.annotationsView.ANNOTATIONS.getAnnotation(annotationExtensionChrome.bottomAnnotationWindow.editingAnnotID );
              var fileAttr = savedAnnot.getAttributeByName(name);
              if (fileAttr != null)
              {
                encoded = fileAttr.value;
              }
            }
            else
            {
              var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
              file.initWithPath(data[1]);
              var contentType = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService).getTypeFromFile(file);
              var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
              inputStream.init(file, 0x01, 0600, 0);
              var stream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
              stream.setInputStream(inputStream);

              var fileString = stream.readBytes(stream.available());
              encoded = window.btoa(unescape(encodeURIComponent(fileString)));
              //btoa(stream.readBytes(stream.available()));
            }

            attribute += '<a:attribute name="'+name+'" type="'+type+'" ';
            attribute += 'rdf:value="'+encoded+'"/>\n';
          } catch(ex) {
            //Soubor neexistuje
            //TODO: 
          }
        }
      }
    }
    else
    {//Typ Anotace
      if (annotationExtensionChrome.attributes.attributeIsALink(id))
      {//aLink
        var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
        var annotationObjIndex = nestedAnnotations.getIndexByProp('uri', id);
        var annotationObj = nestedAnnotations.getAtIndex(annotationObjIndex);
        
        if (annotationObj != null)
        {
          for (var aLinksCount = 0; aLinksCount < annotationObj.len(); aLinksCount++)
          {
            var aLink = annotationObj.getAnnotation(aLinksCount);
            attribute += '<a:attribute name="'+name+'" type="annotationLink" uri="'+aLink+'"/>';
          }
        }
      }
      else
      {//nested        
        var nestedAnnotationAttr = this.makeNestedAnnotations(id, name);
        attribute += nestedAnnotationAttr;
        
        //Pro pripad, kdy je oznacen atribut anotace, ale neni vyplneny
        //if (nestedAnnotationAttr == "")
        //  attribute = "";
        
      }
    }
    
    return attribute;
  },
  
  /**
   * Vytvori vnorenou anotaci a vrati ji
   */
  makeNestedAnnotations : function(id, name)
  {
    try
    {
      var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
      
      var annotations = "";
      var annotationObjIndex = nestedAnnotations.getIndexByProp('uri', id);
      var annotationObj = nestedAnnotations.getAtIndex(annotationObjIndex);
      if (annotationObj == null)
        return "";
      
      var annotationType = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'type');
      var data = annotationExtensionChrome.attributes.getDataFromUI(id);
      var content;
      
      if (data[2] == undefined || data[2] == null)
        content = "";
      else
        content = data[2];
      
      if (annotationObj.multipleAnnotation == true)
      {//Pouze editovane vnorene jsou "multiple"
        for (var annotCount = 0; annotCount < annotationObj.len(); annotCount++)
        {
          var annot = annotationObj.getAnnotation(annotCount);
          try
          {
            var fragments = annot.fragments.rangesFragments[0];
            
            var editedId = "";
            
            //Pokud se edituje nabidnuta anotace, jeji vnorene anotace nemaji id a editedId zustane ""
            if (annotationExtensionChrome.bottomAnnotationWindow.editingAnnotTmpId == null)
            {
              var editedId = annot.uri;
            }
            
            annotations += this.makeNestedAnnotation(id, name, content, annotationType, fragments, editedId);
          }
          catch(ex)
          {/*.fragments.rangesFragments[0] muze byt undefiend, null...*/}
        }
      }
      else
      {
        for (var rangeCount = 0; rangeCount < annotationObj.fragments.rangesFragments.length; rangeCount++)
        {
          var fragments = annotationObj.fragments.rangesFragments[rangeCount];
          
          annotations += this.makeNestedAnnotation(id, name, content, annotationType, fragments, "");
        }
      }
      
      return annotations;
    }
    catch(ex)
    {
      alert('makeAnnotation.js : makeNestedAnnotations\n' + ex.message);
      return "";
    }
  },
  
  /**
   * Vytvori vnorenou anotaci a vrati ji
   */
  makeNestedAnnotation : function(id, name, content, annotationType, fragments, edited)
  {
    try
    {      
      var annotation = "";
      
      annotation += '<a:attribute name="'+name+'" type="nestedAnnotation">';    
      if (edited != "")
      {
        annotation += '<rdf:Description rdf:about="' + edited + '">\n';
      }
      else
      {
        annotation += '<rdf:Description>\n';
      }
      annotation += '<rdf:type rdf:resource="'+annotationType+'"/>\n';
      annotation += '<a:author name="'+this.authorName+'" id="'+this.email+'"/>\n';
      annotation += '<a:source rdf:resource="'+this.document+'"/>\n';
      var fragmentsLen = fragments.length;
      for (var fragCount = 0; fragCount < fragmentsLen; fragCount++)
      {
        var fragment = fragments[fragCount];
        annotation += '<a:fragment>\n';
          annotation += '<a:path>'+fragment.xpath+'</a:path>\n';
          annotation += '<a:offset>'+fragment.offset+'</a:offset>\n';
          annotation += '<a:length>'+fragment.length+'</a:length>\n';
          annotation += '<a:annotatedText>'+fragment.textRepEnt+'</a:annotatedText>\n';
         annotation += '</a:fragment>\n';
      }
      annotation +='<a:content>\n';
      annotation +='<![CDATA['+content+']]>';
      annotation +='</a:content>\n';
      annotation += this.makeAttributes(id);
      annotation += '</rdf:Description>';
      annotation += '</a:attribute>\n';
    
      return annotation;
    }
    catch(ex)
    {
      alert('makeAnnotation.js : makeNestedAnnotation\n' + ex.message);
      return "";
    }
  }
};