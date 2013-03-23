/**
 * Soubor: structures.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Struktury potrebne pro zobrazeni anotaci.
 * Posledni uprava: 5.6.2012
 */

/////////////////
//ANNOTATIONSDB//
/////////////////
AnnotationsDB = function()
{
    this.annotations = new Object();
};

AnnotationsDB.prototype =
{
		addAnnotationDB : function(annotation)
		{
				//annotation.nested_id = nested_id;
				this.annotations[annotation.id] = annotation;
				//this.counter++;
				//return this.counter++;
		},
		
		changeAnnotationDB : function(annotation)
		{
				//var db_annot = this.getAnnotation(annotation.id);
				this.annotations[annotation.id] = annotation;
				
		},
		
		removeAnnotationDB : function(annotation)
		{
				//var db_annot = this.getAnnotation(annotation.id);
				//this.annotations[annotation.id] = annotation;
				delete this.annotations[annotation.id];
				
		},
		
		changeAnnotation : function(id)
		{
				var annotation = this.getAnnotation(id);
				annotation.changeAnnotation();
		},
		
		removeAnnotation : function(id)
		{
				annotationExtensionChrome.removedAnnotations.push(id);
				annotationExtensionChrome.client.removeAnnotations();
		},
		
		getAnnotation : function (id)
		{
				return this.annotations[id];
		},
		
		clear : function ()
		{
				this.annotations = new Object();
				//this.counter = 0;
		},
		
		alert : function ()
		{
				var ids = "";
				var count = 0;
		
				$.each(this.annotations,function(ind,annotation){
						ids += annotation.id + "\n";
						count++;})
		
				alert(
					 "Annot count: " + count + "\n" +
					 "----------------\n" +
					 ids
				);
		}
};

//////////////
//ANNOTATION//
//////////////
Annotation = function()
{
    this.id = "";
    this.nested_id = undefined;
    this.type = "";
    this.lvl = 0;
    this.dateTime = "";
    this.author = { "name":"", "address":"" };
    this.source = "";
    this.fragments = [];
    this.attributes = [];
    this.content = "";
    
    this.tmpId = null;              /**< Pokud tmpId neni null, jedna se o nabidnutou anotaci,
                                     *   v tom pripade se tmpId == id. */
    this.confidence = null;
    this.nestedAnnotationsId = [];  /**< Pouziva se u nabidnutych anotaci. (Server nevraci tmpId vnorenych anotaci ve zprave delete.) */
    this.XMLText = null;            /**< Ulozene XML nabidnute anotace (pro snadnejsi potvrzeni anotace) */
};

Annotation.prototype = 
{
		changeAnnotation : function()
		{
        try
        {
            annotationExtensionChrome.bottomAnnotationWindow.clearWindow();
            
            annotationExtensionChrome.bottomAnnotationWindow.editing = true;
            annotationExtensionChrome.bottomAnnotationWindow.editingAnnotID = this.id;
            
            annotationExtensionChrome.bottomAnnotationWindow.editingAnnotTmpId = this.tmpId;
            
            //Nastaveni vyberu
            if (this.fragments.length > 0)
            {
                var range = annotationExtensionChrome.rangeCreator.createRangeFromFragments(this.fragments);
            
                var selection = window.content.getSelection();
                var savedAnnotation = null;
                selection.removeAllRanges();
                
                selection.addRange(range);
                
                annotationExtensionChrome.selectedText.selectText();
                annotationExtensionChrome.selectedText.showExactRange(-1);
            }
            else
            {//Anotace celeho dokumentu
                annotationExtensionChrome.bottomAnnotationWindow.annotateDocument(true);
            }
            
            //Nastaveni obsahu anotace
            annotationExtensionChrome.bottomAnnotationWindow.setContent(this.content);
            
            //Nastaveni typu
            var typeName = annotationExtension.functions.linearTypeURI(this.type);
            annotationExtensionChrome.bottomAnnotationWindow.selectNewType(this.type, typeName, true, false, false);
            var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();
            tab.loadAttributes = false;
            
            //Do editovane anotace je mozne vybrat pouze prvni range
            annotationExtensionChrome.bottomAnnotationWindow.setTextSelectionListener(false);
            
            //Nacteni atributu
            annotationExtensionChrome.attributes.selectAttributesFromArray(this.attributes, annotationExtensionChrome.attrDatasource.baseURI +
                                                                            annotationExtensionChrome.attrDatasource.rootName, this.type)
        }
        catch(ex)
        {
            alert('structures.js : changeAnnotation:\n' + ex.message);
        };
		},
    
    getFragmentText : function()
    {
        var text = "";
        for (var i = 0; i < this.fragments.length; i++)
        {
            text += this.fragments[i].text + ' ';
        }
        
        return text;
    },
    
    loadAttributesToWindow : function()
    {
        
    },
    
    getAttributeByName : function(name)
    {
      for (i in this.attributes)
      {
        if (this.attributes[i].name == name)
            return this.attributes[i];
      }
      return null;
    },
		
		alert : function ()
		{
				var frags = "";
				var attributes = "";
				for(var i = 0; i < this.fragments.length; i++){
						frags = frags + this.fragments[i].string();
				}
				for(i = 0; i < this.attributes.length; i++){
						attributes = attributes + this.attributes[i].string();
				}
				alert("id: " + this.id + "\n" +	"nested_id: " + this.nested_id + "\n" +
						"type: " + this.type + "\n" +	"dateTime: " + this.dateTime + "\n" +
						"author.name: " + this.author.name + "\n" + "author.address: " +
						this.author.address + "\n" + "source: " + this.source + "\n" +
						"frags: \n" + frags + "attributes: \n" + attributes + "content: \n" + 
						this.content);
		}
};

