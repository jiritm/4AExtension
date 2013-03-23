/**
 * Soubor: AnnotParser.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce pro parsovani XML s anotacemi
 * Posledni uprava: 5.6.2012
 */

function AnnotParser()
{}

AnnotParser.prototype.createSubscribeMsg = function(){
    var resp = 
    '<?xml version="1.0" encoding="utf-8" ?>' + "\n" +
    '<messages>' + "\n" +
    '  <session id="0"/>' + "\n" +
    '  <subscribe>' + "\n" +
    '    <source type="*"/>' + "\n" +
    '  </subscribe>' + "\n" +
    '</messages>'
    return resp;
}

/**
 * @param {node} annotationsNode == <suggestions/>
 */
AnnotParser.prototype.parseSuggestionsResponse = function(annotationsNode)
{
    var annotChanges = new AnnotChanges();  
    var $root = $(annotationsNode);

    var $annotation_nodes = $root.find('>annotation');
    var annotations = [];
    var deleteSug = [];
    var lowConfideceSug = [];
    var this_class = this;
    
    var userConfidenceNumber = annotationExtension.PREFERENCE.getIntPref("suggestion.confidenceNumber");
    
    //alert(annotationsNode.childNodes.length);
    for (var i = 0; i < annotationsNode.childNodes.length; i++)
		{
			  var annotation_node = annotationsNode.childNodes[i];
        
        if (annotation_node.nodeName == 'annotation')
        {
            var ser = new XMLSerializer();
            
            var $annotation_node = $(annotation_node);
            
            var tmpId = $annotation_node.attr("tmpId");
            var confidence = $annotation_node.attr("confidence");
            if (confidence < userConfidenceNumber)
            {
                lowConfideceSug.push(tmpId);
                continue;
            }
            //TODO: je tohle bezpecne?:
            var descriptionNode = annotation_node.childNodes[0];
            var annotationXML = ser.serializeToString(descriptionNode);
            //alert(annotationXML);
            
            var annot = this_class.parseNodeAnnotation(annotation_node, annotations, 0, annotationExtension.SUGGESTED_ANNOTATION + tmpId, null);
            annot.tmpId = tmpId;
            annot.confidence = confidence;
            annot.XMLText = annotationXML;
            annotations.push(annot);
            annotation_node = annotation_node.nextSibling;
        }
        else if (annotation_node.nodeName == 'delete')
        {
            var $delete_node = $(annotation_node);
            var tmpId = $delete_node.attr("tmpId");
            deleteSug.push(annotationExtension.SUGGESTED_ANNOTATION + tmpId);   
        }
    }
    
    annotChanges.suggestionsAdd = annotations;    
    annotChanges.suggestionsDelete = deleteSug;
    annotChanges.suggestionsLowConfidence = lowConfideceSug;

    //annotChanges.alert();
    return annotChanges;
}

/**
 * @param {node} annotationsNode == <annotations/>
 */
AnnotParser.prototype.parseAnnotationsResponse = function(annotationsNode)
{
    var annotChanges = new AnnotChanges();
    var $annotationsNode = $(annotationsNode);

    //Projdi anotace add, change, delete
    annotChanges = this.parseNodeAnnotations($annotationsNode.get())
    
    return annotChanges;
}

/**
 * @param {node} description_node element <rdf:Description/> v elementu <annotation/>
 * @returns {array} pole objektu annotationExtensionChrome.fragment
 */ 
AnnotParser.prototype.parseFragments = function(description_node) {
    var $description_node = $(description_node);
    //var $fragment_nodes = $annotation_node.find("a\\:fragment");
    var $fragment_nodes = $description_node.find(">a\\:fragment");
    //alert('fragment nodes found: '+ $fragment_nodes.length);
    //alert($fragment_nodes.length);
    var fragments = [];
    $.each($fragment_nodes, function(index, fragment_node){
        
        var $fragment_node = $( fragment_node );
    
        var xpath = $fragment_node.find(">a\\:path").text();
        var offset = parseInt($fragment_node.find(">a\\:offset").text());
        var length = parseInt($fragment_node.find(">a\\:length").text());
        var text = $fragment_node.find(">a\\:annotatedText").text();
        var fragment = new annotationExtensionChrome.fragment(text, length, offset, xpath);
        
        fragments.push(fragment);
    })
    return fragments;
}

/**
 * @param {node} annotation_node, uzel <annotation/>
 * @param {Int} lvl, jak hluboko je anotace zanorena, 0 = korenova anotace
 * @param {String} suggestedId, pokud se NErovna null, zpracovava se nabidnuta anotace
 *                              pokud se nejedna o vnorenou anotaci, je zde annotationExtension.SUGGESTED_ANNOTATION + tmpId z elementu <annotation/>
 *                              pokud se jedna o vnorenou anotaci, je zde annotationExtension.SUGGESTED_ANNOTATION + tmpId nadrazene anotace
 * @param {Annotation objekt} suggestedParent, pokud se zpracovava vnorena nabidnuta anotacem suggestedParent
 *                                             je objekt Annotation nadrazene anotace, jinak nepouzit
 * @returns {Annotation objekt} objekt s anotaci
 */
