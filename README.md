PrepTickets Admin Tool 1.0
===========================================
<br />


# For Developers

## Requirements

You must have the following packages intalled:

* node [http://www.nodejs.org/]
* grunt [http://gruntjs.com/]
* bower [https://github.com/twitter/bower/]

Optional for executing tests

* testacular [http://testacular.github.com/]

## Build

Once you checkout this repository, you should be able to do

``
npm install && bower install
``

> There is an issue while installing *es5-shim* package in Windows, so if you get an error while running *bower*, comment out the line in *components.json* where it reads "es5-shim" and install the package manually in *./components/es5-shim*. You can clone https://github.com/kriskowal/es5-shim.git

The above command will load all required libraries and components from either *node* or *bower* repositories.
Afterwards, use the *grunt* command to build or execute the tasks available for the build process.

* Use `grunt build` to generate the distribution package, which will reside in *./dist*
* Use `grunt compress:build --target=preptickets` to generate a package in *./build/build-latest.zip*.
* Use `grunt test` to execute the tests located in *./test*. This command makes use of *testacular* [http://testacular.github.com/]
* Use `grunt wp` to generate a *WordPress* plugin package in *./dist/wp-azuretickets.zip*.
* Use `grunt server` to start a local server on port 9001. [http://localhost:9001/#/admin]
