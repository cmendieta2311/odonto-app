import { Type } from '@angular/core';

export interface ModalConfig {
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    panelClass?: string | string[];
    backdropClass?: string | string[];
    disableClose?: boolean;
    data?: any;
    autoFocus?: boolean;
}

export class ModalRef<T = any, R = any> {
    constructor(private overlayRef: any, private _afterClosed: any) { }

    close(result?: R): void {
        this.overlayRef.close(result);
    }

    afterClosed() {
        return this._afterClosed;
    }

    // Alias for compatibility
    backdropClick() {
        return this.overlayRef.backdropClick();
    }
}
