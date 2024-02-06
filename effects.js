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
        if (!(card.hasClass('wait') || card.hasClass('card-active') || card.hasClass('big') )) {


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

            var backgroundPosition = 50 - lp;

            $(this).find('.background').css("background-position",`${backgroundPosition}% 0%`)



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

        var card = $(this);

        if (!card.hasClass('card-active')) {
            turnAround(card);
        }
      });


    $('.exit').on("click",function(e){
        e.stopPropagation();
        var card = $(this).closest('.card');


        turnAround(card);

    });

    $('.more').on("click",function(e){
        e.stopPropagation();


        var card = $(this).closest('.card');
        toggleFullSize(card)

    });

    $('.slider-button').on("click",function(e){

        e.stopPropagation();

        var card = $(this).closest('.card');
        var direction = $(this).hasClass("next") ? "right" : "left";
        //console.log("clicked")
        //console.log(card)
        console.log(direction)

        var active_slide = card.find(".slide").not(".left").not(".right")

        var next_slide = active_slide.next().filter(".right")
        var prev_slide = active_slide.prev().filter(".left")

        if (direction == "right")  {

            if (next_slide.length > 0) {
                active_slide.addClass("left");
                next_slide.removeClass("right");
                card.find(".slider-button.prev").removeClass("unavailable");
            }

            if (next_slide.next().filter(".right").length < 1) {
                card.find(".slider-button.next").addClass("unavailable");
            }


        } else {
            if (prev_slide.length > 0) {
                active_slide.addClass("right");
                prev_slide.removeClass("left");
                card.find(".slider-button.next").removeClass("unavailable");
            }

            if (prev_slide.prev().filter(".left").length < 1) {
                card.find(".slider-button.prev").addClass("unavailable");
            }


        }

    });


}



function toggleFullSize(card) {

    var container = card.closest('.card-container');

    var sourcePosition = card.position();
    var sourceWidth = card.width();
    var sourceHeight = card.height();

    console.log(sourcePosition)

    $(".card").toggleClass("big");

    card.toggleClass("absolute");

    setTimeout(() => {
        card.nextAll().toggleClass("right")
        card.prevAll().toggleClass("left")
    }, 100);

    card.css({
      top: sourcePosition.top + 'px',
      left: sourcePosition.left + 'px',
      width: sourceWidth + 'px',
      height: sourceHeight + 'px'
    });



    $(".card").addClass("wait");
    setTimeout(() => {
        $(".card-container").animate({
            scrollTop: card.offset().top - (container.offset().top + 20)
        }, 800);
    }, 900);
    setTimeout(() => {
        $(".card").removeClass("wait");
    }, 900);
}

function turnAround(div) {

     removeStyle(div);
     div.toggleClass("card-turning");


     div.addClass("wait");


     div.toggleClass("card-active");

    setTimeout(() => {
        div.removeClass("wait");
    }, 900);

}

function removeStyle(div) {
    div.removeAttr("style");
    div.find('.background').attr( 'style', div.find('.background').attr('style').replace( new RegExp("background-position: -?\\d*% 0%;"), '' ));
        //background-position: 16% 0%;"
}

updateCardEffects();