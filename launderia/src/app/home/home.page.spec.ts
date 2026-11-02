
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { By } from '@angular/platform-browser';

import { HomePageModule } from './home.module';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [
        HomePageModule,
        RouterModule.forRoot([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows login validation inline without losing entered values', () => {
    component.username = 'customer';
    component.login();
    expect(component.feedback).toBeNull();
    expect(component.fieldErrors.loginPassword).toContain('password');
    expect(component.username).toBe('customer');
    expect(component.loggedIn).toBe(false);
  });

  it.each([
    ['', 'abc', 'secret12', 'secret12', 'signupName', 'name'],
    ['Alex', 'ab', 'secret12', 'secret12', 'signupUsername', '3 characters'],
    ['Alex', 'alex', 'short', 'short', 'signupPassword', '6 characters'],
    ['Alex', 'alex', 'secret12', 'different', 'confirmPassword', 'match'],
    ['Alex', 'customer', 'secret12', 'secret12', 'signupUsername', 'reserved']
  ])('keeps invalid registration out of storage (%s, %s)', (name, username, password, confirmation, field, message) => {
    component.signupName = name;
    component.signupUsername = username;
    component.signupPassword = password;
    component.confirmPassword = confirmation;
    component.signup();
    expect(component.feedback).toBeNull();
    expect(component.fieldErrors[field as keyof typeof component.fieldErrors]).toContain(message);
    expect(localStorage.getItem('launderia-customers')).toBeNull();
    expect(component.signupUsername).toBe(username);
  });

  it('saves a valid registration and shows a success modal', () => {
    component.signupName = 'Alex Santos';
    component.signupUsername = 'alex';
    component.signupPassword = component.confirmPassword = 'secret12';
    component.signup();
    expect(JSON.parse(localStorage.getItem('launderia-customers') || '[]')).toHaveLength(1);
    expect(component.authView).toBe('login');
    expect(component.username).toBe('alex');
    expect(component.feedback?.kind).toBe('success');
  });

  it('shows invalid order feedback without creating an order', () => {
    component.newOrder.customerName = 'Alex';
    component.newOrder.quantity = 0;
    component.addOrder();
    expect(component.feedback).toBeNull();
    expect(component.fieldErrors.orderQuantity).toBeTruthy();
    expect(component.orders).toHaveLength(0);
    expect(localStorage.getItem('launderia-orders')).toBeNull();
  });

  it('creates an admin order and reports success inside the app', () => {
    component.newOrder = { customerName: 'Alex', serviceId: 2, quantity: 3, paymentMethod: 'GCash' };
    component.addOrder();
    expect(component.orders[0]).toMatchObject({ total: 135, quantity: 3, paymentMethod: 'GCash' });
    expect(component.feedback?.kind).toBe('success');
  });

  function prepareCustomerOrder(): void {
    component.loggedIn = true;
    component.role = 'customer';
    component.currentCustomer = 'Alex Santos';
    component.selectedServiceId = 2;
    component.quantity = 3;
  }

  it('shows the order summary before saving anything', () => {
    prepareCustomerOrder();
    component.placeCustomerOrder();
    expect(component.feedback?.kind).toBe('confirm');
    expect(component.feedback?.details).toEqual([
      { label: 'Service', value: 'Wash, Dry and Fold' },
      { label: 'Quantity', value: '3 kg' },
      { label: 'Estimated total', value: '₱135.00' }
    ]);
    expect(component.orders).toHaveLength(0);
    expect(localStorage.getItem('launderia-orders')).toBeNull();
  });

  it('cancels a pending order when the modal is dismissed', () => {
    prepareCustomerOrder();
    component.placeCustomerOrder();
    component.dismissFeedback();
    component.confirmFeedback();
    expect(component.orders).toHaveLength(0);
    expect(localStorage.getItem('launderia-orders')).toBeNull();
  });

  it('saves the confirmed order once and keeps its displayed summary values', () => {
    prepareCustomerOrder();
    component.placeCustomerOrder();
    component.quantity = 8;
    component.selectedServiceId = 1;
    component.confirmFeedback();
    component.confirmFeedback();
    expect(component.orders).toHaveLength(1);
    expect(component.orders[0]).toMatchObject({ customerName: 'Alex Santos', service: 'Wash, Dry and Fold', quantity: 3, total: 135 });
    expect(JSON.parse(localStorage.getItem('launderia-orders') || '[]')).toHaveLength(1);
    expect(component.activePage).toBe('customer');
    expect(component.feedback?.kind).toBe('success');
  });

  it('preserves an order when deletion is cancelled and deletes only after confirmation', () => {
    component.newOrder.customerName = 'Alex';
    component.addOrder();
    const orderId = component.orders[0].id;
    component.deleteOrder(orderId);
    expect(component.feedback?.kind).toBe('confirm');
    expect(component.orders).toHaveLength(1);
    component.dismissFeedback();
    expect(JSON.parse(localStorage.getItem('launderia-orders') || '[]')).toHaveLength(1);
    component.deleteOrder(orderId);
    component.confirmFeedback();
    component.confirmFeedback();
    expect(component.orders).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('launderia-orders') || '[]')).toEqual([]);
  });

  it('invalidates a confirmation as soon as the modal begins dismissing', () => {
    prepareCustomerOrder();
    component.placeCustomerOrder();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('ion-modal')).triggerEventHandler('willDismiss', {});
    component.confirmFeedback();
    expect(component.orders).toHaveLength(0);
    expect(component.feedback).toBeNull();
  });

  it('does not let an old dismissal cancel a newer confirmation', () => {
    prepareCustomerOrder();
    component.placeCustomerOrder();
    fixture.detectChanges();
    component.dismissFeedback();
    component.placeCustomerOrder();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('ion-modal')).triggerEventHandler('didDismiss', {});
    component.confirmFeedback();
    expect(component.orders).toHaveLength(1);
  });

  it('shows all service prices on the signed-in home screen', () => {
    prepareCustomerOrder();
    component.activePage = 'home';
    fixture.detectChanges();
    const prices = fixture.nativeElement.querySelector('[aria-label="Our laundry prices"]');
    expect(prices).not.toBeNull();
    expect(prices?.textContent).toContain('Express Laundry');
    expect(prices?.textContent).toContain('₱60');
  });

  it('keeps suggestions hidden until a non-empty username is typed', () => {
    component.chooseRole('customer');
    component.onUsernameInput('');
    expect(component.usernameSuggestions).toEqual([]);
    component.onUsernameInput('   ');
    expect(component.usernameSuggestions).toEqual([]);
    component.onUsernameInput('C');
    expect(component.usernameSuggestions).toEqual(['customer']);
    component.onUsernameInput('no-match');
    expect(component.usernameSuggestions).toEqual([]);
  });

  it('lets the keyboard select a username without filling a password', () => {
    component.onUsernameInput('m');
    component.onUsernameKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onUsernameKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.username).toBe('maria');
    expect(component.password).toBe('');
    expect(component.usernameSuggestions).toEqual([]);
    expect(component.loggedIn).toBe(false);
  });

  it('closes username suggestions with Escape and isolates administrator suggestions', () => {
    component.onUsernameInput('m');
    component.onUsernameKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.usernameSuggestions).toEqual([]);
    component.chooseRole('admin');
    component.onUsernameInput('m');
    expect(component.usernameSuggestions).toEqual([]);
    component.onUsernameInput('a');
    expect(component.usernameSuggestions).toEqual(['admin']);
  });

  it('shows invalid credentials inline for both roles', () => {
    for (const role of ['customer', 'admin'] as const) {
      component.chooseRole(role);
      component.username = 'someone';
      component.password = 'incorrect';
      component.login();
      expect(component.feedback).toBeNull();
      expect(component.fieldErrors.loginPassword).toContain('Incorrect username or password');
      expect(component.loggedIn).toBe(false);
    }
  });

  it('remembers only successful usernames and clears a corrected field error', () => {
    component.registeredCustomers = [{ name: 'Alex Santos', username: 'alex', password: 'secret12' }];
    component.username = 'alex';
    component.password = 'secret12';
    component.login();
    component.logout();
    component.chooseRole('customer');
    component.onUsernameInput('a');
    expect(component.usernameSuggestions).toContain('alex');
    const saved = localStorage.getItem('launderia-recent-usernames') || '';
    expect(saved).toContain('alex');
    expect(saved).not.toContain('secret12');
    component.password = '';
    component.login();
    component.clearFieldError('loginPassword');
    expect(component.fieldErrors.loginPassword).toBeUndefined();
  });

  it('still signs in when the browser cannot save recent usernames', () => {
    component.username = 'customer';
    component.password = 'customer123';
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Storage full', 'QuotaExceededError'); });
    try {
      expect(() => component.login()).not.toThrow();
      expect(component.activePage).toBe('customer');
      expect(component.loggedIn).toBe(true);
    } finally {
      storage.mockRestore();
    }
  });

  it('lets signed-out visitors browse service names, descriptions, and rates', () => {
    component.chooseRole('customer');
    fixture.detectChanges();
    const services = fixture.nativeElement.querySelector('[aria-label="Our laundry prices"]');
    expect(services?.textContent).toContain('Express Laundry');
    expect(services?.textContent).toContain('Priority laundry service');
    expect(services?.textContent).toContain('Sign in to book');
    expect(services?.querySelectorAll('article')).toHaveLength(5);
  });

  it('preserves cents and exposes monthly revenue values and pending order IDs', () => {
    component.loggedIn = true;
    component.role = 'admin';
    component.activePage = 'admin';
    component.newOrder = { customerName: 'Alex', serviceId: 1, quantity: 1.5, paymentMethod: 'Cash' };
    component.addOrder();
    const pendingOrderId = component.orders[0].id;
    component.newOrder = { customerName: 'Sam', serviceId: 1, quantity: 2.5, paymentMethod: 'Cash' };
    component.addOrder();
    component.togglePayment(component.orders[0]);
    component.dismissFeedback();
    fixture.detectChanges();
    const statsText = fixture.nativeElement.querySelector('.stats').textContent;
    expect(statsText).toContain('₱87.50');
    expect(statsText).toContain('₱52.50');
    const chart = fixture.nativeElement.querySelector('.sales-chart');
    expect(chart.getAttribute('role')).toBe('group');
    expect(chart.textContent).toContain('₱87.50');
    expect(fixture.nativeElement.querySelector('.payment-row').textContent).toContain(String(pendingOrderId));
  });
});
