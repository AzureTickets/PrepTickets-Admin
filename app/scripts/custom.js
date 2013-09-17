$(function() {
  /* Progressbar animation */
  setTimeout(function() {
    $('.progress-animated .bar').each(function() {
      var me = $(this);
      var perc = me.attr("data-percentage");

      // TODO: left and right text handling

      var current_perc = 0;

      var progress = setInterval(function() {
        if (current_perc >= perc) {
          clearInterval(progress);
        } else {
          current_perc += 1;
          me.css('width', (current_perc) + '%');
        }

        me.text((current_perc) + '%');

      }, 600);
    });
  }, 600);

  // Horizontal slider
  $("#master1, #master2").slider({
    value : 60,
    orientation : "horizontal",
    range : "min",
    animate : true
  });

  $("#master4, #master3").slider({
    value : 80,
    orientation : "horizontal",
    range : "min",
    animate : true
  });

  $("#master5, #master6").slider({
    range : true,
    min : 0,
    max : 400,
    values : [ 75, 200 ],
    slide : function(event, ui) {
      $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
    }
  });

  // Vertical slider
  $("#eq > span").each(function() {
    // read initial values from markup and remove that
    var value = parseInt($(this).text(), 10);
    $(this).empty().slider({
      value : value,
      range : "min",
      animate : true,
      orientation : "vertical"
    });
  });

  // Support
  $("#slist a").click(function(e) {
    e.preventDefault();
    $(this).next('p').toggle(200);
  });

  $(window).scroll(function() {
    if ($(this).scrollTop() > 300) {
      $('.totop').slideDown();
    } else {
      $('.totop').slideUp();
    }
  });

  /* Scroll to Top */
  $(".totop").hide();
  $('.totop a').click(function(e) {
    e.preventDefault();
    $('body,html').animate({
      scrollTop : 0
    }, 500);
  });

  $(window).resize(function() {
    if ($(window).width() >= 765) {
      $(".sidebar .sidebar-inner").slideDown(350);
    } else {
      $(".sidebar .sidebar-inner").slideUp(350);
    }
  });

  /* Auto notification */

  setTimeout(
      function() {

        var unique_id = $.gritter
            .add({
              // (string | mandatory) the heading of the notification
              title : 'Howdy! User',
              // (string | mandatory) the text inside the notification
              text : 'Today you got some messages and new members. Please check it out!',
              // (string | optional) the image to display on the left
              image : 'assets/img/user-big.jpg',
              // (bool | optional) if you want it to fade out on its own
              // or just sit there
              sticky : false,
              // (int | optional) the time you want it to be alive for
              // before fading out
              time : '',
              // (string | optional) the class name you want to apply to
              // that specific message
              class_name : 'gritter-custom'
            });

        // You can have it return a unique id, this can be used to
        // manually remove it later using
        setTimeout(function() {
          $.gritter.remove(unique_id, {
            fade : true,
            speed : 'slow'
          });
        }, 10000);

      }, 4000);

  /* On click notification. Refer ui.html file */

  /* Regulat notification */
  $(".notify")
      .click(
          function(e) {

            e.preventDefault();
            var unique_id = $.gritter
                .add({
                  // (string | mandatory) the heading of the
                  // notification
                  title : 'Howdy! User',
                  // (string | mandatory) the text inside the
                  // notification
                  text : 'Today you got some messages and new members. Please check it out!',
                  // (string | optional) the image to display on the
                  // left
                  image : 'assets/img/user-big.jpg',
                  // (bool | optional) if you want it to fade out on its
                  // own or just sit there
                  sticky : false,
                  // (int | optional) the time you want it to be alive
                  // for before fading out
                  time : '',
                  // (string | optional) the class name you want to
                  // apply to that specific message
                  class_name : 'gritter-custom'
                });

            // You can have it return a unique id, this can be used to
            // manually remove it later using
            setTimeout(function() {
              $.gritter.remove(unique_id, {
                fade : true,
                speed : 'slow'
              });
            }, 6000);

          });

  /* Sticky notification */
  $(".notify-sticky")
      .click(
          function(e) {

            e.preventDefault();
            var unique_id = $.gritter
                .add({
                  // (string | mandatory) the heading of the
                  // notification
                  title : 'Howdy! User',
                  // (string | mandatory) the text inside the
                  // notification
                  text : 'Today you got some messages and new members. Please check it out!',
                  // (string | optional) the image to display on the
                  // left
                  image : 'assets/img/user-big.jpg',
                  // (bool | optional) if you want it to fade out on its
                  // own or just sit there
                  sticky : false,
                  // (int | optional) the time you want it to be alive
                  // for before fading out
                  time : '',
                  // (string | optional) the class name you want to
                  // apply to that specific message
                  class_name : 'gritter-custom'
                });

          });

  /* Without image notification */
  $(".notify-without-image")
      .click(
          function(e) {

            e.preventDefault();
            var unique_id = $.gritter
                .add({
                  // (string | mandatory) the heading of the
                  // notification
                  title : 'Howdy! User',
                  // (string | mandatory) the text inside the
                  // notification
                  text : 'Today you got some messages and new members. Please check it out!',
                  // (bool | optional) if you want it to fade out on its
                  // own or just sit there
                  sticky : false,
                  // (int | optional) the time you want it to be alive
                  // for before fading out
                  time : '',
                  // (string | optional) the class name you want to
                  // apply to that specific message
                  class_name : 'gritter-custom'
                });

          });

  /* Remove notification */
  $(".notify-remove").click(function() {
    $.gritter.removeAll();
    return false;
  });

  $("#todaydate").datepicker();

  /* Modal fix */
  $('.modal').appendTo($('body'));
});
