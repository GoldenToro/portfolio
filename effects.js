/* -- Glow effect -- */
const blob = document.getElementById("blob");

var scrollBefore = 0;

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
        if (!(card.hasClass('wait') || card.hasClass('card-active') || card.hasClass('big') || card.hasClass('absolute') )) {

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
        if (!($(this).hasClass('absolute'))) {
            removeStyle($(this));

       }

      })
      .on("click",function(){

        var card = $(this);
        var container = card.closest('.card-container');

        if (!(card.hasClass('card-active') || container.hasClass('active'))) {
            turnAround(card);
        }
      });


    $('.exit').on("click",function(e){
        e.stopPropagation();
        var card = $(this).closest('.card');

        var container = card.closest('.card-container');

        if (!container.hasClass('active')) {
            turnAround(card);
        } else {

            toggleFullSize(card);
            setTimeout(() => {
                turnAround(card);
            }, 1800);

        }

    });

    $('.more').on("click",function(e){
        e.stopPropagation();

        var card = $(this).closest('.card');

        var timeOut = 900;

        if (card.hasClass("big")) {
            timeOut = 1800;
        }

        if (!card.hasClass('active')) {

            $(".card").addClass('active');

            toggleFullSize(card);

            setTimeout(() => {
                $(".card").removeClass('active');
            }, timeOut);

        }



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

    var isFullsize = container.hasClass("big");

    var $cards = container.find(".card").toArray();
    console.log("test")


    if (isFullsize) {

        $($cards).each(function(index) {

            if ($(this).attr("id") == card.attr("id")) {

                $(this).removeClass("big");
                container.removeClass("big");

                setTimeout(() => {
                    container.removeClass("active");
                }, 1800);


            } else {

                $(this).removeClass("up");

                setTimeout(() => {
                    $(this).removeClass('left');
                    $(this).removeClass('right');
                }, 500);

            }

        });

        setTimeout(() => {

            $($cards).each(function(index) {
                $(this).toggleClass("absolute");
                removeStyle($(this));
            });


            container.scrollTop(scrollBefore);
        }, 1800);

    } else {

        scrollBefore = container.scrollTop();
        var positionList = []

        $($cards).each(function(index) {
           var position = $(this).position(); // Get position relative to the offset parent
           var width = $(this).width(); // Get width of the element
           var height = $(this).height(); // Get height of the element

           // Save position, width, and height data into an object
           var elementData = {
               id: $(this).attr("id"),
               position: position,
               width: width,
               height: height
           };

           positionList.push(elementData);
        });

        positionList.forEach(function(elementData) {

            thisCard = container.find("#"+elementData.id);

           thisCard.css({
              position: 'absolute',
              top: elementData.position.top + 'px',
              left: elementData.position.left + 'px',
              width: elementData.width + 'px',
              height: elementData.height + 'px'
            });

            thisCard.toggleClass("absolute");
        });

        $($cards).each(function(index) {

            if ($(this).attr("id") == card.attr("id")) {

            setTimeout(() => {
                $(this).addClass("big");
                container.addClass("big");
                container.addClass("active");
            }, 100);


            } else {

                var className = (index % 2 === 0) ? 'left' : 'right';

                // Add the determined class to the current div
                $(this).addClass(className);

                setTimeout(() => {
                    $(this).addClass("up");
                }, 800);

            }

        });

    }



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