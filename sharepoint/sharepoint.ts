import { SPDefault } from "@pnp/nodejs";
import "@pnp/sp/webs/index.js";
import "@pnp/sp/files/web.js";
import { spfi } from "@pnp/sp/fi.js";
import { IFile } from "@pnp/sp/files/types.js";
import { Web } from "@pnp/sp/webs/types.js";
import "@pnp/sp/webs/index.js";
import "@pnp/sp/files/web.js";

declare module "@pnp/sp/fi.js" {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface SPFI {
    /**
     * Access to the current web instance
     */
    readonly web: ReturnType<typeof Web>;
  }
}

declare module "@pnp/sp/webs/types.js" {
  interface IWeb {
    /**
     * Gets a file by server relative url if your file name contains # and % characters
     *
     * @param fileRelativeUrl The server relative path to the file (including /sites/ if applicable)
     */
    getFileByServerRelativePath(fileRelativeUrl: string): IFile;
    /**
     * Gets a file by id
     *
     * @param uniqueId The UniqueId of the file
     */
    getFileById(uniqueId: string): IFile;
    /**
     * Gets a file from a sharing link or absolute url
     *
     * @param fileUrl Absolute url of the file to get
     */
    getFileByUrl(fileUrl: string): IFile;
  }
}

export interface ISharePointConfig {
  sharepointUrl: string;
  clientId: string;
  tenantId: string;
  certThumbprint: string;
  certBuffer: Buffer;
  fileUrl: string;
}

async function readFileFromUrl(config: ISharePointConfig) {
  const sp = spfi(config.sharepointUrl).using(
    SPDefault({
      msal: {
        config: {
          auth: {
            authority: `https://login.microsoftonline.com/${config.tenantId}/`,
            clientId: config.clientId,
            clientCertificate: {
              thumbprint: config.certThumbprint,
              privateKey: config.certBuffer.toString(),
            },
          },
        },
        scopes: [`${config.sharepointUrl}.default`],
      },
    }),
  );

  const file = sp.web.getFileByUrl(config.fileUrl);
  const fileContents = Buffer.from(await file.getBuffer());
  const fileInfo = await file();
  return { fileContents, fileName: fileInfo.Name };
}

export const sharePoint = { readFileFromUrl };
