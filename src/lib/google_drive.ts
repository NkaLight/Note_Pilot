// nom install googleapis@latest
import { google } from 'googleapis';
import { readFileSync} from 'fs';

// get access to google drive
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const SERVICE_ACCOUNT = 'service_account.json';

export async function authenticateService() {
    // extract credentials from JSON
    const credentials = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf8'));

    // don't need oAthu2 because it's a service account

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });

    // e.g const drive = await authenticateService();
    // return an authenticated google drive object
    return google.drive({ version: "v3", auth });
}

export async function createUserFolder(userId: string) {
    return userId
}