////////////
//FRAGMENT//
////////////
Fragment = function()
{
    this.xpath = "";
    this.offset = "";
    this.length = "";
    this.text = "";
};

Fragment.prototype =
{
		string : function ()
		{
				return "Fragment:Path[" + this.xpath + "]:Offset[" + this.offset + "]:Len[" +
            this.length + "]:Text[" + this.text + "]\n";
		}
};

/////////////
//ATTRIBUTE//
/////////////
Attribute = function()
{
    this.name = "";
    this.type = "";
    this.value = "";
};

Attribute.prototype =
{
		string : function ()
		{
				return "Attribute:[" + this.name + "]:[" + this.type + "]:[" + this.value + "]\n";
		}
};

///////////////
//ANOTCHANGES//
///////////////
AnnotChanges = function()
{
    this.add = [];    //array of annotations to be added
    this.change = []; //array of annotations to be changed
    this.remove = []; //array of annotations to be removed
    this.suggestionsAdd = [];              //array of new suggested annotations
    this.suggestionsDelete = [];           //array of deleted suggested annotations (STRINGS - ids)
    this.suggestionsLowConfidence = [];    //array of suggested annotations with low confidence (STRINGS - ids)
};

AnnotChanges.prototype =
{
		total : function()
		{
				return this.add.length + this.change.length + this.remove.length + this.suggestions.length;
		},
		
		alert : function ()
		{
				alert(  "Annotations changes:\n" + "Add:   " + this.add.length + "\n" +
            "Change:" + this.change.length + "\n" + "Delete:" + this.remove.length +
            "\n" + "Suggestions add:" + this.suggestionsAdd.length +
            "\n" + "Suggestions delete:" + this.suggestionsDelete.length);
		}
};

/////////
//ERROR//
/////////
AError = function(type)
{
    this.type = type;
   
    switch(type)
		{
        case "ajax":
            this.XMLHttpRequest = new Object();
            this.textStatus = "";
            this.errorThrown = "";
            break;
    }
};

AError.prototype =
{
		string : function()
		{
				switch(this.type)
				{
						case "ajax":
								return (this.textStatus + " - " + this.errorThrown);
						default:
								return "";
				}
    }    
};

///////
//Err//
///////
function Err(number,message)
{
    this.number = number;
    this.message = message;
};

///////////////
//ErrorsArray//
///////////////
ErrorsArray = function()
{
    this.errors = [];
}

ErrorsArray.prototype =
{
		isError : function(n)
		{
				var ret_val = false;
				$.each(this.errors,function(i,error){
					 if(error.number == n){
							 ret_val = true;
					 }
				})
				return ret_val;
		},
		
		isErrors : function(val1,val2,valn)
		{},
		
		notEmpty : function()
		{
				if(this.errors.length > 0){
						return true;
				}else{
						return false;
				}
		},
		
		add : function(error)
		{
				this.errors.push(error);
		},
		
		string : function()
		{
				var text = "";
				$.each(this.errors, function(ind, error){
						text += "[Err# " + error.number + "]" + error.message;
				})
				//+  "\n"
				return text;
		}
}

/////////
//POINT//
/////////
Point = function(glat,glong)
{
    this.glat = glat;
    this.glong = glong;
}