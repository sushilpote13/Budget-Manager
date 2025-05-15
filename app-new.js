// Budget Manager App
// A comprehensive budget tracking application with income/expense management

// ================== UTILITY FUNCTIONS ==================
/**
 * Escape special characters in string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string safe for regex
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Display a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 * @param {number} duration - How long to show the toast
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Generate a unique ID with given prefix
 * @param {string} prefix - Prefix for the ID
 * @returns {string} - Unique ID
 */
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ================== GLOBAL STATE ==================
// Global variables accessible throughout the app
let state;
let elements;
let currentCategoryFilter = 'all';
let currentSearchQuery = '';
let expensePieChart = null;

// ================== MAIN APPLICATION ==================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Budget Manager app starting...');

    // ================== STATE MANAGEMENT ==================
    // Default state configuration (used when no saved state exists)
    const defaultState = {
        transactions: [],
        categories: ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment'],
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        filters: {
            type: 'all',
            month: new Date().toISOString().slice(0, 7)
        },
        totals: {
            income: 0,
            expense: 0,
            balance: 0
        }
    };

    /**
     * Load application state from localStorage
     * @returns {Object} Application state
     */
    function loadState() {
        try {
            const savedState = localStorage.getItem('budgetAppState');
            if (!savedState) return { ...defaultState };
            const parsedState = JSON.parse(savedState);
            return { ...defaultState, ...parsedState };
        } catch (error) {
            console.error('Error loading state:', error);
            return { ...defaultState };
        }
    }

    /**
     * Save application state to localStorage
     * @returns {boolean} Success status
     */
    function saveState() {
        try {
            // Remove unserializable properties before saving
            const serializableState = JSON.parse(JSON.stringify(state, (key, value) => {
                if (typeof value === 'function') return undefined;
                if (value instanceof Element || value instanceof Node) return undefined;
                return value;
            }));
            localStorage.setItem('budgetAppState', JSON.stringify(serializableState));
            return true;
        } catch (error) {
            console.error('Error saving state:', error);
            return false;
        }
    }

    // Initialize application state
    state = loadState();

    // Initialize DOM element references
    elements = {
        // Forms
        expenseForm: document.getElementById('expense-form'),
        incomeForm: document.getElementById('income-form'),
        
        // Inputs
        dateInput: document.getElementById('date'),
        descriptionInput: document.getElementById('description'),
        categoryInput: document.getElementById('category'),
        amountInput: document.getElementById('amount'),
        incomeDateInput: document.getElementById('income-date'),
        incomeDescriptionInput: document.getElementById('income-description'),
        incomeAmountInput: document.getElementById('income-amount'),
        searchInput: document.getElementById('transaction-search'),
        
        // Display elements
        expenseList: document.getElementById('expense-list'),
        transactionList: document.getElementById('transaction-list'),
        incomeTotalEl: document.getElementById('total-income'),
        expenseTotalEl: document.getElementById('total-expenses'),
        remainingBalanceEl: document.getElementById('remaining-balance'),
        expenseChartCanvas: document.getElementById('expense-chart'),
        monthlySummary: document.getElementById('monthly-summary'),
        
        // Filter/search elements
        typeFilter: document.getElementById('transaction-type-filter'),
        monthFilter: document.getElementById('transaction-month-filter'),
        categoryFilter: document.getElementById('category-filter'),
        clearCategoryFilterBtn: document.getElementById('clear-category-filter'),
        searchButton: document.getElementById('search-button'),
        clearSearchButton: document.getElementById('clear-search-button'),
        
        // Data management buttons
        clearDataBtn: document.getElementById('clear-data-btn'),
        exportDataBtn: document.getElementById('export-data-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // Theme toggle
        themeToggleBtn: document.getElementById('theme-toggle'),
        
        // Category management
        datalist: document.getElementById('category-list')
    };

    // Apply initial theme
    document.body.className = state.theme || 'light';

    // ================== UI RENDERING ==================
    /**
     * Render the transaction list based on current filters
     */
    function renderTransactionList() {
        if (!elements.transactionList) {
            console.warn('Transaction list element not found');
            return;
        }

        // Clear the list
        elements.transactionList.innerHTML = '';

        // Get filtered transactions
        let filteredTransactions = state.transactions;

        // Apply type filter
        const typeFilter = elements.typeFilter?.value || state.filters.type;
        if (typeFilter && typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }

        // Apply month filter
        const monthFilter = elements.monthFilter?.value || state.filters.month;
        if (monthFilter) {
            filteredTransactions = filteredTransactions.filter(t => {
                const txDate = new Date(t.date);
                const txMonth = txDate.toISOString().slice(0, 7);
                return txMonth === monthFilter;
            });
        }

        // Apply category filter
        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === currentCategoryFilter);
        }

        // Apply search filter
        if (currentSearchQuery) {
            const query = escapeRegExp(currentSearchQuery.toLowerCase());
            filteredTransactions = filteredTransactions.filter(t => {
                return (
                    t.description.toLowerCase().match(query) ||
                    (t.category && t.category.toLowerCase().match(query))
                );
            });
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Show message if no transactions
        if (filteredTransactions.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = currentSearchQuery
                ? 'No transactions match your search'
                : 'No transactions to display';
            elements.transactionList.appendChild(emptyMessage);
            return;
        }

        // Create transaction elements
        filteredTransactions.forEach(transaction => {
            const { id, type, description, amount, date, category } = transaction;

            const li = document.createElement('li');
            li.className = `transaction ${type}`;
            li.dataset.id = id;

            // Format date for display
            const txDate = new Date(date);
            const formattedDate = txDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Prepare HTML content
            li.innerHTML = `
                <div class="transaction-date">${formattedDate}</div>
                <div class="transaction-description">${description}</div>
                <div class="transaction-amount">₹${Number(amount).toFixed(2)}</div>
                <button class="delete-btn" data-id="${id}" aria-label="Delete transaction">×</button>
            `;

            // Add click handler for delete button
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Confirm delete
                if (confirm(`Are you sure you want to delete this ${type}?`)) {
                    // Find the transaction in array
                    const index = state.transactions.findIndex(t => t.id === id);
                    if (index !== -1) {
                        // Remove transaction
                        state.transactions.splice(index, 1);
                        // Save state
                        saveState();
                        // Update UI
                        updateUI();
                        // Show success message
                        showToast(`${type === 'income' ? 'Income' : 'Expense'} deleted successfully!`, 'success');
                    }
                }
            });

            // Add click handler for the transaction item
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    // TODO: Add inline editing here in the future
                    console.log('Transaction clicked:', transaction);
                }
            });

            // Add to list
            elements.transactionList.appendChild(li);
        });
    }

    /**
     * Update all UI elements with current state data
     */
    function updateUI() {
        // Calculate totals
        let income = 0;
        let expense = 0;

        state.transactions.forEach(tx => {
            if (tx.type === 'income') income += Number(tx.amount);
            else if (tx.type === 'expense') expense += Number(tx.amount);
        });

        const balance = income - expense;

        // Update totals in state
        state.totals.income = income;
        state.totals.expense = expense;
        state.totals.balance = balance;

        // Update DOM
        if (elements.incomeTotalEl) elements.incomeTotalEl.textContent = `₹${income.toFixed(2)}`;
        if (elements.expenseTotalEl) elements.expenseTotalEl.textContent = `₹${expense.toFixed(2)}`;
        if (elements.remainingBalanceEl) elements.remainingBalanceEl.textContent = `₹${balance.toFixed(2)}`;

        // Render transaction list
        renderTransactionList();

        // Update category UI
        updateCategorySuggestions();
        updateCategoryFilterDropdown();
        updateClearFilterButtonVisibility();
        
        // Update expense chart
        updateExpenseChart();
    }

    /**
     * Update expense chart with current data
     */
    function updateExpenseChart() {
        if (!elements.expenseChartCanvas) {
            console.warn('Expense chart canvas not found');
            return;
        }

        const expenses = state.transactions.filter(tx => tx.type === 'expense');

        // Handle case with no expenses
        if (expenses.length === 0) {
            if (expensePieChart) {
                expensePieChart.destroy();
                expensePieChart = null;
            }
            return;
        }

        // Calculate totals per category
        const categoryTotals = {};
        let totalExpense = 0;
        expenses.forEach(tx => {
            if (!categoryTotals[tx.category]) categoryTotals[tx.category] = 0;
            const amount = Number(tx.amount);
            categoryTotals[tx.category] += amount;
            totalExpense += amount;
        });

        // Prepare labels with percentages
        const labels = Object.keys(categoryTotals).map(category => {
            const percentage = ((categoryTotals[category] / totalExpense) * 100).toFixed(1);
            return `${category} (${percentage}%)`;
        });

        const data = {
            labels: labels,
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#B2FF66', '#FF66B2', '#66B2FF', '#B266FF'
                ]
            }]
        };

        // Update or create chart
        if (expensePieChart) {
            expensePieChart.data = data;
            expensePieChart.update();
        } else {
            expensePieChart = new Chart(elements.expenseChartCanvas, {
                type: 'pie',
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const percentage = ((value / totalExpense) * 100).toFixed(1);
                                    return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // ================== TRANSACTION MANAGEMENT ==================
    /**
     * Handle expense form submission
     * @param {Event} e - Form submit event
     */
    function handleExpenseSubmit(e) {
        e.preventDefault();

        // Get form values
        const date = elements.dateInput?.value;
        const description = elements.descriptionInput?.value;
        const category = elements.categoryInput?.value;
        const amount = parseFloat(elements.amountInput?.value);

        // Validate inputs
        if (!date || !description || !category || isNaN(amount) || amount <= 0) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }

        // Create new expense object
        const expense = {
            id: generateId('exp'),
            type: 'expense',
            date,
            description,
            category,
            amount
        };

        // Add to state
        state.transactions.push(expense);

        // Add category if it's new
        if (!state.categories.includes(category)) {
            state.categories.push(category);
        }

        // Save state
        saveState();

        // Reset form
        elements.expenseForm.reset();
        elements.dateInput.valueAsDate = new Date();

        // Update UI
        updateUI();

        // Show success message
        showToast('Expense added successfully!', 'success');
    }

    /**
     * Handle income form submission
     * @param {Event} e - Form submit event
     */
    function handleIncomeSubmit(e) {
        e.preventDefault();

        // Get form values
        const date = elements.incomeDateInput?.value;
        const description = elements.incomeDescriptionInput?.value;
        const amount = parseFloat(elements.incomeAmountInput?.value);

        // Validate inputs
        if (!date || !description || isNaN(amount) || amount <= 0) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }

        // Create new income object
        const income = {
            id: generateId('inc'),
            type: 'income',
            date,
            description,
            amount
        };

        // Add to state
        state.transactions.push(income);

        // Save state
        saveState();

        // Reset form
        elements.incomeForm.reset();
        elements.incomeDateInput.valueAsDate = new Date();

        // Update UI
        updateUI();

        // Show success message
        showToast('Income added successfully!', 'success');
    }

    // ================== CATEGORY MANAGEMENT ==================
    /**
     * Update category suggestions datalist
     */
    function updateCategorySuggestions() {
        if (!elements.datalist) return;
        
        elements.datalist.innerHTML = '';
        state.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            elements.datalist.appendChild(option);
        });
    }
    
    /**
     * Update category filter dropdown
     */
    function updateCategoryFilterDropdown() {
        if (!elements.categoryFilter) return;

        elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            state.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        elements.categoryFilter.value = currentCategoryFilter || 'all';
    }
    
    /**
     * Filter transactions by category
     * @param {string} category - Category to filter by
     */
    function filterByCategory(category) {
        currentCategoryFilter = category;
        updateUI();
        updateClearFilterButtonVisibility();
    }
    
    /**
     * Show or hide clear filter button based on current filter
     */
    function updateClearFilterButtonVisibility() {
        if (!elements.clearCategoryFilterBtn) return;
        
        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
            elements.clearCategoryFilterBtn.style.display = 'block';
        } else {
            elements.clearCategoryFilterBtn.style.display = 'none';
        }
    }
    
    /**
     * Search transactions by query string
     * @param {string} query - Search query
     */
    function searchTransactions(query) {
        currentSearchQuery = query.trim();
        updateUI();
        
        if (elements.clearSearchButton) {
            elements.clearSearchButton.style.display = currentSearchQuery ? 'inline-block' : 'none';
        }
        
        // Show feedback to user
        if (currentSearchQuery) {
            showToast(`Showing results for "${currentSearchQuery}"`, 'info', 2000);
        }
    }
    
    /**
     * Clear search results
     */
    function clearSearch() {
        if (elements.searchInput) elements.searchInput.value = '';
        currentSearchQuery = '';
        updateUI();
        
        if (elements.clearSearchButton) {
            elements.clearSearchButton.style.display = 'none';
        }
    }
    
    /**
     * Handle filter changes (type and month)
     */
    function handleFilterChange() {
        if (elements.typeFilter) state.filters.type = elements.typeFilter.value;
        if (elements.monthFilter) state.filters.month = elements.monthFilter.value;
        saveState();
        updateUI();
    }
    
    /**
     * Toggle theme between light and dark
     */
    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.className = state.theme;
        saveState();
        showToast(`${state.theme.charAt(0).toUpperCase() + state.theme.slice(1)} theme applied`, 'info', 1500);
    }
    
    /**
     * Toggle section visibility
     * @param {string} sectionClass - Section class to toggle
     * @param {boolean} isVisible - Whether section should be visible
     */
    function applySectionVisibility(sectionClass, isVisible) {
        const sections = document.getElementsByClassName(sectionClass);
        for (let i = 0; i < sections.length; i++) {
            sections[i].style.display = isVisible ? 'block' : 'none';
        }
    }

    // ================== DATA MANAGEMENT FUNCTIONS ==================
    /**
     * Clear all application data
     */
    function clearAllData() {
        if (confirm('Are you sure you want to delete all budget data? This cannot be undone.')) {
            localStorage.removeItem('budgetAppState');
            state = loadState();
            updateUI();
            showToast('All data has been cleared.', 'success');
        }
    }

    /**
     * Clear only transaction history while preserving categories and settings
     */
    function clearTransactionHistory() {
        if (confirm('Are you sure you want to delete all transaction history? This cannot be undone.')) {
            // Store the number of transactions for the success message
            const transactionCount = state.transactions.length;

            // Clear transactions but keep other state intact
            state.transactions = [];

            // Save state and update UI
            saveState();
            updateUI();

            // Show success message
            showToast(`Cleared ${transactionCount} transactions from history.`, 'success');
        }
    }

    /**
     * Export transactions to CSV file
     */
    function exportToCSV() {
        // Exit if no transactions
        if (!state.transactions || state.transactions.length === 0) {
            showToast('No transactions to export.', 'error');
            return;
        }

        try {
            // CSV header row
            const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];

            // Format transaction data
            const rows = state.transactions.map(t => {
                const date = new Date(t.date).toLocaleDateString('en-IN');
                const category = t.category || ''; // Handle null/undefined
                return [
                    date,
                    t.type,
                    category,
                    t.description,
                    t.amount.toFixed(2)
                ];
            });

            // Create CSV content with proper escaping for CSV
            const formatCSVField = (field) => {
                // If the field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
                const stringField = String(field);
                if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
                    return '"' + stringField.replace(/"/g, '""') + '"';
                }
                return stringField;
            };

            // Format the entire CSV content
            const csvContent = [
                headers.map(formatCSVField).join(','),
                ...rows.map(row => row.map(formatCSVField).join(','))
            ].join('\n');

            // Create a Blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Create temporary download link
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.href = url;
            link.setAttribute('download', `budget-manager-export-${timestamp}.csv`);
            link.style.display = 'none';

            // Add to document, trigger download, and clean up
            document.body.appendChild(link);
            link.click();

            // Clean up after download starts
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showToast(`${state.transactions.length} transactions exported successfully.`, 'success');
            }, 100);

        } catch (error) {
            console.error('Error exporting to CSV:', error);
            showToast('Failed to export data. ' + error.message, 'error');
        }
    }

    // ================== INITIALIZATION ==================
    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing app...');

        // Set initial theme
        document.body.className = state.theme || 'light';

        // Initialize filter values from state
        if (elements.typeFilter) elements.typeFilter.value = state.filters.type;
        if (elements.monthFilter) elements.monthFilter.value = state.filters.month;

        // Setup form listeners
        setupFormListeners();
        
        // Setup other event listeners
        initializeEventListeners();
        
        // Update UI
        updateUI();
        
        console.log('App initialized successfully!');
    }
    
    /**
     * Setup form submission listeners
     */
    function setupFormListeners() {
        // Expense form
        if (elements.expenseForm) {
            console.log('Adding expense form listener');
            elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
            
            // Set current date as default
            if (elements.dateInput) {
                elements.dateInput.valueAsDate = new Date();
            }
        } else {
            console.warn('Expense form not found!');
        }
        
        // Income form
        if (elements.incomeForm) {
            console.log('Adding income form listener');
            elements.incomeForm.addEventListener('submit', handleIncomeSubmit);
            
            // Set current date as default
            if (elements.incomeDateInput) {
                elements.incomeDateInput.valueAsDate = new Date();
            }
        } else {
            console.warn('Income form not found!');
        }
    }
    
    /**
     * Initialize all event listeners
     */
    function initializeEventListeners() {
        // Filters
        elements.typeFilter?.addEventListener('change', handleFilterChange);
        elements.monthFilter?.addEventListener('change', handleFilterChange);
        
        // Data management
        elements.clearDataBtn?.addEventListener('click', clearAllData);
        elements.exportDataBtn?.addEventListener('click', exportToCSV);
        elements.exportCsvBtn?.addEventListener('click', exportToCSV);
        elements.clearHistoryBtn?.addEventListener('click', clearTransactionHistory);
        
        // Theme toggle
        elements.themeToggleBtn?.addEventListener('click', toggleTheme);
        
        // Search functionality
        elements.searchButton?.addEventListener('click', () => {
            const query = elements.searchInput?.value || '';
            searchTransactions(query);
        });
        
        elements.clearSearchButton?.addEventListener('click', clearSearch);
        
        // Allow searching by pressing Enter in the search input
        elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = elements.searchInput?.value || '';
                searchTransactions(query);
                e.preventDefault();
            }
        });
        
        // Category management
        elements.categoryInput?.addEventListener('change', () => {
            const category = elements.categoryInput.value.trim();
            if (category && !state.categories.includes(category)) {
                state.categories.push(category);
                saveState();
                updateCategorySuggestions();
                updateCategoryFilterDropdown();
            }
        });
        
        // Category filter
        elements.categoryFilter?.addEventListener('change', (e) => {
            filterByCategory(e.target.value);
        });
        
        // Clear filter button
        document.getElementById('clear-category-filter')?.addEventListener('click', () => {
            currentCategoryFilter = 'all';
            updateUI();
            updateClearFilterButtonVisibility();
        });
        
        // Section visibility toggle checkboxes
        const sectionToggleCheckboxes = document.querySelectorAll('[data-section-class]');
        sectionToggleCheckboxes.forEach(checkbox => {
            const sectionClass = checkbox.dataset.sectionClass;
            checkbox.addEventListener('change', (e) => {
                applySectionVisibility(sectionClass, e.target.checked);
                localStorage.setItem(`section_${sectionClass}`, e.target.checked);
            });
            
            // Initialize visibility based on saved state
            const isVisible = localStorage.getItem(`section_${sectionClass}`) !== 'false';
            checkbox.checked = isVisible;
            applySectionVisibility(sectionClass, isVisible);
        });
    }
    
    // Initialize the application
    init();
});
