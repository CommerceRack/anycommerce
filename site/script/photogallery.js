$(function() {
       var galleries = $('.ad-gallery').adGallery();
    setTimeout(function() {
      galleries[0].addImage("images123/thumbs/t7.jpg", "images123/7.jpg");
    }, 1000);
    setTimeout(function() {
      galleries[0].addImage("images123/thumbs/t8.jpg", "images123/8.jpg");
    }, 2000);
    setTimeout(function() {
      galleries[0].addImage("images123/thumbs/t9.jpg", "images123/9.jpg");
    }, 3000);
    setTimeout(function() {
      galleries[0].removeImage(1);
    }, 4000);
    
    $('#switch-effect').change(
      function() {
        galleries[0].settings.effect = $(this).val();
        return false;
      }
    );
    $('#toggle-slideshow').click(
      function() {
        galleries[0].slideshow.toggle();
        return false;
      }
    );
    $('#toggle-description').click(
      function() {
        if(!galleries[0].settings.description_wrapper) {
          galleries[0].settings.description_wrapper = $('#descriptions');
        } else {
          galleries[0].settings.description_wrapper = false;
        }
        return false;
      }
    );
  });