import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ModalContainerComponent } from './shared/components/modal/modal-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ModalContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
