Copy the file configtemplate.json to config.json and adjust the values (userName and apiKey from Skribble, and the API URL — depending on which database you use. For Germany
and the EU, use https://api.skribble.de/v2, and for Switzerland and the rest of the world, use https://api.skribble.com/v2).

Optional: you can set "callbackUrlBase" in config.json to override the base used for webhook callback URLs (callback_success_url) when the service is configured to trigger a webhook.
Use this if your roXtra instance is published behind a reverse proxy and needs a different external base path.

Notes:
- A trailing slash at the end of the base is fine; it will be trimmed.
- If omitted or empty, the server's default base URL is used.

Example config with callbackUrlBase:
{
  "userName": "",
  "apiKey": "",
  "baseUrl": "https://api.skribble.de/v2",
  "callbackUrlBase": "https://example.com/roxtra"
}
