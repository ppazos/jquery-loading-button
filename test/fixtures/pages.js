// HTML pages used by the tests. Each one receives the jQuery package to load.

const script = src => `<script src="${src}"></script>`;

function page(jquery, { body, guard = false, setup = '' }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    ${script(`/jquery/${jquery}`)}
    ${script('/src/loading-button.js')}
    ${guard ? script('/src/form-submit-guard.js') : ''}
  </head>
  <body>
    ${body}
    <script>${setup}</script>
  </body>
</html>`;
}

const form = ({ action = '/submit', attrs = '' } = {}) => `<form id="f" action="${action}" method="post" ${attrs}>
  <input id="in" name="q" value="x">
  <button id="go" type="submit" name="act" value="go">Go</button>
</form>`;

const stay = '/submit?stay=1';

// pages for the plugin alone: the button calls .loading()
const plugin = (options, setup = '') => jquery =>
  page(jquery, { body: form(options), setup: `$('#go').loading(); ${setup}` });

// pages that rely on the form submit guard only
const guarded = (body, setup = '') => jquery => page(jquery, { body, setup, guard: true });

module.exports = {
  plugin: plugin(),
  pluginStay: plugin({ action: stay }),

  pluginRequired: jquery => page(jquery, {
    body: `<form action="/submit" method="post"><input required name="r"><button id="go">Go</button></form>`,
    setup: `$('#go').loading();`,
  }),

  pluginNovalidate: jquery => page(jquery, {
    body: `<form action="/submit" method="post" novalidate><input required name="r"><button id="go">Go</button></form>`,
    setup: `$('#go').loading();`,
  }),

  pluginFormnovalidate: jquery => page(jquery, {
    body: `<form action="/submit" method="post"><input required name="r"><button id="go" formnovalidate>Go</button></form>`,
    setup: `$('#go').loading();`,
  }),

  pluginHidden: jquery => page(jquery, {
    body: `<button id="go" type="button" style="display:none">Go</button>`,
    setup: `$('#go').loading();`,
  }),

  guard: guarded(form()),
  guardStay: guarded(form({ action: stay })),
  guardRequired: guarded(`<form action="/submit" method="post"><input required name="r"><button id="go">Go</button></form>`),
  guardCancelled: guarded(form(), `$('#f').on('submit', function() { return false; });`),

  guardAjax: guarded(form(), `$('#f').on('submit', function(e) { e.preventDefault(); $.get('/ajax'); });`),

  guardDynamic: guarded(`<div id="host"></div>`,
    `setTimeout(function() { $('#host').html(${JSON.stringify(form())}); }, 100);`),

  guardDownload: guarded(form({ action: '/download', attrs: 'data-no-submit-guard' })),

  // opted out form that handles its own spinner, and stops it when the download arrives
  guardOwnSpinner: guarded(
    `<form action="/download" method="post" data-no-submit-guard>
      <input type="hidden" name="download_token" value="t1">
      <button id="go">Go</button>
    </form>`,
    `$('#go').loading().on('click', function() {
      var button = $(this);
      var timer = setInterval(function() {
        if (document.cookie.indexOf('download_token=t1') === -1) return;
        clearInterval(timer);
        document.cookie = 'download_token=; Max-Age=0; path=/';
        button.loading('stop');
      }, 50);
    });`),

  // a button outside the form submits it from code
  guardOutsideButton: guarded(
    `<form id="f" action="/submit" method="post"><input name="q" value="x"></form>
     <button id="go" type="button">Go</button>`,
    `$('#go').on('click', function() { $('#f').submit(); });`),

  // the click handler of a submit button also submits from code
  guardScriptAndNative: guarded(form(), `$('#go').on('click', function() { $('#f').submit(); });`),

  guardFormAttribute: guarded(
    `<form id="f" action="/submit" method="post"><input name="q" value="x"></form>
     <button id="go" form="f">Go</button>`),

  guardInput: guarded(`<form action="/submit" method="post"><input id="go" type="submit" value="Go"></form>`),

  // known limitation: a handler bound to the document after the guard runs too late
  guardLateCancel: guarded(form(),
    `$(document).on('submit', '#f', function(e) { e.preventDefault(); });`),
};
