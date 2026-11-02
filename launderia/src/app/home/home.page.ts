
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FeedbackMessage } from './feedback-modal.component';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline, arrowBackOutline, gridOutline, homeOutline,
  shirtOutline, calculatorOutline, receiptOutline, logOutOutline,
  waterOutline, sparklesOutline, timeOutline, checkmarkOutline,
  addOutline, removeOutline, searchOutline, leafOutline, walletOutline
} from 'ionicons/icons';

type UserRole = 'customer' | 'admin';
type AuthView = 'welcome' | 'login' | 'signup';
type PageName = 'home' | 'services' | 'estimator' | 'orders' | 'customer' | 'admin';
type FormField = 'loginUsername' | 'loginPassword' | 'signupName' | 'signupUsername' |
  'signupPassword' | 'confirmPassword' | 'orderCustomer' | 'orderService' | 'orderQuantity' |
  'estimatorService' | 'estimatorQuantity';

interface CustomerAccount {
  name: string;
  username: string;
  password: string;
}

interface LaundryService {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

interface LaundryOrder {
  id: number;
  customerName: string;
  service: string;
  quantity: number;
  unit: string;
  total: number;
  date: string;
  status: string;
  payment: string;
  paymentMethod: string;
}

interface MonthlySale {
  month: string;
  total: number;
  height: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  @ViewChild('pageContent', { read: ElementRef }) private pageContent?: ElementRef<HTMLIonContentElement>;
  feedback: FeedbackMessage | null = null;
  private pendingAction: (() => void) | null = null;
  private feedbackOrigin: HTMLElement | null = null;
  fieldErrors: Partial<Record<FormField, string>> = {};
  usernameSuggestionsOpen = false;
  activeUsernameSuggestion = -1;
  private recentUsernames: { username: string; role: UserRole }[] = [];

  clearFieldError(field: FormField): void {
    delete this.fieldErrors[field];
  }

  private focusInvalidField(): void {
    requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  get usernameSuggestions(): string[] {
    const query = this.username.trim().toLowerCase();
    if (!this.usernameSuggestionsOpen || !query) return [];
    const candidates = [
      ...this.recentUsernames.filter(item => item.role === this.selectedRole).map(item => item.username),
      ...(this.selectedRole === 'admin' ? ['admin'] : ['customer', 'maria'])
    ];
    const unique = new Map<string, string>();
    candidates.forEach(name => { if (!unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name); });
    return [...unique.values()].filter(name => name.toLowerCase().startsWith(query)).slice(0, 5);
  }

  onUsernameInput(value: string): void {
    this.username = value;
    this.clearFieldError('loginUsername');
    this.clearFieldError('loginPassword');
    this.activeUsernameSuggestion = -1;
    this.usernameSuggestionsOpen = value.trim().length > 0;
  }

  closeUsernameSuggestions(): void {
    this.usernameSuggestionsOpen = false;
    this.activeUsernameSuggestion = -1;
  }

  selectUsername(username: string): void {
    this.username = username;
    this.clearFieldError('loginUsername');
    this.clearFieldError('loginPassword');
    this.closeUsernameSuggestions();
  }

  onUsernameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Tab') {
      this.closeUsernameSuggestions();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.usernameSuggestionsOpen = this.username.trim().length > 0;
      const count = this.usernameSuggestions.length;
      if (!count) return;
      event.preventDefault();
      this.activeUsernameSuggestion = event.key === 'ArrowDown'
        ? (this.activeUsernameSuggestion + 1) % count
        : (this.activeUsernameSuggestion < 0 ? count - 1 : (this.activeUsernameSuggestion - 1 + count) % count);
    } else if (event.key === 'Enter' && this.activeUsernameSuggestion >= 0 && this.usernameSuggestions.length) {
      event.preventDefault();
      this.selectUsername(this.usernameSuggestions[this.activeUsernameSuggestion]);
    }
  }

  private rememberUsername(): void {
    const username = this.username.trim();
    const role = this.selectedRole;
    this.recentUsernames = [
      { username, role },
      ...this.recentUsernames.filter(item => item.role !== role || item.username.toLowerCase() !== username.toLowerCase())
    ].slice(0, 8);
    try {
      localStorage.setItem('launderia-recent-usernames', JSON.stringify(this.recentUsernames));
    } catch {
      // Saving suggestions is optional; unavailable storage must not block sign-in.
    }
    this.closeUsernameSuggestions();
  }

