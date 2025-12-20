import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ipcRenderer } from 'electron';
import { Spectrum } from '../models/spectrum.model';
import { catchError, combineLatest, finalize, map, Observable, pairwise, shareReplay, startWith, tap, throwError, BehaviorSubject } from 'rxjs';
import { AppService } from '../core/services/app.service';
import { FileListService } from '../core/services/file-list.service';
import { AcFile } from '../models/file-model';
import {  from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {

  directoryCtrl = new FormControl('', Validators.required);
  filesLoaded$: Observable<boolean> = this.fileService.getFilesLoadedObs();
  files$: Observable<AcFile[]>;
  activeSort$: Observable<any> = this.app.activeSortObs().pipe(shareReplay(1));
  sortOptions$: Observable<any[]> = this.app.getSortsObs();
  fileSearch$: Observable<string> = this.app.fileSearchObs();
selectedDate$ = new BehaviorSubject<Date | null>(null);
status$ = new BehaviorSubject<string>('all'); 
sendStatus$ = this.app.fileStatus$;
statusMap: { [key: string]: string } = {};
selectedFileFormat$ = this.app.getSelectedFileFormatObs();
selectedFurnace$ = new BehaviorSubject<string>('all');
furnaceOptions$: Observable<string[]>;
private fileMetaChanged$ = new BehaviorSubject<void>(undefined);


 private openedFiles$ = new BehaviorSubject<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('openedFiles') || '[]'))
  );


fileMetaMap: {
  [filePath: string]: {
    heatNo?: string;
    stage?: string;
    partName?: string;
    grade? : string;
  }
} = {};




