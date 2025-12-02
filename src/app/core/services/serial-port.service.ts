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
}