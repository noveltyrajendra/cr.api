let googledrive = (function() {
    let fs = require('fs');
    const { google } = require('googleapis');
    let readline = require('readline');

    const SCOPES = ['https://www.googleapis.com/auth/drive'];

    const TOKEN_PATH = 'gdrive-token.json';

    function updateGDriveDataToCsv(){
        fs.readFile('gdrive-credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Drive API.
            //authorize(JSON.parse(content), listFiles);
            //authorize(JSON.parse(content), getFile);
            authorize(JSON.parse(content), uploadFile);
            //authorize(JSON.parse(content), getFileInfo);
        });
    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);//list files and upload file
            //callback(oAuth2Client, '0B79LZPgLDaqESF9HV2V3YzYySkE');//get file

        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }

    /**
     * Lists the names and IDs of up to 10 files.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function getFileInfo(auth){
        const drive = google.drive({ version: 'v3', auth });
        var pageToken = null;
        drive.files.list({
            //corpora: 'user',
            //pageSize: 10,
            //q: "mimeType='text/csv'",
            q: "name='post-university-veterans.csv'",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
            //pageToken: pageToken
            pageToken: pageToken ? pageToken : '',
            //fields: 'nextPageToken, files(*)',
            //fields: '*'
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if(files.length) {
                files.forEach(function (file) {
                    console.log('Found file: ', file.name, file.id);
                });
            }else{
                console.log('No files found.');
            }
        });
    }

    function uploadFile(auth) {
        const drive = google.drive({ version: 'v3', auth });
        drive.files.update({
                uploadType: 'media',
                fileId: '1AvGbggkOOuJ9w33HtUqOz70RuCR-ozye', // id of existing file
                media: {
                    mimeType: 'text/csv',
                    body: fs.createReadStream('csv/post-university-veterans.csv')
                }
            }, function (err, data) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("CSV file updated.");
                }
        })
        /*fs.stat('csv/veteran.csv', function (err, stat) {
            if (err == null) {
                console.log('File exists');
            }else {
                console.log('File doesnot exist');
            }
        });
        console.log("I ma in Upload here");*/
    }

    return {
        updateGDriveDataToCsv: updateGDriveDataToCsv
      }

})();
  
module.exports = googledrive;