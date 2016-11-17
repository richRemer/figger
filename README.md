Node.js Module
--------------
```js
var figger = require("figger"),
    join = require("path").join,
    confs = {
        global: "/etc/foo.conf",
        user: join(process.env.HOME, ".foo")
    };

figger(confs.global)
    .then(conf => figger(confs.user, conf))
    .then(conf => {
        // conf is object containing config values
    });
```

```sh
figger --envify /etc/foo.conf > .env
```
