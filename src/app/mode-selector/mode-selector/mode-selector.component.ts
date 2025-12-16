import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { AppService } from '../../core/services/app.service';
import { SerialPortService } from '../../core/services/serial-port.service';
import { PortInfo } from '../../models/port-info.model';
import { FileListService } from '../../core/services/file-list.service';
import { catchError, combineLatest, finalize, map, Observable, pairwise, shareReplay, startWith, tap, throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

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
selectedFormat: 'XML' | 'TXT' | 'BAK' | null = null;
isIpConnected = false;





modeCtrl = new FormControl('ip');
  serialPortCtrl = new FormControl(null);
  ipAddressCtrl = new FormControl('');

  serialPorts$: Observable<PortInfo[]>;

  constructor(
    private app: AppService,
    private serialService: SerialPortService,
    private fileService: FileListService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {


this.app.getModeObs().subscribe(mode => {
  this.modeCtrl.setValue(mode, { emitEvent: false });
  this.cdr.markForCheck();
});



this.app.getSelectedIPObs().subscribe(ip => {

  if (ip) {
    this.ipAddressCtrl.setValue(ip);
    this.isIpConnected = true;

    this.modeCtrl.setValue('ip', { emitEvent: false });
  } else {
    this.isIpConnected = false;
  }

  this.cdr.markForCheck();
});




     const saved = localStorage.getItem('autoSend');
  if (saved !== null) {
    this.autosent = saved === 'true';
    this.app.setAutoSend(this.autosent);
  }



    this.app.getSelectedFileFormatObs().subscribe(format => {
    if (format) {
      this.selectedFormat = format;
      this.cdr.markForCheck(); // IMPORTANT (OnPush safety)
    }
  });

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
    this.app.setAutoDetectFiles(value);   
    this.isAutoDetectSaved = true;        
  }
}


  saveAutoDetectValue(value: number) {
    localStorage.setItem('autoDetectFiles', value.toString());

    this.isAutoDetectSaved = true;
  }

autosentfile(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;

  this.autosent = checked;

  // 🔥 tell app: auto-send ON / OFF
  this.app.setAutoSend(checked);

  // optional persistence
  localStorage.setItem('autoSend', String(checked));
}


  toggleTheme(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  this.theme = checked ? 'dark' : 'light';

  // localStorage.setItem('theme', this.theme);
  // this.applyTheme(this.theme);
}

onFormatChange(format: 'XML' | 'TXT' | 'BAK') {
  this.selectedFormat = format;

  // ✅ SEND TO SERVICE
  this.app.setSelectedFileFormat(format);

  // optional persistence
  localStorage.setItem('selectedFormat', format);
}

// onConnectIP() {

//   if (this.isIpConnected) {
//     this.app.setSelectedIPAddress(null);
//     this.ipAddressCtrl.reset();
//     this.isIpConnected = false;
//     return;
//   }

//   const ip = this.ipAddressCtrl.value;
//   if (!ip) return;

//   this.app.setSelectedIPAddress(ip);
//   this.isIpConnected = true;
// }


onConnectIP() {

  // 🔌 DISCONNECT
  if (this.isIpConnected) {
    this.app.setSelectedIPAddress(null);
    this.ipAddressCtrl.reset();
    this.isIpConnected = false;
    return;
  }

  let rawIp = this.ipAddressCtrl.value?.trim();
  if (!rawIp) return;

  // ✅ ADD http:// if missing
  if (!rawIp.startsWith('http://') && !rawIp.startsWith('https://')) {
    rawIp = 'http://' + rawIp;
  }

  // ✅ ADD trailing slash if missing
  if (!rawIp.endsWith('/')) {
    rawIp = rawIp + '/';
  }

  // 🔥 FINAL NORMALIZED IP
  console.log('Final IP:', rawIp);

  this.app.setSelectedIPAddress(rawIp);
  this.isIpConnected = true;
}


onFormatSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value as
    | 'XML'
    | 'TXT'
    | 'BAK';

  this.selectedFormat = value;

  // 🔥 send to AppService
  this.app.setSelectedFileFormat(value);

  // optional persistence
  localStorage.setItem('selectedFormat', value);
}


backTo(){
  this.router.navigate(['/home']);
}


get displayIp(): string {
  const ip = this.ipAddressCtrl.value;
  if (!ip) return '';

  return ip
    .replace(/^https?:\/\//, '')  // remove http:// or https://
    .replace(/\/$/, '');          // remove trailing /
}


onIpInput(event: Event) {
  this.ipAddressCtrl.setValue(
    (event.target as HTMLInputElement).value
  );
}


}