  private showFeedback(message: FeedbackMessage, action: (() => void) | null = null): void {
    if (!this.feedback) {
      this.feedbackOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.pendingAction = action;
    this.feedback = message;
  }

  private notify(message: string, kind: 'error' | 'success' = 'error'): void {
    this.showFeedback({
      kind,
      title: kind === 'success' ? 'All taken care of.' : 'Let’s check that.',
      message
    });
  }

  dismissFeedback(): void {
    this.pendingAction = null;
    this.feedback = null;
  }

  onFeedbackDismissed(): void {
    // An older modal's exit animation must not interfere with a newer message.
    if (this.feedback) return;
    const origin = this.feedbackOrigin;
    this.feedbackOrigin = null;
    // Wait until Ionic removes the overlay and makes the app focusable again.
    requestAnimationFrame(() => {
      if (this.feedback) return;
      const target = origin?.isConnected
        ? origin
        : this.host.nativeElement.querySelector<HTMLElement>('.auth-content h2, .workspace-main h1');
      if (target) {
        if (!target.matches('button, input, select, a, [tabindex]')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    });
  }

  navigate(page: PageName): void {
    this.activePage = page;
    void this.pageContent?.nativeElement.scrollToTop?.(0);
  }

  confirmFeedback(): void {
    const action = this.pendingAction;
    if (!action) return;
    // Clear first so repeated clicks cannot perform the operation twice.
    this.pendingAction = null;
    action();
  }
  loggedIn = false;
  authView: AuthView = 'welcome';
  selectedRole: UserRole = 'customer';
  role: UserRole | '' = '';

  username = '';
  password = '';
  currentCustomer = '';

  signupName = '';
  signupUsername = '';
  signupPassword = '';
  confirmPassword = '';

  registeredCustomers: CustomerAccount[] = [];
  activePage: PageName = 'home';

  services: LaundryService[] = [
    {
      id: 1,
      name: 'Wash and Dry',
      description: 'Complete washing and drying service for everyday clothes.',
      price: 35,
      unit: 'kg'
    },
    {
      id: 2,
      name: 'Wash, Dry and Fold',
      description: 'Laundry service with washing, drying, and folding.',
      price: 45,
      unit: 'kg'
    },
    {
      id: 3,
      name: 'Dry Cleaning',
      description: 'Special cleaning service for delicate garments.',
      price: 100,
      unit: 'load'
    },
    {
      id: 4,
      name: 'Ironing',
      description: 'Professional ironing service for your clothes.',
      price: 25,
      unit: 'piece'
    },
    {
      id: 5,
      name: 'Express Laundry',
      description: 'Priority laundry service for urgent laundry needs.',
      price: 60,
      unit: 'kg'
    }
  ];

  selectedServiceId = 1;
  quantity = 1;
  orders: LaundryOrder[] = [];
  searchText = '';

  newOrder = {
    customerName: '',
    serviceId: 1,
    quantity: 1,
    paymentMethod: 'Cash'
  };

  constructor() {
    addIcons({
      arrowForwardOutline, arrowBackOutline, gridOutline, homeOutline,
      shirtOutline, calculatorOutline, receiptOutline, logOutOutline,
      waterOutline, sparklesOutline, timeOutline, checkmarkOutline,
      addOutline, removeOutline, searchOutline, leafOutline, walletOutline
    });
    this.loadOrders();
    this.loadCustomerAccounts();
    try {
      const recent: unknown = JSON.parse(localStorage.getItem('launderia-recent-usernames') || '[]');
      this.recentUsernames = Array.isArray(recent) ? recent.filter(item =>
        item && typeof item.username === 'string' && item.username.trim() &&
        (item.role === 'customer' || item.role === 'admin')
      ).slice(0, 8) : [];
    } catch {
      this.recentUsernames = [];
    }
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get pageTitle(): string {
    const titles: Record<PageName, string> = {
      home: 'A fresh perspective', services: 'Our services', estimator: 'Price estimator',
      orders: 'Order management', customer: 'My dashboard', admin: 'Business overview'
    };
    return titles[this.activePage];
  }

  get navigation(): { label: string; page: PageName; icon: string }[] {
    if (this.role === 'admin') {
      return [
        { label: 'Overview', page: 'admin', icon: 'grid-outline' },
        { label: 'Services', page: 'services', icon: 'shirt-outline' },
        { label: 'Estimator', page: 'estimator', icon: 'calculator-outline' },
        { label: 'Orders', page: 'orders', icon: 'receipt-outline' }
      ];
    }

    if (this.role === 'customer') {
      return [
        { label: 'Dashboard', page: 'customer', icon: 'grid-outline' },
        { label: 'Home', page: 'home', icon: 'home-outline' },
        { label: 'Services', page: 'services', icon: 'shirt-outline' },
        { label: 'Estimator', page: 'estimator', icon: 'calculator-outline' }
      ];
    }

    return [];
  }

  get selectedService(): LaundryService | undefined {
    return this.services.find(
      service => service.id === Number(this.selectedServiceId)
    );
  }

  get estimatedTotal(): number {
    const amount = Number(this.quantity);
    if (!this.selectedService || !Number.isFinite(amount) || amount <= 0) {
      return 0;
    }
    return this.selectedService.price * amount;
  }

  changeQuantity(change: number): void {
    this.quantity = Math.max(1, Number(this.quantity) + change);
  }

  resetEstimator(): void {
    this.selectedServiceId = 1;
    this.quantity = 1;
  }

  selectService(service: LaundryService): void {
    this.selectedServiceId = service.id;
    this.quantity = 1;
    this.navigate('estimator');
  }

  get newOrderService(): LaundryService | undefined {
    return this.services.find(
      service => service.id === Number(this.newOrder.serviceId)
    );
  }

  get newOrderTotal(): number {
    const amount = Number(this.newOrder.quantity);
    if (!this.newOrderService || !Number.isFinite(amount) || amount <= 0) {
      return 0;
    }
    return this.newOrderService.price * amount;
  }

  get filteredOrders(): LaundryOrder[] {
    const search = this.searchText.trim().toLowerCase();
    if (!search) return this.orders;

    return this.orders.filter(order =>
      order.customerName.toLowerCase().includes(search) ||
      order.service.toLowerCase().includes(search) ||
      String(order.id).includes(search) ||
      order.status.toLowerCase().includes(search)
    );
  }

  private createOrder(
    customerName: string,
    service: LaundryService,
    quantity: number,
    paymentMethod: string
  ): void {
    const order: LaundryOrder = {
      id: Date.now(),
      customerName,
      service: service.name,
      quantity,
      unit: service.unit,
      total: service.price * quantity,
      date: new Date().toISOString(),
      status: 'Received',
      payment: 'Unpaid',
      paymentMethod
    };

    this.orders.unshift(order);
    this.saveOrders();
  }

  addOrder(): void {
    this.fieldErrors = {};
    const name = this.newOrder.customerName.trim();
    const service = this.newOrderService;
    const amount = Number(this.newOrder.quantity);

    if (!name) {
      this.fieldErrors.orderCustomer = 'Enter the customer’s name.';
    }
    if (!service) this.fieldErrors.orderService = 'Choose a valid laundry service.';
    if (!Number.isFinite(amount) || amount <= 0) this.fieldErrors.orderQuantity = 'Enter a quantity greater than zero.';
    if (Object.keys(this.fieldErrors).length || !service) {
      this.focusInvalidField();
      return;
    }

    this.createOrder(name, service, amount, this.newOrder.paymentMethod);
    this.notify('Order successfully created.', 'success');

    this.newOrder = {
      customerName: '',
      serviceId: 1,
      quantity: 1,
      paymentMethod: 'Cash'
    };
  }

  placeCustomerOrder(): void {
    this.fieldErrors = {};
    if (!this.loggedIn || this.role !== 'customer') {
      this.fieldErrors.estimatorService = 'Sign in as a customer to place an order.';
      return;
    }

    const service = this.selectedService;
    const amount = Number(this.quantity);

    if (!service) this.fieldErrors.estimatorService = 'Choose a valid laundry service.';
    if (!Number.isFinite(amount) || amount <= 0) this.fieldErrors.estimatorQuantity = 'Choose a quantity greater than zero.';
    if (Object.keys(this.fieldErrors).length || !service) {
      this.focusInvalidField();
      return;
    }

    const customerName = this.currentCustomer;
    const selectedService = { ...service };
    this.showFeedback({
      kind: 'confirm',
      title: 'Ready for a fresh start?',
      message: 'Check your laundry details before placing your order.',
      confirmLabel: 'Place order',
      details: [
        { label: 'Service', value: service.name },
        { label: 'Quantity', value: `${amount} ${service.unit}` },
        { label: 'Estimated total', value: `₱${(service.price * amount).toFixed(2)}` }
      ]
    }, () => {
      this.createOrder(customerName, selectedService, amount, 'Cash');
      this.notify('Your laundry order has been placed successfully.', 'success');
      this.resetEstimator();
      this.navigate('customer');
    });
  }

  updateStatus(order: LaundryOrder, status: string): void {
    order.status = status;
    this.saveOrders();
  }

  updatePaymentMethod(order: LaundryOrder, method: string): void {
    order.paymentMethod = method;
    this.saveOrders();
  }

  togglePayment(order: LaundryOrder): void {
    order.payment = order.payment === 'Paid' ? 'Unpaid' : 'Paid';
    this.saveOrders();
  }

  deleteOrder(id: number): void {
    const order = this.orders.find(item => item.id === id);
    if (!order) return;
    this.showFeedback({
      kind: 'confirm',
      title: 'Delete this order?',
      message: `This removes ${order.customerName}’s ${order.service} order. This action cannot be undone.`,
      confirmLabel: 'Delete order',
      destructive: true
    }, () => {
      this.orders = this.orders.filter(item => item.id !== id);
      this.saveOrders();
      this.notify('The order has been deleted.', 'success');
    });
  }

  get customerOrders(): LaundryOrder[] {
    return this.orders.filter(order =>
      order.customerName.trim().toLowerCase() ===
      this.currentCustomer.trim().toLowerCase()
    );
  }

  get customerCompletedOrders(): number {
    return this.customerOrders.filter(
      order => order.status === 'Completed'
    ).length;
  }

  get customerActiveOrders(): number {
    return this.customerOrders.filter(
      order => order.status !== 'Completed'
    ).length;
  }

  get loyaltyPoints(): number {
    return this.customerOrders
      .filter(order => order.payment === 'Paid')
      .reduce((total, order) => total + Math.floor(order.total / 100), 0);
  }

  get completedOrders(): number {
    return this.orders.filter(order => order.status === 'Completed').length;
  }

  get pendingOrders(): number {
    return this.orders.filter(order => order.status !== 'Completed').length;
  }

  get unpaidOrders(): number {
    return this.orders.filter(order => order.payment === 'Unpaid').length;
  }

  get totalRevenue(): number {
    return this.orders
      .filter(order => order.payment === 'Paid')
      .reduce((total, order) => total + order.total, 0);
  }

  get unpaidRevenue(): number {
    return this.orders
      .filter(order => order.payment === 'Unpaid')
      .reduce((total, order) => total + order.total, 0);
  }

  get unpaidOrderList(): LaundryOrder[] {
    return this.orders.filter(order => order.payment === 'Unpaid');
  }

  get customerRecords(): {
    name: string;
    orders: number;
    spending: number;
  }[] {
    const names = [...new Set(this.orders.map(order => order.customerName))];

    return names.map(name => {
      const customerOrders = this.orders.filter(
        order => order.customerName === name
      );

      return {
        name,
        orders: customerOrders.length,
        spending: customerOrders
          .filter(order => order.payment === 'Paid')
          .reduce((sum, order) => sum + order.total, 0)
      };
    });
  }

  get monthlySales(): MonthlySale[] {
    const result: MonthlySale[] = [];
    const today = new Date();

    for (let index = 5; index >= 0; index--) {
      const monthDate = new Date(
        today.getFullYear(),
        today.getMonth() - index,
        1
      );

      const total = this.orders
        .filter(order => {
          const date = new Date(order.date);
          return order.payment === 'Paid' &&
            !Number.isNaN(date.getTime()) &&
            date.getMonth() === monthDate.getMonth() &&
            date.getFullYear() === monthDate.getFullYear();
        })
        .reduce((sum, order) => sum + order.total, 0);

      result.push({
        month: monthDate.toLocaleString('en-US', { month: 'short' }),
        total,
        height: 0
      });
    }

    const maximum = Math.max(...result.map(sale => sale.total), 1);

    result.forEach(sale => {
      sale.height = sale.total > 0
        ? Math.max(5, (sale.total / maximum) * 100)
        : 0;
    });

    return result;
  }

  chooseRole(role: UserRole): void {
    this.fieldErrors = {};
    this.closeUsernameSuggestions();
    this.selectedRole = role;
    this.authView = 'login';
    this.username = '';
    this.password = '';
  }

  startBooking(): void {
    this.chooseRole('customer');
    requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLInputElement>('#login-username')?.focus());
  }

  backToWelcome(): void {
    this.fieldErrors = {};
    this.closeUsernameSuggestions();
    this.authView = 'welcome';
    this.username = '';
    this.password = '';
  }

  showSignup(): void {
    this.fieldErrors = {};
    this.closeUsernameSuggestions();
    this.authView = 'signup';
    this.clearSignup();
  }

  backToLogin(): void {
    this.fieldErrors = {};
    this.authView = 'login';
    this.clearSignup();
  }

  private clearSignup(): void {
    this.signupName = '';
    this.signupUsername = '';
    this.signupPassword = '';
    this.confirmPassword = '';
  }

  signup(): void {
    this.fieldErrors = {};
    const name = this.signupName.trim();
    const username = this.signupUsername.trim();
    const usernameExists = this.registeredCustomers.some(
      account => account.username.toLowerCase() === username.toLowerCase()
    );

    if (!name) this.fieldErrors.signupName = 'Enter your full name.';
    if (!username) this.fieldErrors.signupUsername = 'Enter a username.';
    else if (username.length < 3) this.fieldErrors.signupUsername = 'Use at least 3 characters for your username.';
    else if (usernameExists || ['admin', 'customer', 'maria'].includes(username.toLowerCase())) {
      this.fieldErrors.signupUsername = 'This username is already registered or reserved.';
    }
    if (!this.signupPassword) this.fieldErrors.signupPassword = 'Enter a password.';
    else if (this.signupPassword.length < 6) this.fieldErrors.signupPassword = 'Use at least 6 characters for your password.';
    if (!this.confirmPassword) this.fieldErrors.confirmPassword = 'Confirm your password.';
    else if (this.signupPassword !== this.confirmPassword) this.fieldErrors.confirmPassword = 'Your passwords do not match.';
    if (Object.keys(this.fieldErrors).length) {
      this.focusInvalidField();
      return;
    }

    const newAccount: CustomerAccount = {
      name,
      username,
      password: this.signupPassword
    };

    this.registeredCustomers.push(newAccount);
    this.saveCustomerAccounts();

    this.notify('Your free customer account has been created successfully.', 'success');

    this.username = username;
    this.password = '';
    this.clearSignup();
    this.selectedRole = 'customer';
    this.authView = 'login';
  }

  login(): void {
    this.fieldErrors = {};
    this.closeUsernameSuggestions();
    const enteredUsername = this.username.trim();
    if (!enteredUsername) this.fieldErrors.loginUsername = 'Enter your username.';
    if (!this.password) this.fieldErrors.loginPassword = 'Enter your password.';
    if (Object.keys(this.fieldErrors).length) {
      this.focusInvalidField();
      return;
    }

    if (this.selectedRole === 'admin') {
      if (enteredUsername === 'admin' && this.password === 'admin123') {
        this.loggedIn = true;
        this.role = 'admin';
        this.currentCustomer = 'Administrator';
        this.rememberUsername();
        this.navigate('admin');
        this.authView = 'welcome';
      } else {
        this.fieldErrors.loginPassword = 'Incorrect username or password. Please try again.';
        this.focusInvalidField();
      }
      return;
    }

    const demoAccounts: CustomerAccount[] = [
      { username: 'customer', password: 'customer123', name: 'Juan Dela Cruz' },
      { username: 'maria', password: 'maria123', name: 'Maria Santos' }
    ];

    const account = [...this.registeredCustomers, ...demoAccounts].find(
      customer =>
        customer.username.toLowerCase() === enteredUsername.toLowerCase() &&
        customer.password === this.password
    );

    if (!account) {
      this.fieldErrors.loginPassword = 'Incorrect username or password. Please try again.';
      this.focusInvalidField();
      return;
    }

    this.loggedIn = true;
    this.role = 'customer';
    this.currentCustomer = account.name;
    this.rememberUsername();
    this.navigate('customer');
    this.authView = 'welcome';
    this.newOrder.customerName = account.name;
  }

  logout(): void {
    this.fieldErrors = {};
    this.closeUsernameSuggestions();
    this.loggedIn = false;
    this.username = '';
    this.password = '';
    this.currentCustomer = '';
    this.role = '';
    this.navigate('home');
    this.authView = 'welcome';
  }

  goHome(): void {
    this.navigate(this.role === 'admin' ? 'admin' : 'customer');
  }

  saveOrders(): void {
    localStorage.setItem('launderia-orders', JSON.stringify(this.orders));
  }

  loadOrders(): void {
    try {
      const saved = JSON.parse(localStorage.getItem('launderia-orders') || '[]');
      this.orders = Array.isArray(saved)
        ? saved.map((item: LaundryOrder) => ({
            ...item,
            unit: item.unit || 'kg',
            paymentMethod: item.paymentMethod || 'Cash',
            payment: item.payment || 'Unpaid',
            status: item.status || 'Received'
          }))
        : [];
    } catch {
      this.orders = [];
    }
  }

  saveCustomerAccounts(): void {
    localStorage.setItem(
      'launderia-customers',
      JSON.stringify(this.registeredCustomers)
    );
  }

  loadCustomerAccounts(): void {
    try {
      const saved = JSON.parse(
        localStorage.getItem('launderia-customers') || '[]'
      );
      this.registeredCustomers = Array.isArray(saved) ? saved : [];
    } catch {
      this.registeredCustomers = [];
    }
  }
}
