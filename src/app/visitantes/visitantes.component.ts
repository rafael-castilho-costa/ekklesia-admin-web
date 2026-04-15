import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-visitantes',
  templateUrl: './visitantes.component.html',
  styleUrls: ['./visitantes.component.css'],
  imports: [CommonModule]
})
export class VisitantesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
