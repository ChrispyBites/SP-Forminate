/**
 * The Forminator for customizing OOTB list forms.
 * Version 1.0, based on work by Mark Rackley: https://github.com/mrackley/HillbillyTemplate/
 *  
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * And, really, because I blatantly stole the idea from Mark, I don't care what you do with this.
 * 
 * @name        Forminator
 * @description Customize OOTB list forms in SP2013 On Premise.
 * @type        jQuery
 * @requires    jQuery 1.7+
 * @author      Chris Parker / https://github.com/chrispybites
 * 
 *  Usage:
 * 
 *  @param 
 *  $(function(){
 *      $(ctx).Forminate({
 *          formClass:  '<string>' //Class for placeholder elements for form fields. Defaults to formValue.
 *          readClass:  '<string>' //Class for placeholder elements for read-only fields.  Defaults to readValue.
 *          useName:    '<string>' //Which field designation to use.  Can be FieldName or FieldInternalName; defaults to FieldName.
 *          spTable:    '<string>' //The CSS/jQuery selector that identifies the SP table that contains the OOTB list fields.  Defaults to table.ms-formtable td.
 *      });
 *  });
 * 
 */

(function($){

    $.fn.Forminate=function(options)
    {

        //Never used $.extend before, so I'm copying Mark.  Hope this is right.
        var o=$.extend({},{
            formClass:'formValue',
            readClass:'readValue',
            useName:'internal',
            spTable:'table.ms-formtable td'
        },options);
        
        //Flips the useName property to the actual text we'll need to search against.
        if(o.useName=='internal'){o.useName=='FieldInternalName'}else{o.useName=='FieldName'};
        
        //Primary functions that run on the placeholder HTML.  Loops through user's HTML layout
        $(this).children('.'+o.formClass).each(writeFields);
        $(this).children('.'+o.readClass).each(readFields);

    }

    //I've kept Mark's original function essentially intact.  
    function writeFields(){
        
        var elem=$(this),                                           //This placeholder.
            field=$(elem).data('name'),                             //The field name we're going hunting for.
            searchFor=o.useName+'="'+field+'"';                     //Building the search string.
        $(o.spTable).each(function(){                               //Loop over the entire table.
            if(this.innerHTML.indexOf(searchFor)!=-1){              //If the field name is in that mess of comments SharePoint generates...
                $(this).contents().appendTo(elem);                  //...pick up everything inside the td and append it to the placeholder.
            };
        });
    }
    
    //This was much harder.  Some of the fields need special handling in order to extract their values, so I built this monster object to handle that.
    //I have a feeling this isn't the right way to do this, so please feel free to point me in a better direction.
    function readFields(){
        var types={},field;
        types.text={search:'FieldType="SPFieldText"',value:function(){return $(field).find('input').val();}};
        types.date={search:'FieldType="SPFieldDateTime"',value:function(){return $(field).find('input').val();}};
        types.user={search:'FieldType="SPFieldUser"',value:function(){return handlePeopleFields(field);}};
        types.multiuser={search:'FieldType="SPFieldUserMulti"',value:function(){return handlePeopleFields(field);}};
        types.choice={search:'FieldType="SPFieldChoice"',value:function(){return handleChoiceFields(field,false);}};
        types.multichoice={search:'FieldType="SPFieldMultiChoice"',value:function(){return handleChoiceFields(field,true);}};
        types.multiline={search:'FieldType="SPFieldNote"',value:function(){return $(field).find('textarea').text();}};
        types.bool={search:'FieldType="SPFieldBoolean"',value:function(){return ($(field).find('input').is(':checked'))?'Yes':'No';}};
        types.num={search:'FieldType="SPFieldNumber"',value:function(){return $(field).find('input').val();}};
        types.currency={search:'FieldType="SPFieldCurrency"',value:function(){return $(field).find('input').val();}};
        types.link={search:'FieldType="SPFieldURL"',value:function(){return handleURLFields(field);}};
        types.lookup={search:'FieldType="SPFieldLookup"',value:function(){return handleChoiceFields(field,false);}};
        types.multilookup={search:'FieldType="SPFieldLookupMulti"',value:function(){return handleChoiceFields(field,true);}};
        types.meta={search:'FieldType="SPFieldTaxonomyFieldType"',value:function(){return handleMetadata(field);}};
        types.metaMulti={search:'FieldType="SPFieldTaxonomyFieldTypeMulti"',value:function(){return handleMetadata(field);}};

        var elem=$(this),
            field=$(elem).data('name'),
            searchFor=o.useName+'="'+field+'"';
        $(o.spTable).each(function(){
            var _this=this;                                         //Ended up having to do this because the context changes inside of a map function I use.
            if(this.innerHTML.indexOf(searchFor)!=-1){              //Same as in the writeFields function.              
                $.map(types,function(prop,key){                     //Map over the types object... 
                    if(_this.innerHTML.indexOf(prop.search)!=-1){   //... look to see what field type this field is...
                        $(elem).append(prop.value());               //... get the appropriate value and stick it in the placeholder.
                    }                                               //I don't remember why I used append() instead of appendTo() here.
                });
            }
        });
        
    }

    /*

        Helper functions.  There are five.  Four for People, Choice (including lookup), URL, and Metadata.  The last function creates a random ID for the people pickers.

    */

    //This returns a block of HTML that usually renders as a functional presence icon and user link with persona card popover.  I'll be honest, it works maybe 60% of the time.
    function handlePeopleFields(field){
        var value=$(field).find('input').val();                     //First, get that big ugly value string from the people picker.
        if(value.length){                                           //Check that there's something there.
            value=JSON.parse(value);var html='';                    //If there is, turn it into an actual object.  Then, create a blank string variable.
            value.map(function(o){                                  //Map over the array of people values and start building a string of html.
                var id1=getRandomInt(1,100),id2=getRandomInt(1,100);//This imnSpan needs two random IDs in order to work; generate them.

                //I've broken this string concatenation into appropriately indented lines, but I do so under duress.
                html+='<div>';
                    html+='<span>';
                        html+='<span class="ms-imnSpan">';
                            html+='<a href="#" onclick="IMNImageOnClick(event);return false;" class="ms-imnlink ms-spimn-presenceLink">';
                                html+='<span class="ms-spimn-presenceWrapper ms-imnImg ms-spimn-imgSize-10x10">';
                                    html+='<img ';
                                        html+='name="imnmark" '; 
                                        html+='title="" '; 
                                        html+='ShowOfflinePawn="1" ';
                                        html+='class="ms-spimn-img ms-spimn-presence-disconnected-10x10x32" ';
                                        html+='src="/_layouts/15/images/spimn.png?rev=23" ';
                                        html+='alt="User Presence" ';
                                        html+='sip="'+o.EntityData.Email+'" ';
                                        html+='id="imn_'+id1+',type=sip"';
                                    html+='/>';
                                html+='</span>';
                            html+='</a>';
                        html+='</span>';
                        html+='<span>';
                            html+='<a href="#" onclick="IMNImageOnClick(event);return false;" class="ms-imnlink" tabIndex="-1">';
                                html+='<img ';
                                    html+='name="imnmark" ';
                                    html+='ShowOfflinePawn="1" ';
                                    html+='class="ms-hide" ';
                                    html+='src="/_layouts/15/images/spimn.png?rev=23" ';
                                    html+='alt="User Presence" ';
                                    html+='sip="'+o.EntityData.Email+'" ';
                                    html+='id="imn_'+id2+',type=sip"';
                                html+='/>';
                            html+='</a>';
                            html+=o.DisplayText;
                        html+='</span>';
                    html+='</span>';
                html+='</div>';
            });
            return html;                                                //Return that ugly string.
        }
    }

    //Giant pain in the butt.  But, it works and is a one-stop-shop for all types of choice fields, including lookups.
    function handleChoiceFields(field,isMulti){
        var html='',                                                    //Create an empty string; this is used for multiselects.
            isSelect=$(field).find('select').length;                    //Determine whether this is a dropdown or not.
        if(!isMulti){                                                   //If this isn't a multiselect whatever...
            if(isSelect){                                               //... but *is* a dropdown...
                return $(field).find('select option:selected').val();   //Return the selected option value.
            }else{
                return $(field).find('input:checked').val();            //But if it's *not* a dropdown, go find the checked input and return *that* value.
            }
        }else{                                                          //If this *is* a multiselect whatever...
            if(isSelect){                                               //... and is a lookup...
                $(field)                                                
                    .find('select[title$="selected values"] option')    //... get all of the values in that "selected values" box...
                    .each(function(){                                   //... loop through each one...
                        html+=$(this).text()+';';                       //... and add it to the html string with an appended semicolon.
                    });
            }else{                                                      //But if it's checkboxes...                                                      
                $(field)
                    .find('input:checked')                              //... find all the checked checkboxes...
                    .each(function(){                                   //... loop through each one...       
                        html+=$(this).next().text()+';';                //... and add it to the html string with an appended semicolon.
                    });
            }
            return html;                                                //Return the html.
        }
    }


    //This one was pretty simple, but it treats all URL fields as links.  Probably should do something if the user indicates it's a picture.
    function handleURLFields(field){
        var fields=$(field).find('input'),                              //Get the two textbox fields.
            url=$(fields[0]).val(),                                     //The first is the URL.
            desc=$(fields[1]).val(),                                    //The second is the description.
            html='<a href="'+url+'">'+desc+'</a>';                      //Create the appropriate anchor tag and...
        return html;                                                    //Return it.
    }

    //Another relatively easy one.
    function handleMetadata(field){
        var v=$(field).find('input').val();                             //Go get the value of the input box.
        if(v.indexOf(';')>-1){                                          //If there's a semicolon, then there are multiple values.
            var arr=[];                                                 //Create an empty array.
            v=v.split(';');                                             //Split the value string into its own array.
            v=v.map(function(a){                                        //Map over each value.
                var i=a.indexOf('|'),                                   //The term is on the left of the bar character, so find the bar and...
                    r=a.slice(0,i);                                     //... cut the string there.
                arr.push(r);                                            //Add it back to the empty array.
            });
            arr=arr.join('; ');                                         //Turn our finished array into a semicolon-delimited string of values.
            return arr;                                                 //Return it.
        }else{                                                          //If there is no semicolon, this is a singleton.
            v=v.split('|');                                             //Split on the bar character.
            return v[0];                                                //Return the value.
        }
    }
    
    //Here's my little random ID function for the people pickers.
    function getRandomInt(min,max){
        return Math.floor(Math.random()*(max-min+1))+min;
    }
    
})(jQuery);