AnnotParser.prototype.parseNodeAnnotation = function(annotation_node, annotations, lvl, suggestedId, suggestedParent)
{
    var $annotation_node = $( annotation_node );

    var annot = new Annotation();
    var $description_node = $annotation_node.find(">rdf\\:Description");
    if (suggestedId == null)
    {
        annot.id = $description_node.attr("rdf:about");
    }
    else
    {//Pokud je o nabidnutou anotaci, nema id v about
        if (lvl == 0)
        {
            annot.id = suggestedId;
        }
        else
        {//Jedna se o vnorenou anotaci suggestedId je id nadrazene anotace
            annot.tmpId = $description_node.attr("tmpId");
            annot.id = annotationExtension.SUGGESTED_ANNOTATION + annot.tmpId;
            suggestedParent.nestedAnnotationsId.push(annot.id);
        }
    }
    annot.type = $description_node.find(">rdf\\:type").attr("rdf:resource");
    annot.lvl = lvl;
    annot.dateTime = $description_node.find(">a\\:dateTime").attr("rdf:value");
    annot.author.address = $description_node.find(">a\\:author").attr("address");
    annot.author.name = $description_node.find(">a\\:author").attr("name");
    annot.source = $description_node.find(">a\\:source").attr("rdf:resource");
    annot.fragments = this.parseFragments($description_node.get()); //this_class
    annot.attributes = this.parseAttributes($description_node.get(),annot.id,annotations,lvl,suggestedId,annot); //this_class
    //annot.content = annotation_node.getElementsByTagName('a:content').item(0).childNodes[1].nodeValue;
    annot.content = $description_node.find(">a\\:content").text();
    //if(annot.attributes.length > 0){annot.alert();}
    return annot;
}

/**
 * @param {node} root, element <add/> / <change/> / <remove/>
 * @returns {array} pole anotaci(Annotation)
 */
AnnotParser.prototype.parseNodesAnnotation = function(root)
{
    var $root = $( root );
    var $annotation_nodes = $root.find('>annotation');
    var annotations = [];
    var this_class = this;


    $.each($annotation_nodes, function(index, annotation_node)
        {
            var annot = this_class.parseNodeAnnotation(annotation_node, annotations, 0, null, null);

            annotations.push(annot);
        });
    
    return annotations;
}

/**
 * @param {node} root, ocekava element typu annotations
 * @returns {AnnotChanges objekt}  
 */
AnnotParser.prototype.parseNodeAnnotations = function(root)
{
    var $root = $(root);
    var $add = $root.find('add');
    var $change = $root.find('change');
    var $remove = $root.find('remove');
    var annot_changes = new AnnotChanges();

    if($add.length > 0)
    {
        annot_changes.add = this.parseNodesAnnotation($add.get());
    }
    
    if($change.length > 0)
    {
        annot_changes.change = this.parseNodesAnnotation($change.get());
    }
    
    if($remove.length > 0)
    {
        annot_changes.remove = this.parseNodesAnnotation($remove.get());
    }
    //annot_changes.alert();
    return annot_changes;
}

AnnotParser.prototype.parseAttributes = function(description_node,nested_id,annotations,lvl,suggestedId,suggestedParent)
{
    var $description_node = $( description_node );
    var $attribute_nodes = $description_node.find(">a\\:attribute");
    //alert('fragment nodes found: '+ $fragment_nodes.length);
    //alert($fragment_nodes.length);
    var attributes = [];
    var this_class = this;
    $.each($attribute_nodes, function(index, attribute_node){
        var $attribute_node = $( attribute_node );
        var attribute = new Attribute();
        attribute.name = $attribute_node.attr("name");
        attribute.type = $attribute_node.attr("type");
        switch(attribute.type)
        {
            case "Text":
                attribute.value = $attribute_node.find("a\\:Content").text();
                break;
            case "Binary":
            case "Duration":
            case "Image":
            case "String":
            case "URI":
            case "DateTime":
            case "Integer":
            case "Decimal":
            case "Date":
            case "Time":
            case "Boolean":
                attribute.value = $attribute_node.attr("rdf:value");
                break;
            case "GeoPoint":
            case "geoPoint":
                attribute.value = new Point(
                    $attribute_node.find('geo\\:lat').text(), 
                    $attribute_node.find('geo\\:long').text()
                );
                break;
            case "annotationLink":
                attribute.value = $attribute_node.attr("uri");
                break;
            case "nestedAnnotation":
                var annot = this_class.parseNodeAnnotation(attribute_node, annotations, lvl + 1, suggestedId, suggestedParent);
                annot.nested_id = nested_id;
                attribute.value = annot.id;
                annotations.push(annot);
                break;
            case "person":
            case "Person":
                var personAttr = $attribute_node.find('>a\\:person').attr('id');
                attribute.value = personAttr;
                break;
            default:
        }

        attributes.push(attribute);
    })
    return attributes;
}