statusInfo = {
  'all':       { text: 'All Status',   class: 'status-all' },
  'sent-data':  { text: 'Sent Data',    class: 'status-success' },
  'no-wifi':    { text: 'No Wi-Fi',     class: 'status-warning' },
  'no-response':{ text: 'No Response',  class: 'status-error' }
};




  errMsg = '';

  showSearchDirectory = false;

  filteredFiles$: Observable<AcFile[]>;

  filesLoading = false;

  reloadFilesListener;

  newFileClearTimer;

  constructor(
    private router: Router,
    private fileService: FileListService,
    private app: AppService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit(): void {







// this.fileService.getNewFilesObs().subscribe(files => {


//   if (this.fileService.isManualOpen()) {
//     this.fileService.setManualOpen(false);
//     return;
//   }

//   if (!this.app.getAutoSend()) return;
//   if (!files || !files.length) return;

//   files.forEach(file => {

//     const format = this.app.getSelectedFileFormat();
//     if (!format) return;

// const ext = file.name.split('.').pop()?.toLowerCase();

// const formatMap = {
//   XML: ['xml'],
//   TXT: ['txt', 'asc'],
//   BAK: ['bak']
// };

// if (!formatMap[format]?.includes(ext)) return;


//     const ip = this.app.getSelectedIP();
//     const serial = this.app.getSelectedSerialPort();
//     if (!ip && !serial) return;

//     console.log('AUTO SEND FILE:', file.name);

//     this.fileService.setSelectedFile(file);

//     this.router.navigate(['/detail'], {
//       queryParams: { auto: true }
//     });
//   });

//   this.fileService.clearNewFiles();

// });



this.fileService.getNewFilesObs().subscribe(files => {

  if (this.fileService.isManualOpen()) {
    this.fileService.setManualOpen(false);
    return;
  }

  // ⛔ ONLY block auto-navigation, NOT NEW tag
  if (!this.app.getAutoSend()) {
    return; // just skip auto send
  }

  if (!files || !files.length) return;

  files.forEach(file => {

    const format = this.app.getSelectedFileFormat();
    if (!format) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const formatMap = {
      XML: ['xml'],
      TXT: ['txt', 'asc'],
      BAK: ['bak']
    };

    if (!formatMap[format]?.includes(ext)) return;

    const ip = this.app.getSelectedIP();
    const serial = this.app.getSelectedSerialPort();
    if (!ip && !serial) return;

    // 🔴 ONLY HERE auto navigation
    this.fileService.setSelectedFile(file);
    this.router.navigate(['/detail'], {
      queryParams: { auto: true }
    });
  });

  this.fileService.clearNewFiles();
});



    this.getFileStatus();

    setTimeout(() => {
      this.app.setShowBackBtn(false);
    });
    this.reloadFilesListener = () => {
      console.log('realod ')
      this.zone.run(() => {
        this.loadFiles().subscribe(() => {
          this.cdr.detectChanges();
        })
      })
      
    }
    this.files$ = this.fileService.getFilesObs()
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
  this.activeSort$,
  this.selectedDate$,
  this.status$,
  this.selectedFileFormat$,
  this.selectedFurnace$
]).pipe(
  map(([files, searchTerm, sort, selectedDate, activeStatus, selectedFormat,  selectedFurnace]) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const sortValue = sort.value;

    let sortedFiles = [...files];

    if (sortValue === 'nameAsc') {
      sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortValue === 'nameDesc') {
      sortedFiles.sort((a, b) => b.name.localeCompare(a.name));
    }
    if (sortValue === 'dateOld') {
      sortedFiles.sort((a: any, b: any) => a.info.birthtime - b.info.birthtime);
    }
    if (sortValue === 'dateNew') {
      sortedFiles.sort((a: any, b: any) => b.info.birthtime - a.info.birthtime);
    }

    let filtered = sortedFiles.filter(file =>
      file.name.toLowerCase().includes(normalizedSearch)
    );

    if (selectedDate) {
      filtered = filtered.filter(file => {
        const fileDate = new Date(file.info.birthtime);
        return fileDate.toDateString() === selectedDate.toDateString();
      });
    }

if (activeStatus !== 'all') {
  filtered = filtered.filter(file => {
    const key = this.normalizeName(file.name);
    const status = this.statusMap[key];
    return status === activeStatus;
  });
}

if (selectedFurnace !== 'all') {
  filtered = filtered.filter(file => {
    const meta = this.fileMetaMap[file.path];
    const furnaceKey = this.getFurnaceKey(meta?.stage);
    return `Furnace ${furnaceKey}` === selectedFurnace;
  });
}



if (selectedFormat) {
      const extMap = {
        XML: '.xml',
        TXT: '.txt',
        BAK: '.bak'
      };
      filtered = filtered.filter(file =>
        file.name.toLowerCase().endsWith(extMap[selectedFormat])
      );
    }



    return filtered;
  })
);



    console.log(this.sendStatus$ );

