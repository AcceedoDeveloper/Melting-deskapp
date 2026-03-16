import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ipcRenderer } from "electron";

@Injectable({
  providedIn: 'root'
})
export class IpService {

 sendData(ip: string, data: string, furnaceNo: number): Observable<any> {
    return new Observable((observer) => {

      ipcRenderer
        .invoke('send-data-ip', ip, data, furnaceNo)
        .then((response) => {

          if (response?.error) {
            observer.error(response.message);
          } else {
            observer.next(response);
          }

          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }
}
