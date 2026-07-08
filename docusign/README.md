Copy the file configtemplate.json to config.json and adjust the values (accountId, userId, integrationKey, privateKey, baseUrl, and oauthBasePath for DocuSign JWT auth).

Optional: you can set "callbackUrlBase" in config.json to override the base used for webhook callback URLs when the service is configured to trigger a webhook.
Use this if your roXtra instance is published behind a reverse proxy and needs a different external base path.

Notes:

- If omitted or empty, the server's default base URL is used.

Example config with callbackUrlBase:
 ```json
 {
   "accountId": "",
   "userId": "",
   "integrationKey": "",
   "privateKey": "",
   "baseUrl": "https://demo.eu.docusign.net/restapi/v2.1",
   "oauthBasePath": "account-d.docusign.com",
   "callbackUrlBase": "https://example.com/roxtra"
 }
 ```