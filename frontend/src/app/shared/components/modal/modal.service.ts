import { Injectable, Type, ComponentRef, ApplicationRef, EnvironmentInjector, createComponent, Injector, Signal, signal, WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalConfig, ModalRef } from './modal.types';

export interface ActiveModal {
    id: string;
    component: Type<any>;
    config: ModalConfig;
    close: (result?: any) => void;
    afterClosedSubject: Subject<any>;
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private modals: ActiveModal[] = [];
    // We will share the active modals list via a signal so the container can render them
    activeModals: WritableSignal<ActiveModal[]> = signal([]);

    constructor(
        private appRef: ApplicationRef,
        private injector: Injector,
        private environmentInjector: EnvironmentInjector
    ) { }

    open<T, D = any, R = any>(component: Type<T>, config: ModalConfig = {}): ModalRef<T, R> {
        const afterClosedSubject = new Subject<R>();
        const id = Math.random().toString(36).substring(2, 9);

        const close = (result?: R) => {
            this.removeModal(id);
            if (result !== undefined) {
                afterClosedSubject.next(result);
            } else {
                afterClosedSubject.next(undefined as any);
            }
            afterClosedSubject.complete();
        };

        const activeModal: ActiveModal = {
            id,
            component, // Store the Type class
            config: {
                width: 'auto',
                maxWidth: '90vw',
                maxHeight: '90vh',
                autoFocus: true,
                ...config
            },
            close,
            afterClosedSubject
        };

        this.modals.push(activeModal);
        this.updateSignal();

        return {
            close,
            afterClosed() {
                return afterClosedSubject.asObservable();
            }
        } as any as ModalRef<T, R>;
    }

    closeAll() {
        [...this.modals].reverse().forEach(modal => modal.close());
    }

    private removeModal(id: string) {
        this.modals = this.modals.filter(m => m.id !== id);
        this.updateSignal();
    }

    private updateSignal() {
        this.activeModals.set([...this.modals]);
    }
}
