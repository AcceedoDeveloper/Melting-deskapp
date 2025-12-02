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


export const getFiles = (dirPath, filterPredicate?) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, async (err, files) => {

            if (err) {
                // console.log(err)
                return reject({ code: err.code, err })
            }
            let xmlFiles = files.filter(file => mime.lookup(file) === 'application/xml');
            const xmlFilesInfo = []
            for (const file of xmlFiles) {
                const filePath = path.join(dirPath, file);
                const name = path.parse(filePath).name
                const fileInfo = await getFileInfo(filePath) as any;
                const durationMs = (new Date() as any) - fileInfo.birthtime
                const durationHr = Math.round(durationMs / (1000 * 60 * 60))
                // if (filterPredicate ? filterPredicate(durationHr) : (durationHr <= 24)) {
                //     xmlFilesInfo.push({
                //         name,
                //         path: filePath,
                //         info: fileInfo
                //     })
                // }
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

export const getFilePaths = dirPath => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, async (err, files) => {
            let xmlFiles = files.filter(file => mime.lookup(file) === 'application/xml');
            const filePaths = xmlFiles.map(file => path.join(dirPath, file))
            resolve(filePaths)
        })
    })
}

export const deleteFile = filePath => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, async (err) => {
            if (err) {
                reject('file cannot be deleted')
            } else {
                resolve('file deleted success.')
            }
        })
    })
}

export const checkFileExists = filePath => {
    return new Promise((resolve, reject) => {
        fs.access(filePath, (error) => {
            if (error) {
                reject('file cannot be found')
            } else {
                resolve('file found.')
            }
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