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
    newFiles$ = new BehaviorSubject<AcFile[]>([]);
 private openedFiles$ = new BehaviorSubject<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('openedFiles') || '[]'))
  );

  private autoSentFiles = new Set<string>();
  private manualOpenInProgress = false;




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

getFileList(directoryPath: string) {
  return new Observable<AcFile[]>(observer => {
    ipcRenderer.invoke('file-list', directoryPath).then(files => {
      observer.next(files);
      observer.complete();
    });
  }).pipe(
    tap((files: AcFile[]) => {

      const opened = this.openedFiles$.value;
      const newFiles: AcFile[] = [];

      files.forEach(file => {
        const isNew = !opened.has(file.name);
        file.new = isNew;

        if (isNew && !this.autoSentFiles.has(file.name)) {
          newFiles.push(file);
          this.autoSentFiles.add(file.name);
        }
      });

      if (newFiles.length) {
        this.newFiles$.next(newFiles);
      }

      this.files$.next(files);
    })
  );
}





   cleanDirectory(directoryPath: string, maxFiles: number) {
  return ipcRenderer.invoke('directory-cleanup', {
    directoryPath,
    maxFiles
  });
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

    getNewFilesObs() {
  return this.newFiles$.asObservable();
}

clearNewFiles() {
  this.newFiles$.next([]);
}

 markFileOpened(fileName: string) {
    const opened = new Set(this.openedFiles$.value);
    opened.add(fileName);

    this.openedFiles$.next(opened);
localStorage.setItem(
  'openedFiles',
  JSON.stringify(Array.from(opened))
);

    const files = this.files$.value.map(f =>
      f.name === fileName ? { ...f, new: false } : f
    );

    this.files$.next(files);
  }

getOpenedFiles(): Set<string> {
  return this.openedFiles$.value;
}

setManualOpen(value: boolean) {
  this.manualOpenInProgress = value;
}

isManualOpen() {
  return this.manualOpenInProgress;
}




}