import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FeedbackMessage {
  kind: 'error' | 'success' | 'confirm';
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  details?: { label: string; value: string }[];
}

@Component({
  selector: 'app-feedback-modal',
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss'],
  standalone: false
})
export class FeedbackModalComponent {
  @Input() feedback: FeedbackMessage | null = null;
  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();
}
