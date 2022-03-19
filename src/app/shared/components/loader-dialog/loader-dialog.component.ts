import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    templateUrl: './loader-dialog.component.html',
    styleUrls: ['./loader-dialog.component.scss']
})
export class LoaderDialogComponent {

    message: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) private data
    ) {
        this.message = this.data.message
    }

}