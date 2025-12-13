import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { BehaviorSubject, Observable } from "rxjs";
import { PortInfo } from "../../models/port-info.model";
import { LoaderDialogComponent } from "../../shared/components/loader-dialog/loader-dialog.component";
import { getOnce } from "../utils/get-once";


@Injectable({
    providedIn: 'root'
})
export class AppService {

    sortOptions = [
        { value: 'dateNew', name: 'Date (Newest)' },
        { value: 'dateOld', name: 'Date (Oldest)' },
        // { value: 'noAsc', name: 'Number (0-9)' },
        // { value: 'noDsc', name: 'Number (9-0)' },
        { value: 'nameAsc', name: 'Name (A-Z)' },
        { value: 'nameDesc', name: 'Name (Z-A)' },
    ]

    showBackBtn$ = new BehaviorSubject(false);
    serialPorts$ = new BehaviorSubject<PortInfo[]>([]);
    selectedPort$ = new BehaviorSubject<PortInfo>(null);
    activeSort$ = new BehaviorSubject<any>(this.sortOptions[0]);
    fileSearch$ = new BehaviorSubject<string>('');
    selectedIP$ = new BehaviorSubject<string>(null);
    mode$ = new BehaviorSubject<'serial' | 'ip'>('serial');
    serialDataReceived$ = new BehaviorSubject<string>('');
    autoDetectFiles$ = new BehaviorSubject<number | null>(null);

fileStatus$ = new BehaviorSubject<{ [fileId: string]: string }>({});


    sorts$ = new BehaviorSubject<any[]>(this.sortOptions)

    private _backScreen;
    private _loaderRef: MatDialogRef<LoaderDialogComponent>;

    set backRoute(route: any[]) {
        this._backScreen = route
    }

    get backRoute() {
        return this._backScreen
    }

    constructor(
        private dialog: MatDialog
    ) {

    }


    // back button
    setShowBackBtn(btnState: boolean) {
        this.showBackBtn$.next(btnState)
    }

    isBackBtnShowObs() {
        return this.showBackBtn$.asObservable();
    }
    // back button

    // sort
    setActiveSort(sort) {
        this.activeSort$.next(sort)
    }

    activeSortObs() {
        return this.activeSort$.asObservable();
    }

    activeSort() {
        return getOnce(this.activeSort$.asObservable())
    }
    // sort

    getSortsObs() {
        return this.sorts$.asObservable();
    }

    getSorts() {
        return getOnce(this.sorts$.asObservable())
    }

    // sort
    setfileSearch(searhTerm: string) {
        this.fileSearch$.next(searhTerm)
    }

    fileSearchObs() {
        return this.fileSearch$.asObservable();
    }

    fileSearch() {
        return getOnce(this.fileSearch$.asObservable())
    }
    // sort

    // serial ports
    getSerialPortsObs() {
        return this.serialPorts$.asObservable();
    }

    getSerialPorts() {
        return getOnce(this.serialPorts$.asObservable())
    }

    setSerialPorts(ports: PortInfo[]) {
        this.serialPorts$.next(ports)
    };
    // serial ports

    geSelectedtSerialPortObs() {
        return this.selectedPort$.asObservable();
    }

    getSelectedSerialPort() {
        return getOnce(this.selectedPort$.asObservable())
    }

    setSelectedSerialPort(port: PortInfo) {
        this.selectedPort$.next(port)
    }

    showLoader(message) {
        this._loaderRef = this.dialog.open(LoaderDialogComponent, { data: { message }, disableClose: true });
        return this._loaderRef
    }

    hideLoader() {
        if (this._loaderRef) {
            this._loaderRef.close();
        }
    }

    setSelectedIPAddress(ip: string) {
  this.selectedIP$.next(ip);
}

getSelectedIPObs() {
  return this.selectedIP$.asObservable();
}

getSelectedIP() {
  return getOnce(this.selectedIP$.asObservable());
}


setMode(mode: 'serial' | 'ip') {
  this.mode$.next(mode);
}

getModeObs() {
  return this.mode$.asObservable();
}

getMode() {
  return getOnce(this.mode$.asObservable());
}

// Serial data received
setSerialDataReceived(data: string) {
  this.serialDataReceived$.next(data);
}

getSerialDataReceivedObs() {
  return this.serialDataReceived$.asObservable();
}

getSerialDataReceived() {
  return getOnce(this.serialDataReceived$.asObservable());
}

setFileStatus(fileId: string, status: string) {
  const current = this.fileStatus$.value;
  this.fileStatus$.next({ ...current, [fileId]: status });
}


// setter
setAutoDetectFiles(value: number) {
  this.autoDetectFiles$.next(value);
}

// observable
getAutoDetectFilesObs() {
  return this.autoDetectFiles$.asObservable();
}

// sync getter (if needed)
getAutoDetectFiles() {
  return getOnce(this.autoDetectFiles$.asObservable());
}

}