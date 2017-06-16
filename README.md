figger
======
Figger is a Node.js package to process configuration files.  It can be used as a
module within a Node.js project, and can also be used from the command-line to
pre-compute a set of configurations and to optionally export 'env' files.

Configuration Format
--------------------
The configuration format is pretty basic.  The file can contain any number of
comments, includes, or assignments.  Anything else is ignored.

```
# set some default values
app-name    = My Application
app-secret  = hDaUIJv7zJNFztDz4c5f5z2K6FRSSUCS
app-welcome = ${app-name} says "welcome"

# load system base config
. /etc/my-app/app.conf

# load system config directory
. /etc/my-app/conf.d/*.conf
. /etc/my-app/conf.d/**/*.conf

# load additional config from local path
. local.conf

Note: this config is an example demonstrating some of the features of figger;
this note is ignored by figger because it does not contain any valid includes,
assignments, or comments.
```

### Identifiers
Configuration identifiers can contain alpha-numeric characters or any of the
following special characters: `.` `_` `-` `:` `@` `$` `!`

### Whitespace
Whitespace is ignored except when encountered inside a value.

### Values
Configuration values can contain any literal character except newline.  Leading
and trailing whitespace is ignored, but internal whitespace is preserved.
Quotes are OK, but a matched pair of leading and trailing quotes is ignored.
Inside matched quotes, the escape sequences `\n` and `\\` are available, which
evaluate to a newline and a literal backslash, respectively.  Leading and
trailing space inside matched quotes are also preserved.

### References
Configuration values can reference previously set values by including the
referenced identifier surrounded by `${` *ident* `}`.  So, `${app}` would
resolve to the value of the `app` identifier.

### Silent Failure
Any figger input that is not recognized is marked as an error and ignored.  This
helps with generating polyglots or for providing contextual documentation.

### Comments
Comments begin with a hash "#" and continue to the end of the line.  Comments
can appear on their own, or after an assignment.

### Includes
Includes work a bit like bash.  The include begins with a dot ".", followed by
the path to the included file or files.  The include path can be an absolute
path, a path relative to the file which includes it, or a glob pattern.

Globbed include paths which match more than one file are loaded in unspecified
order.  You must take care to avoid configurations which might cause some kind
of inconsistent result.

Module Use
----------
To use figger as a module, pass the main configuration file to the `figger`
function, and wait for the resulting Promise to resolve.  The function also
accepts an initial configuration object, which is useful for setting defaults or
for chaining multiple configurations.

```js
const figger = require("figger");
const join = require("path").join;

// load a single config file
figger("path/to/file.conf").then(config => {
    // config loaded
});

// load config with defaults
figger("path/to/file.conf", {port: 3456}).then(config => {
    // config loaded
});

// chain several configs
figger("first.conf")
    .then(conf => figger("second.conf", conf))
    .then(conf => {
        // configs loaded
    });
```

Command-line Use
----------------
The figger package includes a command-line tool, also called `figger`, which can
be used to pre-process figger configs.  It can optionally generate output in a
format compatible with 'env' files.

```sh
# pre-process app.conf and generate single config file in settings.conf
figger app.conf > settings.conf

# generate .env file from app.conf
figger --envify app.conf > .env
```
