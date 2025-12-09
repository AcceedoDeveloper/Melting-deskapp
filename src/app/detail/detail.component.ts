import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppService } from '../core/services/app.service';
import { FileListService } from '../core/services/file-list.service';
import { AcFile } from '../models/file-model';

import { ipcRenderer } from 'electron';
import { Spectrum, SpectrumElement } from '../models/spectrum.model';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { PortInfo } from '../models/port-info.model';
import { SerialPortService } from '../core/services/serial-port.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../shared/components/error-dialog/error-dialog.component';
import { IpService} from '../core/services/ip-service';
import { FormControl, Validators } from '@angular/forms';
import { NgZone } from '@angular/core';


const CHUNK_LENGTH = 10;

const headerMap = {
  'Heat No': "H",
  'Grade': 'G',
  "Tested By": "T",
  "Stage": "ST",
  "Product ID": "PRO"
}

const furanceMap = {
  'A': 1,
  'B': 2,
  'C': 3,
  'D': 4,
}

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailComponent implements OnInit {

  file: AcFile;
  spectrum: Spectrum;
  sendableData: string;
  selectedPort$: Observable<PortInfo>;
  furnaces = [
    { name: 'Furnace 1', no: 1 },
    { name: 'Furnace 2', no: 2 },
    { name: 'Furnace 3', no: 3 },
    { name: 'Furnace 4', no: 4 },
  ];

  furnaceCtrl = new FormControl('', [Validators.required]);
  furanceFound = false;

  constructor(
    private fileList: FileListService,
    private app: AppService,
    private cdr: ChangeDetectorRef,
    private _serialPortService: SerialPortService,
    private dialog: MatDialog,
    private ipService: IpService,
     private ngZone: NgZone 
  ) { }

  ngOnInit(): void {
    this.file = this.fileList.getSelectedFile();
    setTimeout(() => {
      this.app.setShowBackBtn(true);
      this.app.backRoute = ['/home'];
    });

    this.selectedPort$ = this.app.geSelectedtSerialPortObs();

    ipcRenderer.invoke('get-spectrum-data', this.file.path).then((spectrum: Spectrum) => {

      // junk of 8 data

      this.sendableData = this.getSendableData(spectrum);
      const furanceNo = this.getFurance(spectrum.headers)
      if (furanceNo) {
        this.furnaceCtrl.setValue(furanceNo);
        this.furanceFound = true;
      }
      console.log(this.sendableData)

      const elements = [];
      const chunkCount = Math.ceil(spectrum.elements.length / CHUNK_LENGTH)

      for (let i = 0; i < chunkCount; i++) {
        const startIndex = i * CHUNK_LENGTH;
        const endIndex = startIndex + CHUNK_LENGTH;
        const subElemt = spectrum.elements.slice(startIndex, endIndex)
        if (subElemt.length < CHUNK_LENGTH) {
          const itemRequiredToFill = CHUNK_LENGTH - subElemt.length;
          for (let j = 0; j < itemRequiredToFill; j++) {
            subElemt.push(null)
          }
        }
        elements.push(subElemt)
      }

      spectrum.elements = elements;

      this.spectrum = spectrum;
      this.cdr.detectChanges();
    })
  }

  getSendableData(spectrum: any) {
    // const headers = spectrum.headers.map(h => ({ n: h.name, v: h.value }));

    const headers = spectrum.headers.filter(h => h.name !== 'Alloy' && h.name !== 'Product ID').map((h) => {
      let value = h.value
      if (h.name === 'Grade') {
        value = h.value.split(' ')[0]
      }
      if (h.name === 'Stage') {
        value = value && value.replace(' ', '-')
      }
      return `${headerMap[h.name]}:${value}`
    }).join(',');

    const elements = spectrum.elements.map((e: SpectrumElement) => {
      return `${e.ElementName}:${e.reportedResult.resultValue}`
    }).join(',')

    return `${headers},${elements}`

    // const elements = spectrum.elements.map((e: SpectrumElement) => {
    //   const res = {};
    //   if (e.reportedResult.limits) {
    //     res['l'] = {
    //       u: e.reportedResult.limits.UpperAcceptanceLimit,
    //       l: e.reportedResult.limits.LowerAcceptanceLimit,
    //       uw: e.reportedResult.limits.UpperWarningLimit,
    //       lw: e.reportedResult.limits.LowerWarningLimit
    //     }
    //   }
    //   res['n'] = e.ElementName;
    //   res['r'] = e.reportedResult.resultValue;
    //   return res
    // });
    // return {
    //   h: headers,
    //   e: elements
    // }
  }

  getFurance(headers) {
    const stage = (headers || []).find(header => header.name?.toLowerCase() === 'stage')
    if (!stage) {
      return null
    }
    const furanceChar = stage.value.substr(0, 1);
    return furanceMap[furanceChar.toUpperCase()]
  }



// onSendClick() {

//   const furnaceNo = this.furnaceCtrl.value;
//   const sendData = `${this.sendableData},fur:${furnaceNo}`;
//   const finaldata = `$${sendData}#`;

//   console.log("Data to be sent:", finaldata);

//   const mode = this.app.getMode();
//   if (mode !== 'serial') return;

//   const selectedSerialPort = this.app.getSelectedSerialPort();

//   this.ngZone.run(() => this.app.showLoader('Sending data...'));

//   ipcRenderer.invoke('start-serial-listener', selectedSerialPort.path)
//     .then(res => {

//       if (!res.success) {
//         this.ngZone.run(() => {
//           this.app.hideLoader();
//           this.dialog.open(ErrorDialogComponent, {
//             data: {
//               message: 'Could not open serial port.',
//               title: 'Error',
//               iconPath: './assets/icons/error_outline_white_24dp.svg'
//             }
//           });
//         });
//         return;
//       }

//       this._serialPortService.sendData(selectedSerialPort.path, finaldata).subscribe();

//       let responseReceived = false;

//       const timeout = setTimeout(() => {
//         if (!responseReceived) {

//           this.ngZone.run(() => {
//             this.app.hideLoader();
//             this.dialog.open(ErrorDialogComponent, {
//               data: {
//                 message: 'No response from device (Timeout).',
//                 title: 'Timeout',
//                 iconPath: './assets/icons/error_outline_white_24dp.svg'
//               }
//             });
//           });

//           ipcRenderer.invoke('stop-serial-listener');
//           this.app.setFileStatus(this.file.name,'no-response');
//         }
//       }, 6000);

//       this._serialPortService.listenSerialResponse().subscribe(resp => {

//         responseReceived = true;
//         clearTimeout(timeout);

//         this.ngZone.run(() => this.app.hideLoader());

//         // SUCCESS
//         if (resp.includes('$received#')) {
//           this.ngZone.run(() => {
//             this.dialog.open(ErrorDialogComponent, {
//               data: {
//                 message: 'Data sent successfully.',
//                 title: 'Success',
//                 iconPath: './assets/icons/done_white_24dp.svg'
//               }
//             });
//           });
//           this.app.setFileStatus(this.file.name,'sent-data');
//         }

//         // WIFI ERROR
//         else if (resp.includes('$WiFiDisConnected#')) {
//           this.ngZone.run(() => {
//             this.dialog.open(ErrorDialogComponent, {
//               data: {
//                 message: 'WiFi is not connected on the machine.',
//                 title: 'WiFi Error',
//                 iconPath: './assets/icons/error_outline_white_24dp.svg'
//               }
//             });
//           });
//           this.app.setFileStatus(this.file.name,'no-wifi');
//         }

//         // UNKNOWN RESPONSE
//         else {
//           this.ngZone.run(() => {
//             this.dialog.open(ErrorDialogComponent, {
//               data: {
//                 message: 'Unknown response received.',
//                 title: 'Unknown',
//                 iconPath: './assets/icons/error_outline_white_24dp.svg'
//               }
//             });
//           });
//           this.app.setFileStatus(this.file.name, 'no-response');
//         }

//         ipcRenderer.invoke('stop-serial-listener');
//       });
//     });
// }


onSendClick() {

  const furnaceNo = this.furnaceCtrl.value;
  const sendData = `${this.sendableData},fur:${furnaceNo}`;

  const mode = this.app.getMode();
  const finalSerialData = `$${sendData}#`;   
  const finalIPData = sendData;             

  const fileName = this.file.name;

  this.ngZone.run(() => this.app.showLoader("Sending data..."));

  if (mode === "serial") {

    const selectedPort = this.app.getSelectedSerialPort();
    if (!selectedPort) return;

    ipcRenderer.invoke("start-serial-listener", selectedPort.path).then(res => {

      if (!res.success) {
        this.ngZone.run(() => {
          this.app.hideLoader();
          this.dialog.open(ErrorDialogComponent, {
            data: {
              message: "Could not open serial port.",
              title: "Error",
              iconPath: "./assets/icons/error_outline_white_24dp.svg"
            }
          });
        });
        return;
      }

      this._serialPortService.sendData(selectedPort.path, finalSerialData).subscribe();

      let responseReceived = false;

      // Timeout (6 seconds)
      const timeout = setTimeout(() => {
        if (!responseReceived) {

          this.ngZone.run(() => {
            this.app.hideLoader();
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: "No response from device (Timeout).",
                title: "Timeout",
                iconPath: "./assets/icons/error_outline_white_24dp.svg"
              }
            });
          });

          this.app.setFileStatus(fileName, "no-response");
          ipcRenderer.invoke("stop-serial-listener");
        }
      }, 6000);

      // Listen for serial response
      this._serialPortService.listenSerialResponse().subscribe(resp => {

        responseReceived = true;
        clearTimeout(timeout);

        this.ngZone.run(() => this.app.hideLoader());

        // SUCCESS 
        if (resp.includes("$received#")) {
          this.ngZone.run(() => {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: "Data sent successfully.",
                title: "Success",
                iconPath: "./assets/icons/done_white_24dp.svg"
              }
            });
          });

          this.app.setFileStatus(fileName, "sent-data");
        }

        // WIFI ERROR
        else if (resp.includes("$WiFiDisConnected#")) {
          this.ngZone.run(() => {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: "WiFi is not connected on the machine.",
                title: "WiFi Error",
                iconPath: "./assets/icons/error_outline_white_24dp.svg"
              }
            });
          });

          this.app.setFileStatus(fileName, "no-wifi");
        }

        // UNKNOWN
        else {
          this.ngZone.run(() => {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: "Unknown response received.",
                title: "Unknown",
                iconPath: "./assets/icons/error_outline_white_24dp.svg"
              }
            });
          });

          this.app.setFileStatus(fileName, "no-response");
        }

        ipcRenderer.invoke("stop-serial-listener");
      });

    });

    return;
  }



  if (mode === "ip") {
    const ip = this.app.getSelectedIP();
    if (!ip) return;

    let responseReceived = false;

    const timeout = setTimeout(() => {
      if (!responseReceived) {
        this.ngZone.run(() => {
          this.app.hideLoader();
          this.dialog.open(ErrorDialogComponent, {
            data: {
              message: "No response from device over IP (Timeout).",
              title: "Timeout",
              iconPath: "./assets/icons/error_outline_white_24dp.svg"
            }
          });
        });

        this.app.setFileStatus(fileName, "no-response");
      }
    }, 6000);

    this.ipService.sendData(ip, finalIPData)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => this.app.hideLoader());
        }),
        catchError(err => {
          clearTimeout(timeout);

          this.ngZone.run(() => {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: "IP send failed.",
                title: "IP Error",
                iconPath: "./assets/icons/error_outline_white_24dp.svg"
              }
            });
          });

          this.app.setFileStatus(fileName, "no-response");
          return throwError(() => err);
        })
      )
      .subscribe(resp => {

        responseReceived = true;
        clearTimeout(timeout);

     

        this.ngZone.run(() => {
          this.dialog.open(ErrorDialogComponent, {
            data: {
              message: "Data sent successfully via IP.",
              title: "Success",
              iconPath: "./assets/icons/done_white_24dp.svg"
            }
          });
        });
      });
  }
}


  isSendDisabled() {
  const mode = this.app.getMode();

  if (mode === 'serial') {
    const port = this.app.getSelectedSerialPort();
    return !port; 
  }

  if (mode === 'ip') {
    const ip = this.app.getSelectedIP();
    return !ip;
  }

  return true;
}



}
