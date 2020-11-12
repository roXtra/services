# Example Service Project

This example service folder serves as a template for starting the service development

## Getting started for development

1. Copy the whole repository
2. Rename this folder to follow the schema {roXtra-customer-number}-{service-name}
3. Modify/configure some configuration files (shown below).
4. Start developing your service here
5. Send us the new service

### Necessary file modifications

Below you can see which files have to be modified 

#### package.json
Inside the package.json you have multiple places which *must* be modified

1. name - the package name must follow the scheme @eformservice/{service-name}
2. servicename - this will later be shown inside the UI change it to your {service-name}
3. version - use semantic versioning here (e.g. 1.0.0)
4. description - add some text here which describes your service and its use cases it operates on

#### service.json
Inside the service.json you have multiple places which *must* be modified

1. id - insert here {roXtra-customer-number}-{service-name}-service . This must not change over time.
2. name - insert this Services Name no schema necessary
3. minRoxtraVersion - preferably insert your installed roXtra version. This field is being used to check compatibility.
4. actions - under actions you define the possible actions your service can perform 

## Development
For developing a new service you need at least three files to modify:

- service.json - defines metadata and all actions this service is capable of

for each defined action you will need two files defining the action:

1. {action}-config.tsx - defines the UI of the service which will later be embedded into Processes
2. {action}-service.ts - defines the functional code which gets fired when the service will be executed

## Building

When you have finished development and want to build the services including this service, you should execute the 
"buildbundle" script inside the package.json in the root of this repo. 

If you want to build this single service, just execute following scripts inside the package.json related to this service
in a specific order:
1. lint
2. build
3. copyandzip

After that there should be a zip file named like the service's directory name. 
This is your ready-to-install bundled service.

## Debugging
As for now debugging your service code is not possible. 
We suggest to use "console.log" to output debug information to the browser console.
Nevertheless there are no console statements allowed when this service is being sent to us, 
so do not forget to delete or comment out these statements before sending this service to us.

## Testing
For testing, we highly recommend that you go for mocking where possible, so you do not depend on a running roXtra server 
with an enabled Processes module. We do not execute your tests during build.

## Considerations

### package.json
The package.json consists of three sections you should handle carefully. Down below we tell you some of the stumbling blocks
you should be aware of.

#### scripts
The section "scripts" contains our building scripts. The following scripts must be executable for service acceptance 
so modifications for the below mentioned scripts are not allowed:
- lint - for checking if there are any linter or code formatting errors in the code
- build - shortcut for building this package
- build:server - building this service
- build:test - building the tests for this service
- test - testing this service
- copyproduction - installs production dependencies and copies the compiled production files into a seperate folder for packaging
- copyfiles - prepares the compiled production files for further processing
- zip - Zip the build package
- copyandzip - this script bundles the production code into a service zip file
- installlocadependencies - install local packaged dependencies (e.g. roxtraapi.tgz)
- check:format - checking whether the code conforms to our coding standards

#### dependencies / dev-dependencies
Do not remove any of the contained dependencies or dev-dependencies.

Under "dependencies" there are some packages this service absolutely needs to work properly.
These dependant packages are:

- processhub-sdk - you should use the same version as the version of Prozesse
- react - actual React (at the time of writing) is 17.0.1
- semantic-ui-react - we prefer you leave the version as is. Internally we use Semantic for displaying all of our services.

Add dependencies as you need as long as these three packages are included.
Please ensure that all used dependencies are available freely from npm in order to pull these dependencies during builds.
