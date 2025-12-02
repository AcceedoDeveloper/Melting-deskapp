import { Injectable } from "@angular/core";
import { ipcRenderer } from 'electron';
import { BehaviorSubject, Observable, take, tap } from "rxjs";
import { AcFile } from "../../models/file-model";
import { getOnce } from "../utils/get-once";


@Injectable({
    providedIn: 'root'
})
export class FileListService {

    files$ = new BehaviorSubject<AcFile[]>([]);
    oldFiles$ = new BehaviorSubject<AcFile[]>(null);
    filesLoaded$ = new BehaviorSubject<boolean>(false);
    selectedFile$ = new BehaviorSubject<AcFile>(null);
    seacrhDirectory$ = new BehaviorSubject<string>('');

    getFiles() {
        let files = []
        this.files$.pipe(take(1)).subscribe((resFiles) => {
            files = resFiles
        })
        return files
    }

    get oldFiles() {
        let files = []
        this.oldFiles$.pipe(take(1)).subscribe(() => {
            files = files
        })
        return files
    }

    getFileList(directoryPath) {
        return new Observable<AcFile[]>((observer) => {
            ipcRenderer.invoke('file-list', directoryPath).then((files) => {
                if (files.err) {
                    observer.error(files.code)
                } else {
                    observer.next(files)
                    observer.complete()
                }
            })
        }).pipe(
            tap(files => {
                const oldFiles = this.getFiles();
                const newFiles = files;
                if (oldFiles.length) {
                    const oldFilesMap = (oldFiles as any[]).reduce((acc, file) => {
                        acc[file.name] = file
                        return acc
                    }, {})
                    // new file detected
                    const newlyAddedFiles = [];
                    newFiles.forEach(newFile => {
                        if (!oldFilesMap[newFile.name]) {
                            newlyAddedFiles.push(newFile)
                        }
                        if (oldFilesMap[newFile.name]?.new) {
                            newFile['new'] = true
                        }
                    })
                    console.log(newlyAddedFiles)
                    newlyAddedFiles.forEach(file => file.new = true)
                }
                this.files$.next(files)
            })
        )
    }

    cleanDirectory(directoryPath) {
        return ipcRenderer.invoke('directory-cleanup', directoryPath)
    }

    setWatcher(directoryPath) {
        return new Observable<AcFile[]>((observer) => {
            ipcRenderer.send('watch-dir', directoryPath);
            observer.next();
            observer.complete();
        })
    }

    getFilesObs() {
        return this.files$.asObservable()
    }

    setSelectedFile(file: AcFile) {
        this.selectedFile$.next(file)
    }

    getSelectedFileObs() {
        return this.selectedFile$.asObservable()
    }

    getSelectedFile() {
        return getOnce(this.selectedFile$.asObservable())
    }

    setFilesLoaded(isLoaded: boolean) {
        this.filesLoaded$.next(isLoaded)
    }

    getFilesLoadedObs() {
        return this.filesLoaded$.asObservable()
    }

    setSearchDirectory(directoryPath: string) {
        this.seacrhDirectory$.next(directoryPath)
    }

    getSearchDirectoryObs() {
        return this.seacrhDirectory$.asObservable()
    }

    getSearchDirectory() {
        const dir = localStorage.getItem('ac-directory')
        if (dir) {
            return dir
        }
        return getOnce(this.seacrhDirectory$.asObservable())
    }


}