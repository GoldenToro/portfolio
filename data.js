const tbody = document.querySelector("#card-container");
const template = document.querySelector("#card");

var data = [];


$.getJSON("test.json", function(json) {
    console.log(json)
    data  = json;

    showProjects(data); // this will show the info it in firebug console

    updateCardEffects();
});


function showProjects(projects) {

    for (var i = 0; i < projects.length; i++){

      var obj = projects[i];


      // Clone the new row and insert it into the table
      var clone = template.content.cloneNode(true);
      $(clone).find('.title').text(obj["title"]);

      tbody.appendChild(clone);
    }

}