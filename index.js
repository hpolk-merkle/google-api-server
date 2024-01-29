const express = require('express'); //Import the express dependency
const app = express();              //Instantiate an express app, the main work horse of this server
const port = 8000;                  //Save the port number where your server will be listening

//API variable setup
const { google } = require('googleapis');
const credentials = require('./credentials.json');
const scopes = [
    'https://www.googleapis.com/auth/drive',
];
const auth = new google.auth.JWT(
    credentials.client_email, null,
    credentials.private_key, scopes
);
const drive = google.drive({ version: "v3", auth });

app.get('/', (req, res) => {
    console.log("base");            
});

//gets list of files
app.get('/fileList', (req, res) => {
    getFileListAPI(req, res);
});

//gets specifc file
app.get('/file', (req, res) => {
    getFileAPI(req, res);
});

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});

async function getFileListAPI(serverReq, serverRes){
    let filesResult = [];

    let query = formatQuery(serverReq);

    try {
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name, parents, mimeType, kind)',
        });
        filesResult = res.data.files;

        sendResponse(serverRes, JSON.stringify(filesResult));
    } catch (err) {
      sendResponse(serverRes, "failed to find pages");
    }
}

async function getFileAPI(serverReq, serverRes){
    try {
        let id = serverReq.query.fileId;
        let response;
        if(id){
            const res = await drive.files.get({
                fileId: serverReq.query.fileId,
                fields: 'id, name, parents, mimeType, kind',
            });
            response = JSON.stringify(res.data);
        }
        else{
            response = "Please provdide ID";
        }

        sendResponse(serverRes, response);
    } catch (err) {
      sendResponse(serverRes, "failed to find file");
    }
}

async function sendResponse(serverRes, response){
    serverRes.header('Content-Type', 'application/json');
    serverRes.header("Access-Control-Allow-Origin", "*");
    serverRes.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
    serverRes.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    serverRes.end(response);
}

function formatQuery(req){

    let query = 'trashed != true';
    let parameters = req.query;

    for(let key in parameters){
        if(key === 'name'){
            query += ' and name = \'' + parameters[key] + '\'';
        }
        if(key === 'parentId'){
            query += ' and \'' + parameters[key] + '\'' + ' in parents and name != \'index\'';
        }
    }

    return query;

}

/*Leaving this to refer back to if needed.*/

// async function findFolderID(drive) {

//     let fullPath = '/sub/sub';

//     let pathArray = fullPath.split('/');
//     console.log("split path:")
//     console.log(pathArray);

//     let part;
//     let parentId;

//     // const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

//     for (part of pathArray) {
//         console.log("getting into loop");
//         console.log(part);
//         const folders = await findFolder(drive, part, parentId);
//         console.log("folders:");
//         console.log(folders);
//           if (!folders[0]) {
//             console.log("returning undefined")
//             // Folder at path is not found
//             // $.export("$summary", `Couldn't find a folderId for the path, "${this.path}"`);
//             return undefined;
//           }
//           // Set parentId of next folder in path to find
//           parentId = folders[0] && folders[0].id;
//     }

//     return parentId;
// }

// async function findFolder(drive, name, parentId){
//     let q = 'mimeType = \'application/vnd.google-apps.folder\' and trashed != true';

//     if (name) {
//         q += ` and name = '${name}'`;
//       }
//     if (parentId) {
//         q += ` and '${parentId}' in parents`;
//     }

//     console.log('q');
//     console.log(q);

//     return (await drive.files.list({q})).data.files;
// }