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
                return reject({ code: err.code, err });
            }

            const supportedFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return (
                    ext === '.xml' ||
                    ext === '.txt' ||
                    ext === '.asc' ||
                    ext === '.csv' ||
                    ext === '.pdf'
                );
            });

            console.log(' Supported files:', supportedFiles);

            const fileInfos = [];

            for (const file of supportedFiles) {
                const filePath = path.join(dirPath, file);
                const fileInfo = await getFileInfo(filePath) as any;

                fileInfos.push({
                    name: file,        
                    path: filePath,
                    info: fileInfo
                });
            }

            resolve(fileInfos);
        });
    });
};





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