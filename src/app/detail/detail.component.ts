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

const CHUNK_LENGTH = 10;

const headerMap = {
  'Heat No': "H",
  'Grade': 'G',
  "Tested By": "T",
  "Stage": "ST",
  "Product ID": "PRO"
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

  constructor(
    private fileList: FileListService,
    private app: AppService,
    private cdr: ChangeDetectorRef,
    private _serialPortService: SerialPortService,
    private dialog: MatDialog
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
      return `${headerMap[h.name]}:${value}`
    }).join(',');

    const elements = spectrum.elements.map((e: SpectrumElement) => {
      return `${e.ElementName}:${e.reportedResult.resultValue}`
    }).join(',')

    return `$${headers},${elements}#`

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

  onSendClick() {
    const selectedSerialPort = this.app.getSelectedSerialPort();
    // show loader
    this.app.showLoader('Sending Data.')
    this._serialPortService.sendData(selectedSerialPort.path, this.sendableData).pipe(
      finalize(() => { this.app.hideLoader() }),
      catchError(err => {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message: 'An Error occured while sending data, Please try again.',
            iconPath: './assets/icons/error_outline_white_24dp.svg',
            title: 'Error'
          }
        })
        return throwError(() => err)
      })
    ).subscribe(() => {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: 'Data Send Successfully.',
          title: 'Success',
          iconPath: './assets/icons/done_white_24dp.svg',
        }
      })
    });
  }

}
