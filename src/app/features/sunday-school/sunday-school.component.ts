import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-sunday-school',
  templateUrl: './sunday-school.component.html',
  styleUrls: ['./sunday-school.component.css'],
  imports: [CommonModule]
})
export class SundaySchoolComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
