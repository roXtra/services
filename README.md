# services

## Getting Started
- If you haven't installed Node.js yet, install it
- Clone the repository
- Open it in VSCode
- Install all dependencies via `npm install`
- Execute the command `npm run build`

If the command ran without erros, a folder should have been created named zipped_services containing all zipped servcies. Now you are ready to develop your own services.

## Develop Services
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
