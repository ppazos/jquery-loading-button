# Changelog

## 1.0.0

First release from this repository. Changes compared with the copies of the plugin that lived inside other projects:

### Added
- `start` method, to show the spinner from code.
- `form-submit-guard.js`, an optional script that prevents double submits on every form of a page.

### Fixed
- Calling `.loading()` twice on a button bound two handlers and created two spinners.
- `.loading()` did not return the jQuery object, so calls could not be chained.
- Pressing Enter after clicking a button submitted the form a second time.
- `stop` showed hidden buttons that the plugin had not hidden.
- Forms with `novalidate`, and buttons with `formnovalidate`, were blocked when invalid.

### Removed
- The `options` argument of `init`, which was never used.
