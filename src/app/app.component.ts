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

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private app: AppService,
    private router: Router,
    private _serialPort: SerialPortService
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

    this.loadPorts();
  }

  onRefreshClick() {
    this.loadPorts();
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
}