this.sendStatus$.subscribe(statusMap => {
  this.statusMap = statusMap;
  this.cdr.markForCheck();
});




  this.files$.subscribe(files => {

    if (!files || !files.length) return;


  //   files.forEach(file => {


  //    ipcRenderer.invoke('get-ascii-data', file.path)
  // .then((data: any) => {

  //   const headers = data?.headers || [];
  //   console.log('HEADERS FOR', file.name, headers);

  //   const heatNo   = headers.find(h => h.name === 'Heat No')?.value;
  //   const stage    = headers.find(h => h.name === 'Stage')?.value;
  //   const partName = headers.find(h => h.name === 'Part Name')?.value;
  //   const grade    = headers.find(h => h.name === 'Grade')?.value;

  //   this.fileMetaMap[file.path] = {
  //     heatNo,
  //     stage,
  //     partName,
  //     grade
  //   };

  //   this.fileMetaChanged$.next();
  //   this.cdr.markForCheck(); 
  // })
  // .catch(err => {
  //   console.error(' Error reading', file.name, err);
  // });


  //   });


// files.forEach(file => {
//   const isXML = file.name.toLowerCase().endsWith('.xml');
//   const reader = isXML ? 'get-xml-summary' : 'get-ascii-data';

//   ipcRenderer.invoke(reader, file.path)
//     .then((data: any) => {
//       console.log('data', data);
//       const headers = data?.headers || [];

//       this.fileMetaMap[file.path] = {
//         heatNo: headers.find(h => h.name === 'Heat No')?.value,
//         stage: headers.find(h => h.name === 'Stage')?.value,
//         partName: headers.find(h => h.name === 'Part Name')?.value,
//         grade: headers.find(h => h.name === 'Grade')?.value
//       };

//       this.fileMetaChanged$.next();
//       this.cdr.markForCheck();
//     });
// });

from(files)
  .pipe(
    mergeMap(
      file => {
        const isXML = file.name.toLowerCase().endsWith('.xml');
        const reader = isXML ? 'get-xml-summary' : 'get-ascii-data';

        return from(ipcRenderer.invoke(reader, file.path))
          .pipe(
            map(data => ({ file, data }))
          );
      },
      2 // 🔥 process ONLY 2 files at a time
    )
  )
  .subscribe({
    next: ({ file, data }) => {
      const headers = data?.headers || [];

      this.fileMetaMap[file.path] = {
        heatNo: headers.find(h => h.name === 'Heat No')?.value,
        stage: headers.find(h => h.name === 'Stage')?.value,
        partName: headers.find(h => h.name === 'Part Name')?.value,
        grade: headers.find(h => h.name === 'Grade')?.value
      };

      this.fileMetaChanged$.next();
      this.cdr.markForCheck();
    },
    error: err => {
      console.error('Metadata read error:', err);
    }
  });


  });

this.furnaceOptions$ = combineLatest([
  this.files$,
  this.fileMetaChanged$
]).pipe(
  map(([files]) => {
    const set = new Set<string>();

    files.forEach(file => {
      const meta = this.fileMetaMap[file.path];
      const furnaceKey = this.getFurnaceKey(meta?.stage);
      if (furnaceKey) {
        set.add(`Furnace ${furnaceKey}`);
      }
    });

    return Array.from(set).sort();
  })
);


  }


  getFileMeta(file: AcFile) {
  return this.fileMetaMap[file.path];
}

formatFurnaceName(stage: string): string {
  if (!stage) return '';

  const match = stage.match(/^([A-Z])/i);

  if (!match) return stage;

  const furnaceLetter = match[1].toUpperCase();

  return `Furnace ${furnaceLetter}`;
}

getFurnaceKey(stage?: string): string {
  if (!stage) return '';
  const match = stage.match(/^([A-Z])/i);
  return match ? match[1].toUpperCase() : '';
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
    this.fileService.setManualOpen(true);
    this.fileService.markFileOpened(file.name);
    this.fileService.setSelectedFile(file);
this.router.navigate(['/detail']
);    this.cdr.detectChanges()
  }

  setActiveSort(sort) {
    this.app.setActiveSort(sort)
  }


  onFileSearchInput(tagert: EventTarget) {
    this.app.setfileSearch((tagert as HTMLInputElement).value)
  }

onNormalDateSelect(event: any) {
  const selected = event.target.value ? new Date(event.target.value) : null;
  this.selectedDate$.next(selected);
}

resetDate(dateInput: HTMLInputElement) {
  dateInput.value = ""; 
  this.selectedDate$.next(null);  
}

setStatus(status: string) {
  this.status$.next(status);
}







normalizeName(name: string) {
  return name.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
}


getStatus(file: any) {
  const key = this.normalizeName(file.name);
  return this.statusMap[key];
}



getFileStatus() {
  this.sendStatus$.subscribe(v => {
    console.log("UPDATE:", v);
    this.statusMap = v;       
    console.log("Mapped:", this.statusMap);
  });
}


setFurnace(furnace: string) {
  this.selectedFurnace$.next(furnace);
}

getStatusIcon(status: string): string {
  switch (status) {
    case 'sent-data':
      return 'assets/icons/status-sent.png';

    case 'no-response':
      return 'assets/icons/status-no-response.png';

    case 'no-wifi':
      return 'assets/icons/status-no-wifi.png';

    default:
      return '';
  }
}




}
