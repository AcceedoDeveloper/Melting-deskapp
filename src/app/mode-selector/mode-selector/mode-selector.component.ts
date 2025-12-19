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
  lastEnteredIp = '';
  selectedMachineType = '';

  showSaveIcon = false;
pendingAutoDetectValue: number | null = null;
showConfirmPopup = false;
// Spectrom save flow
showSpectromSave = false;
showSpectromConfirm = false;

pendingMachineType: string | null = null;
pendingFileType: 'XML' | 'TXT' | 'BAK' | null = null;





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


    const currentTheme = this.app.getTheme();
  this.theme = currentTheme;


    const savedMachine = localStorage.getItem('selectedMachineType');
if (savedMachine) {
  this.selectedMachineType = savedMachine;
}




    const savedLastIp = localStorage.getItem('lastEnteredIp');
if (savedLastIp) {
  this.lastEnteredIp = savedLastIp;
  this.ipAddressCtrl.setValue(savedLastIp);
}



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

  if (!isNaN(value) && value > 0) {
    this.pendingAutoDetectValue = value;

    this.showSaveIcon = true;
  }
}


onSaveAutoDetectClick() {
  if (this.pendingAutoDetectValue == null) return;
  this.showConfirmPopup = true;
}


confirmSaveAutoDetect() {
  if (this.pendingAutoDetectValue == null) return;

  // ✅ SAVE HERE
  this.autoDetectValue = this.pendingAutoDetectValue;

  this.app.setAutoDetectFiles(this.pendingAutoDetectValue);
  localStorage.setItem(
    'autoDetectFiles',
    this.pendingAutoDetectValue.toString()
  );

  // reset UI state
  this.showSaveIcon = false;
  this.showConfirmPopup = false;
  this.pendingAutoDetectValue = null;
  this.isAutoDetectSaved = true;
}

cancelSaveAutoDetect() {
  this.showConfirmPopup = false;
  this.pendingAutoDetectValue = null;
}




  saveAutoDetectValue(value: number) {
    localStorage.setItem('autoDetectFiles', value.toString());

    this.isAutoDetectSaved = true;
  }

autosentfile(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;

  this.autosent = checked;

  this.app.setAutoSend(checked);

  localStorage.setItem('autoSend', String(checked));
}


toggleTheme(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  const theme = checked ? 'dark' : 'light';

  this.app.setTheme(theme);
}


onFormatChange(format: 'XML' | 'TXT' | 'BAK') {
  this.selectedFormat = format;

  this.app.setSelectedFileFormat(format);

  localStorage.setItem('selectedFormat', format);
}




onConnectIP() {

  if (this.isIpConnected) {
  this.lastEnteredIp = this.ipAddressCtrl.value || this.lastEnteredIp;
  localStorage.setItem('lastEnteredIp', this.lastEnteredIp);

  this.app.setSelectedIPAddress(null);
  this.isIpConnected = false;

  this.ipAddressCtrl.setValue(this.lastEnteredIp);

  return;
}


  let rawIp = this.ipAddressCtrl.value?.trim();
  if (!rawIp) return;

  if (!rawIp.startsWith('http://') && !rawIp.startsWith('https://')) {
    rawIp = 'http://' + rawIp;
  }

  if (!rawIp.endsWith('/')) {
    rawIp = rawIp + '/';
  }

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

  this.app.setSelectedFileFormat(value);

  localStorage.setItem('selectedFormat', value);
}


backTo(){
  this.router.navigate(['/home']);
}


// get displayIp(): string {
//   const ip = this.ipAddressCtrl.value;
//   if (!ip) return '';

//   return ip
//     .replace(/^https?:\/\//, '')  
//     .replace(/\/$/, '');          
// }


// get displayIp(): string {
//   if (this.isIpConnected && this.ipAddressCtrl.value) {
//     return this.ipAddressCtrl.value
//       .replace(/^https?:\/\//, '')
//       .replace(/\/$/, '');
//   }

//   return this.lastEnteredIp
//     .replace(/^https?:\/\//, '')
//     .replace(/\/$/, '');
// }


get displayIp(): string {
  const raw =
    this.isIpConnected
      ? this.ipAddressCtrl.value
      : this.lastEnteredIp;

  if (!raw) return '';

  return raw
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}




onIpInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;

  this.ipAddressCtrl.setValue(value);
  this.lastEnteredIp = value;   

  localStorage.setItem('lastEnteredIp', value);
}


onMachineTypeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  this.selectedMachineType = value;
  localStorage.setItem('selectedMachineType', value);

}

onSpectromChange(
  type: 'machine' | 'format',
  event: Event
) {
  const value = (event.target as HTMLSelectElement).value;

  if (type === 'machine') {
    this.pendingMachineType = value;
  }

  if (type === 'format') {
    this.pendingFileType = value as any;
  }

  this.showSpectromSave = true;
}


onSaveSpectromClick() {
  this.showSpectromConfirm = true;
}



confirmSpectromSave() {

  if (this.pendingMachineType !== null) {
    this.selectedMachineType = this.pendingMachineType;
    localStorage.setItem(
      'selectedMachineType',
      this.pendingMachineType
    );
  }

  if (this.pendingFileType !== null) {
    this.selectedFormat = this.pendingFileType;
    this.app.setSelectedFileFormat(this.pendingFileType);
    localStorage.setItem(
      'selectedFormat',
      this.pendingFileType
    );
  }

  // reset state
  this.pendingMachineType = null;
  this.pendingFileType = null;
  this.showSpectromSave = false;
  this.showSpectromConfirm = false;
}

cancelSpectromSave() {
  this.showSpectromConfirm = false;
  this.pendingMachineType = null;
  this.pendingFileType = null;
}



}