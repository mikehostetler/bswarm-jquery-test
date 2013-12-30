# BrowserSwarm jQuery Test Suite Worker test shim

This little project was created to manually test running the 
jQuery Test Suite through Node.js as is done through BrowserSwarm
to try and diagnose some issues with the tests that require 
PHP on the backend to test certain AJAX responses.

## Install

* Clone jQuery into the /jquery/ folder.

```
git clone git@github.com:jquery/jquery.git
```

* Install NPM Extensions
``` 
npm install
```

* Start the server
node server.js

* Navigate to the test suite
http://localhost:8031/test/index.html?
