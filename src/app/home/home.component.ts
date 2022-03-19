import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ipcRenderer } from 'electron';

import { catchError, combineLatest, finalize, map, Observable, shareReplay, startWith, tap, throwError } from 'rxjs';
import { AppService } from '../core/services/app.service';
import { FileListService } from '../core/services/file-list.service';
import { AcFile } from '../models/file-model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {

  directoryCtrl = new FormControl('', Validators.required);
  filesLoaded$: Observable<boolean> = this.fileService.getFilesLoadedObs();
  files$: Observable<AcFile[]> = this.fileService.getFilesObs();
  activeSort$: Observable<any> = this.app.activeSortObs().pipe(shareReplay(1));
  sortOptions$: Observable<any[]> = this.app.getSortsObs();
  fileSearch$: Observable<string> = this.app.fileSearchObs();

  errMsg = '';

  showSearchDirectory = false;

  filteredFiles$: Observable<AcFile[]>;

  filesLoading = false;

  reloadFilesListener;

  constructor(
    private router: Router,
    private fileService: FileListService,
    private app: AppService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.app.setShowBackBtn(false);
    });
    this.reloadFilesListener = () => {
      this.loadFiles().subscribe(() => {
        this.cdr.detectChanges();
      })
    }
    ipcRenderer.on('reload-files', this.reloadFilesListener)

    if (this.fileService.getSearchDirectory()) {
      this.directoryCtrl.setValue(this.fileService.getSearchDirectory());
      this.onShowFilesClick(true);
    } else {
      this.showSearchDirectory = true;
    }

    this.filteredFiles$ = combineLatest([
      this.files$,
      this.fileSearch$,
      this.activeSort$
    ]).pipe(
      map(([files, searchTerm, sort]) => {
        console.log(files)
        const normalizedSearch = searchTerm.toLowerCase();
        const sortValue = sort.value;
        let sortPerdicate;
        if (sortValue === 'nameAsc') {
          sortPerdicate = (fileA, fileB) => {
            const a = fileA.name.toLowerCase();
            const b = fileB.name.toLowerCase();
            if (a < b) {
              return -1;
            }
            if (a > b) {
              return 1;
            }
            return 0;
          }
        }
        if (sortValue === 'nameDesc') {
          sortPerdicate = (fileA, fileB) => {
            const a = fileA.name.toLowerCase();
            const b = fileB.name.toLowerCase();
            if (a > b) {
              return -1;
            }
            if (a < b) {
              return 1;
            }
            return 0;
          }
        }
        if (sortValue === 'dateOld') {
          sortPerdicate = (fileA, fileB) => (+fileA.info.mtime as any) - (+fileB.info.mtime as any)
        }
        if (sortValue === 'dateNew') {
          sortPerdicate = (fileA, fileB) => (+fileB.info.mtime as any) - (+fileA.info.mtime as any)
        }
        if (sortValue === 'noAsc') {
          sortPerdicate = (fileA, fileB) => (+fileB.info.mtime as any) - (+fileA.info.mtime as any)
        }
        if (sortValue === 'noDesc') {
          sortPerdicate = (fileA, fileB) => (+fileB.info.mtime as any) - (+fileA.info.mtime as any)
        }
        return files.filter(file => file.name.toLowerCase().includes(normalizedSearch)).sort(sortPerdicate)
      })
    )

  }

  ngOnDestroy(): void {
    if (this.reloadFilesListener) {
      ipcRenderer.off('reload-files', this.reloadFilesListener)
    }
  }

  onHideDirectoryClick() {
    this.showSearchDirectory = false;
  }

  onShowFilesClick(setWatcher?) {
    this.filesLoading = true
    this.loadFiles().pipe(
      catchError(errCode => {
        if (errCode === 'ENOENT') {
          this.errMsg = 'No Such Directory, Please verify the Directory name entered.'
          this.cdr.detectChanges();
        }
        return throwError(() => errCode)
      }),
      finalize(() => {
        this.filesLoading = false
      })
    ).subscribe(() => {
      // store the directory value in localstorage, and hide the directory search
      this.showSearchDirectory = false;
      this.fileService.setSearchDirectory(this.directoryCtrl.value);
      localStorage.setItem('ac-directory', this.directoryCtrl.value)
      this.errMsg = '';
      this.fileService.setFilesLoaded(true);
    });

    if (setWatcher) {
      this.fileService.setWatcher(this.directoryCtrl.value).subscribe()
    }
  }

  loadFiles() {
    return this.fileService.getFileList(this.directoryCtrl.value)
  }

  reloadFiles() {
    this.filesLoading = true;
    this.loadFiles().pipe(finalize(() => this.filesLoading = false)).subscribe(() => { })
  }


  onShowSearchDirectory() {
    this.showSearchDirectory = true;
    this.directoryCtrl.setValue(this.fileService.getSearchDirectory());
  }

  clearInput(inputElem: HTMLInputElement, ctrl?: AbstractControl) {
    if (ctrl) {
      ctrl.setValue('')
    }
    inputElem.focus()
    inputElem.value = '';
  }

  resetFileSearch() {
    this.app.setfileSearch('')
  }

  trackByFileName(index, file: AcFile) {
    return file.name
  }

  clearInputFile() {

  }

  onFileClick(file: AcFile) {
    this.fileService.setSelectedFile(file);
    this.router.navigate(['/detail'])
  }

  setActiveSort(sort) {
    this.app.setActiveSort(sort)
  }


  onFileSearchInput(tagert: EventTarget) {
    this.app.setfileSearch((tagert as HTMLInputElement).value)
  }

}
