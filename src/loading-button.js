/*! jquery-loading-button v1.0.0 | Apache-2.0 | https://github.com/ppazos/jquery-loading-button */
(function( $ ) {

  // a button is loading while its disabled clone sits next to it
  function is_loading(button) {
    return button.next('.loading-button-clone').length > 0;
  }

  var methods = {
    init : function() {
      return this.each(function() {
        var button = $(this);

        if (button.data('loading-button-initialized')) return;

        button.data('loading-button-initialized', true);
        button.on('click.loading-button', function(){

          // pressing Enter clicks the default button even if it is hidden, this avoids a second submit
          if (is_loading(button)) return false;

          // has a container form?
          let container_form = button.closest('form');

          // forms and buttons can opt out of validation
          if (container_form.length > 0 && !container_form[0].noValidate && !this.formNoValidate)
          {
            // if container form is invalid, not show spinner
            if (!container_form[0].reportValidity()) return false;
          }

          methods.start.apply(button);

          return true;
        });
      });
    },
    start : function() {
      return this.each(function() {
        var original_button = $(this);

        if (is_loading(original_button)) return;

        // we create a new button because if we set disabled to the submit btn, the form is not submitted in Chrome
        var disabled_button = original_button.clone();

        disabled_button.addClass('disabled loading-button-clone')
               .prop('disabled', true)
               .prepend('<i class="fa fa-spinner fa-spin fa-fw"></i> ');

        original_button.hide();
        disabled_button.insertAfter(original_button);
      });
    },
    stop : function() {
      return this.each(function() {
        var original_button = $(this);

        // do not show a button that this plugin did not hide
        if (!is_loading(original_button)) return;

        original_button.next('.loading-button-clone').remove();
        original_button.show();
      });
    }
  };


  $.fn.loading = function(methodOrOptions) {
    if ( methods[methodOrOptions] )
    {
      return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    }
    else if ( typeof methodOrOptions === 'object' || ! methodOrOptions )
    {
      // Default to "init"
      return methods.init.apply( this, arguments );
    }
    else
    {
      $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.loading' );
    }
  };
}( jQuery ));
