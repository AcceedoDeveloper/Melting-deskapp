import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { AppService } from '../../core/services/app.service';
import { SerialPortService } from '../../core/services/serial-port.service';
import { PortInfo } from '../../models/port-info.model';
import { FileListService } from '../../core/services/file-list.service';
import { catchError, combineLatest, finalize, map, Observable, pairwise, shareReplay, startWith, tap, throwError, BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-mode-selector',
  templateUrl: './mode-selector.component.html',
  styleUrls: ['./mode-selector.component.scss']
})
export class ModeSelectorComponent implements OnInit {

    directoryCtrl = new FormControl('', Validators.required);


   loginUserCtrl = new FormControl('');
  loginPassCtrl = new FormControl('');
  isLoggedIn = false;
  loginError = '';
    errMsg = '';

    filesLoading = false;
    showSearchDirectory = false;
      autoDetectFiles = false;

      autoDetectValue: number | null = null;
  isAutoDetectSaved = false;
  autosent = false;
theme: 'dark' | 'light' = 'dark';




  modeCtrl = new FormControl('serial');
  serialPortCtrl = new FormControl(null);
  ipAddressCtrl = new FormControl('');

  serialPorts$: Observable<PortInfo[]>;

  constructor(
    private app: AppService,
    private serialService: SerialPortService,
    private fileService: FileListService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

     setTimeout(() => {
      this.app.setShowBackBtn(true);
      this.app.backRoute = ['/home'];
    });
    // Update mode
    this.app.setMode(this.modeCtrl.value);
    this.modeCtrl.valueChanges.subscribe(m => this.app.setMode(m));

    // Load serial ports
    this.serialPorts$ = this.app.getSerialPortsObs();

    this.loadPorts();

    this.app.getSelectedIPObs().subscribe(ip => {
  if (ip) {
    this.ipAddressCtrl.setValue(ip);
  }
});


this.app.getAutoDetectFilesObs().subscribe(value => {
    if (value !== null) {
      this.autoDetectValue = value;
      this.isAutoDetectSaved = true;
      this.cdr.markForCheck();
    }
  });

  }

  loadPorts() {
    this.serialService.getSerialPorts().subscribe(ports => {
      if (ports?.length) {
        this.serialPortCtrl.setValue(ports[0]);
        this.app.setSelectedSerialPort(ports[0]);
      }
    });
  }

  onRefreshClick() {
    this.loadPorts();
  }

  onSerialPortChange(event: any) {
    this.app.setSelectedSerialPort(this.serialPortCtrl.value);
  }

  onConnectIP() {
    this.app.setSelectedIPAddress(this.ipAddressCtrl.value);
  }

   // LOGIN FUNCTION
  login() {
    const username = this.loginUserCtrl.value;
    const password = this.loginPassCtrl.value;

    if (username === 'admin' && password === 'admin') {
      this.isLoggedIn = true;
      this.loginError = '';
    } else {
      this.loginError = 'Invalid username or password';
    }
  }


    clearInput(inputElem: HTMLInputElement, ctrl?: AbstractControl) {
      if (ctrl) {
        ctrl.setValue('')
      }
      inputElem.focus()
      inputElem.value = '';
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

    onHideDirectoryClick() {
    this.showSearchDirectory = false;
  }

    onShowSearchDirectory() {
    this.showSearchDirectory = true;
    this.directoryCtrl.setValue(this.fileService.getSearchDirectory());
  }




onAutoDetectFilesChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);

  if (!isNaN(value)) {
    this.app.setAutoDetectFiles(value);   // ✅ SAVE IN SERVICE
    this.isAutoDetectSaved = true;        // ✅ UI STATE
  }
}


  saveAutoDetectValue(value: number) {
    // Example: save to service or localStorage
    localStorage.setItem('autoDetectFiles', value.toString());

    // Mark UI as saved
    this.isAutoDetectSaved = true;
  }

  autosentfile($event: Event) {

  }

  toggleTheme(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  this.theme = checked ? 'dark' : 'light';

  // localStorage.setItem('theme', this.theme);
  // this.applyTheme(this.theme);
}


}