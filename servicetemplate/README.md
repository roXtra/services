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

1. author - insert your name and email so others can contact you in case of questions
2. customer - change this to your roXtra customer number
3. name - the package name must follow the scheme @eformservice/{service-name}
4. servicename - this will later be shown inside the UI change it to your {service-name}
5. version - use semantic versioning here (e.g. 1.0.0)
6. description - add some text here which describes your service and its use cases it operates on

#### service.json
Inside the service.json you have multiple places which *must* be modified

1. id - insert here {roXtra-customer-number}-{service-name}
2. name - insert this Services Name no schema necessary
3. minRoxtraVersion - preferably insert your installed roXtra version. This field is being used to check compatibility.
4. actions - under actions you define the possible actions your service can perform 

## Development
For developing a new service you need at least three files to modify:

- service.json - defines metadata and all actions this service is capable of

for each defined action you will need two files defining the action:

1. {action}-config.tsx - defines the UI of the service which will later be embedded into Processes
2. {action}-service.ts - defines the functional code which gets fired when the service will be executed

## Debugging
As for now debugging your service code is not possible. We suggest to use "console.log" to output debug information to the browser console.

## Testing
For testing, we highly recommend that you go for mocking where possible, so you do not depend on a running roXtra server 
with an enabled Processes module. We do not execute your tests during build.

## Considerations

### package.json
The package.json consists of three sections you should handle carefully. Down below we tell you some of the stumbling blocks
you should be aware of.

#### scripts
The section "scripts" contains our building scripts. Modifications are not allowed!

#### dependencies / dev-dependencies
Do not remove any of the contained dependencies or dev-dependencies.

Under "dependencies" there are some packages this service absolutely needs to work properly.
These dependant packages are:

- processhub-sdk - you should use the same version as the version of Prozesse
- react - actual React (at the time of writing) is 17.0.1
- semantic-ui-react - we prefer you leave the version as is. Internally we use Semantic for displaying all of our services.

Add dependencies as you need as long as these three packages are included.
Please ensure that all used dependencies are available freely from npm in order to pull these dependencies during builds.
