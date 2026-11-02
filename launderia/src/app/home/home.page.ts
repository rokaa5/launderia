
import { Component } from '@angular/core';

type UserRole = 'customer' | 'admin';
type AuthView = 'welcome' | 'login' | 'signup';
type PageName = 'home' | 'services' | 'estimator' | 'orders' | 'customer' | 'admin';

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
    this.loadOrders();
    this.loadCustomerAccounts();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get navigation(): { label: string; page: PageName }[] {
    if (this.role === 'admin') {
      return [
        { label: 'Dashboard', page: 'admin' },
        { label: 'Services', page: 'services' },
        { label: 'Price Estimator', page: 'estimator' },
        { label: 'Order Management', page: 'orders' }
      ];
    }

    if (this.role === 'customer') {
      return [
        { label: 'Dashboard', page: 'customer' },
        { label: 'Home', page: 'home' },
        { label: 'Services', page: 'services' },
        { label: 'Price Estimator', page: 'estimator' }
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
    this.activePage = 'estimator';
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
    const name = this.newOrder.customerName.trim();
    const service = this.newOrderService;
    const amount = Number(this.newOrder.quantity);

    if (!name) {
      alert('Please enter the customer name.');
      return;
    }

    if (!service || !Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid service and quantity.');
      return;
    }

    this.createOrder(name, service, amount, this.newOrder.paymentMethod);
    alert('Order successfully created.');

    this.newOrder = {
      customerName: '',
      serviceId: 1,
      quantity: 1,
      paymentMethod: 'Cash'
    };
  }

  placeCustomerOrder(): void {
    if (!this.loggedIn || this.role !== 'customer') {
      alert('Please log in as a customer.');
      return;
    }

    const service = this.selectedService;
    const amount = Number(this.quantity);

    if (!service || !Number.isFinite(amount) || amount <= 0) {
      alert('Please select a valid service and quantity.');
      return;
    }

    const confirmed = confirm(
      `Confirm your order?\n\n` +
      `Service: ${service.name}\n` +
      `Quantity: ${amount} ${service.unit}\n` +
      `Estimated total: ₱${this.estimatedTotal.toFixed(2)}`
    );

    if (!confirmed) return;

    this.createOrder(this.currentCustomer, service, amount, 'Cash');
    alert('Your laundry order has been placed successfully.');
    this.resetEstimator();
    this.activePage = 'customer';
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
    if (!confirm('Are you sure you want to delete this order?')) return;
    this.orders = this.orders.filter(order => order.id !== id);
    this.saveOrders();
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
    this.selectedRole = role;
    this.authView = 'login';
    this.username = '';
    this.password = '';
  }

  backToWelcome(): void {
    this.authView = 'welcome';
    this.username = '';
    this.password = '';
  }

  showSignup(): void {
    this.authView = 'signup';
    this.clearSignup();
  }

  backToLogin(): void {
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
    const name = this.signupName.trim();
    const username = this.signupUsername.trim();

    if (!name || !username || !this.signupPassword || !this.confirmPassword) {
      alert('Please complete all registration fields.');
      return;
    }

    if (username.length < 3) {
      alert('Username must contain at least 3 characters.');
      return;
    }

    if (this.signupPassword.length < 6) {
      alert('Password must contain at least 6 characters.');
      return;
    }

    if (this.signupPassword !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const usernameExists = this.registeredCustomers.some(
      account => account.username.toLowerCase() === username.toLowerCase()
    );

    if (usernameExists || ['admin', 'customer', 'maria'].includes(username.toLowerCase())) {
      alert('This username is already registered or reserved.');
      return;
    }

    const newAccount: CustomerAccount = {
      name,
      username,
      password: this.signupPassword
    };

    this.registeredCustomers.push(newAccount);
    this.saveCustomerAccounts();

    alert('Your free customer account has been created successfully.');

    this.username = username;
    this.password = '';
    this.clearSignup();
    this.selectedRole = 'customer';
    this.authView = 'login';
  }

  login(): void {
    const enteredUsername = this.username.trim();

    if (!enteredUsername || !this.password) {
      alert('Please enter your username and password.');
      return;
    }

    if (this.selectedRole === 'admin') {
      if (enteredUsername === 'admin' && this.password === 'admin123') {
        this.loggedIn = true;
        this.role = 'admin';
        this.currentCustomer = 'Administrator';
        this.activePage = 'admin';
        this.authView = 'welcome';
      } else {
        alert('Invalid administrator username or password.');
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
      alert('Customer account not found. Check your details or sign up.');
      return;
    }

    this.loggedIn = true;
    this.role = 'customer';
    this.currentCustomer = account.name;
    this.activePage = 'customer';
    this.authView = 'welcome';
    this.newOrder.customerName = account.name;
  }

  logout(): void {
    this.loggedIn = false;
    this.username = '';
    this.password = '';
    this.currentCustomer = '';
    this.role = '';
    this.activePage = 'home';
    this.authView = 'welcome';
  }

  goHome(): void {
    this.activePage = this.role === 'admin' ? 'admin' : 'customer';
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
