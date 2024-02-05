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
    var cards = $("#small-cards .card");

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
        var card = $(this.parentElement.parentElement);
        turnAround(card);
        card.find(".back").removeClass("bigger");
    });

    $('.more').on("click",function(e){
        e.stopPropagation();


        var small_card = $("#"+$(this).closest('.card').attr('id').replace('big', 'small'));
        var big_card = $("#"+$(this).closest('.card').attr('id').replace('small', 'big'));


        var sourcePosition = small_card.position();
        var sourceWidth = small_card.width();
        var sourceHeight = small_card.height();

        console.log(sourcePosition.top);


        big_card.css({
          top: sourcePosition.top + 'px',
          left: sourcePosition.left + 'px',
          width: sourceWidth + 'px',
          height: sourceHeight + 'px'
        });



        setTimeout(() => {

            if (big_card.hasClass("active")) {

                big_card.removeClass("active");
                big_card.addClass("wait5s");

                setTimeout(() => {
                    small_card.removeClass("hide");
                    big_card.removeClass("wait5s");

                    setTimeout(() => {
                        $("#small-cards").removeClass("overflow");
                        $("#big-cards").removeClass("overflow");
                    }, 250);
                }, 500);
            } else {

                big_card.addClass("active");
                small_card.addClass("hide");
                $("#small-cards").addClass("overflow");
                $("#big-cards").addClass("overflow");

            }

        }, 50);


    });

    $('.slider-button').on("click",function(e){

        e.stopPropagation();

        var card = $(this.parentElement.parentElement.parentElement.parentElement);
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