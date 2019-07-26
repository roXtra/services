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
  npm run build
  ````

If the command ran without erros, a folder should have been created named zipped_services containing all zipped servcies. Now you are ready to install or develop your own services.

## Install Services
To install services you need to build them by your own like in the getting started guide or download the already builded versions of services from the Wiki section.  
Once you have a builded service you have to place it in the Roxtra/eformulare/node_modules/@eformservice directory.  
To run your new service you have to restart your roXtra instance.

## Write your own Service
Services are written in TypeScript.
That a service can be built without errors, several files are needed.
- package.json, to specify the dependencies
- tsconfig.json, to specify compile options
- tslint.json, to specify lint options

The following files should contain code for the service you want to develop:
- service.json, defines the basic strucure of the service
- myservicename-config.tsx, contains React code that defines the appearance of the service
- myservicename-service.ts, defines the behavior of the service

To get a basic understanding for developing services, feel free to look into our example services in the repository. 
