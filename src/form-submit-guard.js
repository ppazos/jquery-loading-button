/*! jquery-loading-button: form submit guard v1.0.0 | Apache-2.0 | https://github.com/ppazos/jquery-loading-button */
/*
  Prevents submitting the same form twice, on every page that loads it.
  Requires loading-button.js

  It acts on the submit event, after the page's own handlers:
    - if a handler cancelled the submit (validation, AJAX) nothing is locked, the page owns that flow
    - if not, the form is locked and a spinner replaces the submit button until the page is left

  Forms that download a file stay on screen, so they must opt out with the data-no-submit-guard attribute.
*/
(function( $ ) {

  $(document).on('submit', 'form:not([data-no-submit-guard])', function(e) {
    if (e.isDefaultPrevented()) return;

    var form = $(this);

    if (form.data('submit-guard-button'))
    {
      e.preventDefault();
      return;
    }

    // there is no submitter when the form is submitted from JS
    var submitter = e.originalEvent && e.originalEvent.submitter;
    var button = submitter ? $(submitter) : form.find('button[type="submit"], button:not([type]), input[type="submit"]').first();

    form.data('submit-guard-button', button);
    button.loading('start');
  });

  // the Back button can restore the page from the browser cache, still locked
  $(window).on('pageshow', function(e) {
    if (!e.originalEvent.persisted) return;

    $('form').each(function() {
      var button = $(this).data('submit-guard-button');

      if (button) button.loading('stop');

      $(this).removeData('submit-guard-button');
    });
  });
}( jQuery ));
