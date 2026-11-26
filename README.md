# jquery-loading-button

A small jQuery plugin that shows a spinner on a clicked button and prevents double clicks.

The repository has two files:

| File | What it does | When to use it |
|---|---|---|
| `src/loading-button.js` | The plugin. You choose the buttons and call `.loading()` on them. | Always. |
| `src/form-submit-guard.js` | Optional script that prevents double submits on every form of the page. | When you want forms protected without calling the plugin on each button. |

## Requirements

- jQuery 3.4.1 or later, below 5. Tested with 3.4.1, 3.7.1 and 4.0.0.
- [Font Awesome](https://fontawesome.com/) CSS, for the spinner icon. Without it the button is still disabled while loading, but no spinner is visible.

## Installation

### From jsDelivr

Include the scripts after jQuery. The guard needs the plugin, so keep this order:

```html
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/ppazos/jquery-loading-button@1.0.0/src/loading-button.min.js"></script>

<!-- optional -->
<script src="https://cdn.jsdelivr.net/gh/ppazos/jquery-loading-button@1.0.0/src/form-submit-guard.min.js"></script>
```

The repository has no `.min.js` files: jsDelivr generates them when they are requested.

Always use an exact version (`@1.0.0`) in production. A range such as `@1` or a branch such as `@master` can change what your pages load without any change on your side.

#### Subresource Integrity (optional)

To make the browser reject a modified file, use the file without `.min` and add its hash. Compute it from the tagged version of the file:

```bash
git show 1.0.0:src/loading-button.js | openssl dgst -sha384 -binary | openssl base64 -A
```

```html
<script src="https://cdn.jsdelivr.net/gh/ppazos/jquery-loading-button@1.0.0/src/loading-button.js"
        integrity="sha384-PASTE_THE_HASH_HERE" crossorigin="anonymous"></script>
```

### Local copy

Download the files from `src/` of a tagged version and serve them with your other assets.

## Usage: the plugin

```html
<button type="submit" id="save">Save</button>

<script>
  $(function() {
    $('#save').loading();
  });
</script>
```

When the button is clicked, the plugin hides it and shows a disabled copy with a spinner. Inside a form, nothing happens if the form is invalid (the browser shows its validation messages), unless the form has `novalidate` or the button has `formnovalidate`.

### Methods

| Call | Effect |
|---|---|
| `$(selector).loading()` | Registers the buttons: they start loading when clicked. Calling it twice is harmless. |
| `$(selector).loading('start')` | Shows the spinner now. |
| `$(selector).loading('stop')` | Removes the spinner and shows the button again. Does nothing if the button is not loading. |

All of them return the jQuery object, so calls can be chained.

### Stop the spinner when the page stays

The page has to call `stop` whenever it does not navigate away, for example after an AJAX request or when your own code cancels the submit:

```js
var $save = $('#save');
$save.loading();

$('#my-form').on('submit', function(e) {
  e.preventDefault();

  $.post(this.action, $(this).serialize()).always(function() {
    $save.loading('stop');
  });
});
```

## Usage: the form submit guard

Include `form-submit-guard.js` after the plugin. There is nothing to call.

It acts when a form is submitted, after the handlers of your page:

- If a handler cancelled the submit (`e.preventDefault()` or `return false`), the guard does nothing. AJAX forms and custom validation keep working.
- Otherwise it locks the form, shows the spinner on the submit button and cancels any further submit.
- If the Back button restores the page from the browser cache, it unlocks the forms.

The guard prevents submitting a form twice. It does not cover buttons that send requests without submitting a form: protect those in your own code.

### Opting out

A form that downloads a file stays on screen, so it must opt out, or it stays locked:

```html
<form action="/report.csv" method="post" data-no-submit-guard>
  <button type="submit">Download</button>
</form>
```

### Limitations

- Handlers that cancel the submit must be bound to the form, or to an element between the form and `document`. A handler bound to `document` after the guard loaded runs too late, and the form stays locked.
- Calling `.loading('stop')` on the button of a guarded form shows the button, but the form stays locked. Use `data-no-submit-guard` on forms where your code controls the spinner.
- The DOM method `form.submit()` (without jQuery) fires no `submit` event, so the guard does not see it.
- An `<input type="submit">` is protected and disabled, but shows no spinner, because an input cannot contain an icon.
- If the user cancels the navigation (Esc or the stop button), the form stays locked until the page is reloaded.
- The guard only protects the browser side. The server still has to handle repeated requests.

## Running the tests (Linux)

The tests use [Playwright](https://playwright.dev/) to run both scripts in real browsers (Chromium and Firefox), once for each supported jQuery version. A small local server records the requests the pages send. No other services are needed.

All commands run from the root of the repository.

### 1. Install Node.js

Node.js 20 or later is required. Check with `node --version`. If it is missing or older, install it with [nvm](https://github.com/nvm-sh/nvm) or your distribution's packages.

### 2. Install the dependencies

```bash
npm ci
```

### 3. Install the browsers

```bash
npx playwright install chromium firefox
```

If a browser fails to start because system libraries are missing, install them too (this asks for `sudo`, and supports Debian and Ubuntu):

```bash
npx playwright install --with-deps chromium firefox
```

### 4. Run

```bash
npm test                                                  # all browsers and jQuery versions
npm run test:chromium                                     # Chromium only
npx playwright test --project=chromium-jquery-3.7         # one browser and jQuery version
npx playwright test loading-button.spec                   # one file
npx playwright test -g "double click"                     # tests whose name matches
npx playwright test --project=chromium-jquery-3.7 --headed --workers=1   # watch the browser
```

### Reading the results

- The test named `known limitation` is expected to fail. Playwright counts it as passed, although the list shows it with a cross. If it starts working, the run reports it so the limitation can be removed from this document.
- The Back button test is skipped when the browser does not restore the page from its cache, which is the case for the Firefox build used by Playwright.
- `npm audit` reports a vulnerability in jQuery 3.4.1. It is installed only to test that version.

## Project structure

```
src/                          files that are published
  loading-button.js
  form-submit-guard.js
test/
  loading-button.spec.js      tests of the plugin
  form-submit-guard.spec.js   tests of the guard
  fixtures/
    pages.js                  HTML pages used by the tests
    server.js                 local server that records requests
    test.js                   shared helpers
playwright.config.js          browsers and jQuery versions
```

## Publishing a version

jsDelivr serves the tagged versions of public GitHub repositories directly: there is no registration and no build step.

1. Update the version in `package.json`, in the first line of both files in `src/`, in the URLs of this README, and add the changes to `CHANGELOG.md`.
2. Run `npm install` to update `package-lock.json`, then `npm test`.
3. Commit and push.
4. Create the release, which also creates the tag. Use a [semantic version](https://semver.org/) without prefix:

   ```bash
   gh release create 1.0.0 --title 1.0.0 --notes "See CHANGELOG.md"
   ```

   Without the GitHub CLI: `git tag 1.0.0 && git push origin 1.0.0`.

5. Check that `https://cdn.jsdelivr.net/gh/ppazos/jquery-loading-button@1.0.0/src/loading-button.js` loads.

jsDelivr stores the files of an exact version permanently. Never move or reuse a tag: to fix a released version, publish a new one.

The `main`, `jsdelivr` and `files` fields of `package.json` are only used if the package is also published to npm, which the steps above do not require.

## License

[Apache License 2.0](LICENSE)
