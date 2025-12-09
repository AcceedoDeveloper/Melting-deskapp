import { Injectable } from "@angular/core";
import { ipcRenderer } from "electron";
import { Observable, tap } from "rxjs";
// import { SerialPort } from "serialport";
import { PortInfo } from "../../models/port-info.model";
import { AppService } from "./app.service";

@Injectable({
    providedIn: 'root'
})
export class SerialPortService {

    constructor(
        private app: AppService
    ) {

    }

    getSerialPorts() {
        return new Observable<PortInfo[]>((observer) => {
            ipcRenderer.invoke('get-serial-port-list').then((ports) => {
                observer.next(ports);
                observer.complete();
            })
        }).pipe(
            tap(ports => {
                this.app.setSerialPorts(ports);
                if (ports?.length) {
                    this.app.setSelectedSerialPort(ports[0])
                }
            })
        )
    }

    sendData(path: string, data: string) {
        console.log("Sending Data to Serial Port:", data, path);
        return new Observable<any>((observer) => {
            ipcRenderer.invoke('send-data-serial-port-com', path, data).then((msg) => {
                if (msg) {
                    observer.next()
                    observer.complete()
                } else {
                    console.log(msg)
                    observer.error('error')
                }
            })
        })

    }

    listenSerialResponse(): Observable<string> {
  return new Observable(observer => {
    ipcRenderer.on('serial-data-received', (event, data) => {
      observer.next(data);
    });

    ipcRenderer.on('serial-data-error', (event, error) => {
      observer.error(error);
    });

    ipcRenderer.on('serial-port-closed', () => {
      observer.complete();
    });
  });
}

}

