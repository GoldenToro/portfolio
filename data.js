const small = document.querySelector(".card-container");
const template = document.querySelector("#card");

var data = [];


$.getJSON("data.json", function(json) {
    console.log(json)
    data  = json;

    showProjects(data); // this will show the info it in firebug console

    updateCardEffects();
});


function fillCard(card, obj, name) {


      $(card).find('.card').attr("id",`${name}-${obj["id"]}`);
      $(card).find('.title').text(obj["title"]);

      $(card).find('.status').html(`Status:<br><div>${obj["status"]}</div>`);

      for (var j = 0; j < obj["tags"].length; j++){
        var tag = obj["tags"][j];
        $(card).find('.tags').append(`<div>${tag}</div>`);

      }

      if ( obj["pics"].length < 2) {
        $(card).find('.slider-button').remove();
      }

      for (var j = 0; j < obj["pics"].length; j++){
        var tag = obj["pics"][j];
        var extraStyle = "";
        if (j != 0 ) {
            extraStyle = "right";
        }
        $(card).find('.slider').append(`<div class="slide ${extraStyle}" title="${tag["text"]}" style="background-image: url(${obj["pics"][j]["path"]});"></div>`);

      }

      $(card).find('.text').html(obj["text"]);
      $(card).find('.background').css("background-image",`url(${obj["pics"][0]["path"]})`);


        if (obj.hasOwnProperty("link")) {
            $(card).find('.links').append( `<a target="_blank" rel="noopener noreferrer" href="${obj["link"]}">Zur Website</a>`);
        }
        if (obj.hasOwnProperty("git")) {
            $(card).find('.links').append( `<a target="_blank" rel="noopener noreferrer" href="${obj["git"]}">GitHub</a>`);
        }

     return card;
}




function showProjects(projects) {

    for (var i = 0; i < projects.length; i++){
      var obj = projects[i];

      if (obj["show"]) {

          // Clone the new row and insert it into the table
          var clone = template.content.cloneNode(true);
          var card = fillCard(clone, obj, "small");
          small.appendChild(clone);




      }


    }

}