const tbody = document.querySelector("#card-container");
const template = document.querySelector("#card");

var data = [];


$.getJSON("data.json", function(json) {
    console.log(json)
    data  = json;

    showProjects(data); // this will show the info it in firebug console

    updateCardEffects();
});


function showProjects(projects) {

    for (var i = 0; i < projects.length; i++){
      var obj = projects[i];

      if (obj["show"]) {

          // Clone the new row and insert it into the table
          var clone = template.content.cloneNode(true);
          $(clone).find('.title').text(obj["title"]);

          $(clone).find('.status').html(`Status:<br>${obj["status"]}`);

          for (var j = 0; j < obj["tags"].length; j++){
            var tag = obj["tags"][j];
            $(clone).find('.tags').append(`<div>${tag}</div>`);

          }

          $(clone).find('.text').text(obj["text"]);
          $(clone).find('.background').css("background-image",`url(${obj["pic"]})`);


            if (obj.hasOwnProperty("link")) {
                $(clone).find('.links').append( `<a href="${obj["link"]}">Probiere es aus</a>`);
            }
            if (obj.hasOwnProperty("git")) {
                $(clone).find('.links').append( `<a href="${obj["git"]}">GitHub</a>`);
            }


          tbody.appendChild(clone);

      }


    }

}