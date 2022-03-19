import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

export const getFileInfo = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, fileInfo) => {
            if (err) {
                reject(err)
            }
            resolve(fileInfo)
        })
    })
}


export const getFiles = (dirPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, async (err, files) => {

            if (err) {
                // console.log(err)
                return reject({code: err.code, err})
            }

            let xmlFiles = files.filter(file => mime.lookup(file) === 'application/xml');
            const xmlFilesInfo = []
            for (const file of xmlFiles) {
                const filePath = path.join(dirPath, file);
                const name = path.parse(filePath).name
                const fileInfo = await getFileInfo(filePath);
                xmlFilesInfo.push({
                    name,
                    path: filePath,
                    info: fileInfo
                })
            }
            resolve(xmlFilesInfo)
        })
    })

}

export const readFileAsXml = (filePath) => {
    return new Promise((resolve) => {
        fs.readFile(filePath, { encoding: 'utf16le' }, (err, data) => {
            resolve(data)
        })
    })
}