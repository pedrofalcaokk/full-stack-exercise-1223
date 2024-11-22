import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GridComponent } from './components/grid/grid.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, GridComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    title = 'frontend';
}