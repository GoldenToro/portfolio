/* -- Glow effect -- */
const blob = document.getElementById("blob");

window.onpointermove = event => {
  const { clientX, clientY } = event;

  blob.animate({
    left: `${clientX}px`,
    top: `${clientY}px`
  }, { duration: 30000, fill: "forwards" });
};



function updateCardEffects() {

var x;
var cards = $(".card");

cards
  .on("mousemove touchmove", function(e) {

    var card = $(this);
    if (!card.hasClass('wait') && !card.hasClass('card-active')) {


        // normalise touch/mouse
        var pos = [e.offsetX,e.offsetY];
        e.preventDefault();
        if ( e.type === "touchmove" ) {
          pos = [ e.touches[0].clientX, e.touches[0].clientY ];
        }
        // math for mouse position
        var l = pos[0];
        var t = pos[1];
        var h = card.height();
        var w = card.width();
        // math for gradient / background positions
        var tp = Math.abs(Math.floor(((t-h)/h)*100))-50;
        var lp = Math.abs(Math.floor(((l-w)/w)*100))-50;
        var ty = tp * 0.15  * -1;
        var tx = lp * 0.2;
        if (card.hasClass('card-turning')) {
            tx = 180 + (-0.3 * tx);
            ty = ty * 0.3;
        }

        var tf = `transform: rotateX(${ty}deg) rotateY(${tx}deg)`
        card.attr( "style", tf );
        clearTimeout(x);
    }

  })
  .on("mouseout touchend touchcancel", function() {
    // remove css, apply custom animation on end
    removeStyle($(this));

  })
  .on("click",function(){

     removeStyle($(this));
     $(this).toggleClass("card-turning");

     $(this).addClass("wait");


     $(this).toggleClass("card-active");

    setTimeout(() => {
        $(this).removeClass("wait");
    }, 900);

  });
}


function removeStyle(div) {
    div.removeAttr("style");
}


updateCardEffects();