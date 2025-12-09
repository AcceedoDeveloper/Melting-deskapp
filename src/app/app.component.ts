import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { AppService } from './core/services/app.service';
import { Observable, Subscription } from 'rxjs';
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
export class AppComponent implements OnInit, OnDestroy {

  showBackBtn$: Observable<boolean>;
  serialPorts$: Observable<PortInfo[]>;
  serialPortCtrl = new FormControl(null);
  modeCtrl = new FormControl('serial');  
ipAddressCtrl = new FormControl('');
selectedPortInfo$: Observable<PortInfo>;
selectedIP$: Observable<string>;
serialDataReceived$: Observable<string>;
private subscriptions: Subscription[] = [];





  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private app: AppService,
    private router: Router,
    private _serialPort: SerialPortService,
    private fileService: FileListService,
    private cdr: ChangeDetectorRef
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
  this.serialDataReceived$ = this.app.getSerialDataReceivedObs();


    this.loadPorts();


      this.app.setMode(this.modeCtrl.value);

  this.modeCtrl.valueChanges.subscribe(mode => {
    this.app.setMode(mode);
  });

    // Subscribe to selected port changes and start/stop listening
    const portSub = this.selectedPortInfo$.subscribe(port => {
      if (this.electronService.isElectron) {
        if (port && port.path) {
          this.startSerialListener(port.path);
        } else {
          this.stopSerialListener();
        }
      }
    });
    this.subscriptions.push(portSub);

    if (this.electronService.isElectron) {
      const ipc = this.electronService.ipcRenderer;
      
      ipc.on('serial-data-received', (event, data: string) => {
        this.app.setSerialDataReceived(data);
        this.cdr.detectChanges();
      });

      ipc.on('serial-data-error', (event, error: string) => {
        console.error('Serial data error:', error);
        this.app.setSerialDataReceived(`Error: ${error}`);
        this.cdr.detectChanges();
      });

      ipc.on('serial-port-closed', () => {
        console.log('Serial port closed');
        this.app.setSerialDataReceived('');
        this.cdr.detectChanges();
      });
    }

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

  startSerialListener(portPath: string) {
    if (this.electronService.isElectron) {
      const ipc = this.electronService.ipcRenderer;
      ipc.invoke('start-serial-listener', portPath).then(result => {
        if (result.success) {
          console.log(`Started listening on ${portPath}`);
        } else {
          console.error('Failed to start serial listener:', result.error);
        }
      }).catch(err => {
        console.error('Error starting serial listener:', err);
      });
    }
  }

  stopSerialListener() {
    if (this.electronService.isElectron) {
      const ipc = this.electronService.ipcRenderer;
      ipc.invoke('stop-serial-listener').then(result => {
        if (result.success) {
          console.log('Stopped serial listener');
          this.app.setSerialDataReceived('');
          this.cdr.detectChanges();
        }
      }).catch(err => {
        console.error('Error stopping serial listener:', err);
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Stop serial listener
    if (this.electronService.isElectron) {
      const ipc = this.electronService.ipcRenderer;
      ipc.invoke('stop-serial-listener').then(result => {
        console.log('Serial listener stopped');
      });
      
      // Remove IPC listeners
      ipc.removeAllListeners('serial-data-received');
      ipc.removeAllListeners('serial-data-error');
      ipc.removeAllListeners('serial-port-closed');
    }
  }

}
