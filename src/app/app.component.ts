import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { AppService } from './core/services/app.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SerialPortService } from './core/services/serial-port.service';
import { PortInfo } from './models/port-info.model';
import { FormControl } from '@angular/forms';
import { FileListService } from './core/services/file-list.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  showBackBtn$: Observable<boolean>;
  serialPorts$: Observable<PortInfo[]>;
  serialPortCtrl = new FormControl(null);
  modeCtrl = new FormControl('serial');  
ipAddressCtrl = new FormControl('');
selectedPortInfo$: Observable<PortInfo>;
selectedIP$: Observable<string>;





  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private app: AppService,
    private router: Router,
    private _serialPort: SerialPortService,
    private fileService: FileListService
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }
  ngOnInit(): void {
    this.showBackBtn$ = this.app.isBackBtnShowObs();
    this.serialPorts$ = this.app.getSerialPortsObs();

    this.selectedPortInfo$ = this.app.geSelectedtSerialPortObs();
  this.selectedIP$ = this.app.getSelectedIPObs();


    this.loadPorts();


      this.app.setMode(this.modeCtrl.value);

  this.modeCtrl.valueChanges.subscribe(mode => {
    this.app.setMode(mode);
  });

    setInterval(() => {
      const files = this.fileService.getFiles()
      files.forEach(file => {
        const durationMs = (new Date() as any) - file.info.birthtime
        const durationMin = Math.round(durationMs / (1000 * 60))
        if (durationMin >= 5 && file.new) {
          file.new = false
        }
      })
      this.fileService.files$.next(files)
    }, 1000 * 60)

    this.cleanUpDirectory();

    setInterval(() => {
      this.cleanUpDirectory()
    }, 1000 * 60)

  }

  onRefreshClick() {
    this.loadPorts();
  }

  cleanUpDirectory() { 
    // cleanup directory
    const directoryPath = this.fileService.getSearchDirectory()

    if (directoryPath) {
      this.fileService.cleanDirectory(directoryPath)
    }
  }

  loadPorts() {
    this._serialPort.getSerialPorts().subscribe(ports => {
      if (ports?.length) {
        this.serialPortCtrl.setValue(ports[0])
      }
    })
  }

  backTo() {
    this.router.navigate(this.app.backRoute)
  }

  onSerialPortChange(event) {
    this.app.setSelectedSerialPort(this.serialPortCtrl.value);
  }

  settings(){
    this.router.navigate(['/settings']);
  }

  onConnectIP() {
  const ip = this.ipAddressCtrl.value;

  if (!ip) {
    console.warn('IP is empty');
    return;
  }

  console.log("Selected IP:", ip);
  this.app.setSelectedIPAddress(ip);
}

}
