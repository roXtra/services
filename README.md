# services

## Requirements 
- Node.js

## Getting Started
- Clone the repository
- Open it in VSCode or in your prefered IDE
- Install all dependencies via 
  ```javascript
  npm install
  ````
- Execute the command 
  ```javascript
  npm run buildbundle
  ````

If the command ran without erros, a services.zip should have been created in the root directory containing all zipped services. Now you are ready to install or develop your own services.

## Install Services
To install services you need to build them by your own like in the getting started guide or download the already builded versions of services from the releases section.  

Once you have a builded service you have to place it in the Roxtra/eformulare/node_modules/@eformservice directory.  

![Image 1](https://github.com/roXtra/services/blob/master/resources/images/service_folder.PNG "Image 1")

To run your new service you have to restart your roXtra instance.

## Write your own Service
Services are written in TypeScript.
That a service can be built without errors, several files are needed.
- package.json, to specify the dependencies
- tsconfig.json, to specify compile options
- .eslintrc.json, to specify lint options

The following files should contain code for the service you want to develop:
- service.json, defines the basic strucure of the service
- myservicename-config.tsx, contains React code that defines the appearance of the service
- myservicename-service.ts, defines the behavior of the service

To get a basic understanding for developing services, feel free to look into our example services in the repository. 
