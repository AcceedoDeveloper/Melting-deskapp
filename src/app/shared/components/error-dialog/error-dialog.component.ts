import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";


@Component({
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.html']
})
export class ErrorDialogComponent {

    message: string;
    iconPath: string;
    title: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) private data
    ) {
        this.message = this.data.message
        this.iconPath = this.data.iconPath
        this.title = this.data.title
    }

}