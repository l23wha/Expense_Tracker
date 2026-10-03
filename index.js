#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'expenses.json');

// Ensure the data file exists
function loadExpenses() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    return [];
  }

  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(fileContent || '[]');
  } catch (error) {
    console.error('Error reading expenses file:', error);
    return [];
  }
}

function saveExpenses(expenses) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
  } catch (error) {
    console.error('Error saving expenses file:', error);
  }
}

// Helper: Get flag value
function getFlagValue(args, flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

// Feature 1: Add expense
function addExpense(args) {
  const description = getFlagValue(args, '--description');
  const amountStr = getFlagValue(args, '--amount');

  if (!description || !amountStr) {
    console.log('Both --description and --amount flags are required to add an expense.');
    return;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) { // Fixed: isNaN
    console.log('Amount must be a positive number.');
    return;
  }

  const expenses = loadExpenses();
  const nextId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
  const newExpense = {
    id: nextId,
    date: new Date().toISOString().split('T')[0],
    description,
    amount,
  };

  expenses.push(newExpense);
  saveExpenses(expenses);
  console.log(`Expense added: ${description} - $${amount.toFixed(2)}`);
}

// Feature 2: Update expense
function updateExpense(args) {
  const idStr = getFlagValue(args, '--id');
  const description = getFlagValue(args, '--description');
  const amountStr = getFlagValue(args, '--amount');

  if (!idStr) {
    console.log('--id flag is required to update an expense.');
    return;
  }

  const id = parseInt(idStr, 10);
  const expenses = loadExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) {
    console.log(`No expense found with id ${id}`);
    return;
  }

  if (description) {
    expenses[index].description = description;
  }

  if (amountStr) {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      console.log('Amount must be a positive number.');
      return;
    }
    expenses[index].amount = amount;
  }

  saveExpenses(expenses);
  console.log(`Expense with id ${id} updated.`);
}

// Feature 3: Delete expense
function deleteExpense(args) {
  const idStr = getFlagValue(args, '--id'); // Fixed: args instead of agrs

  if (!idStr) {
    console.log('--id flag is required to delete an expense.');
    return;
  }

  const id = parseInt(idStr, 10);
  const expenses = loadExpenses();
  const filtered = expenses.filter(e => e.id !== id);

  if (filtered.length === expenses.length) {
    console.log(`No expense found with id ${id}`);
    return;
  }

  saveExpenses(filtered);
  console.log(`Expense with id ${id} deleted.`);
}

// Feature 4: View all expenses
function viewExpense() {
  const expenses = loadExpenses();
  if (expenses.length === 0) {
    console.log('No expenses found.');
    return;
  }

  console.log('Expenses:');
  console.log('# ID  | Date        | Description          | Amount');
  console.log('--------------------------------------------------');
  expenses.forEach(e => {
    const id = String(e.id).padEnd(5, ' ');
    const date = e.date.padEnd(11, ' ');
    const description = e.description.padEnd(20, ' ');
    const amount = `$${e.amount.toFixed(2)}`;
    console.log(`${id} | ${date} | ${description} | ${amount}`);
  });
}

// Feature 5 & 6: View Summary
function showSummary(args) { // Fixed: added args parameter
  const monthStr = getFlagValue(args, '--month');
  const expenses = loadExpenses();

  if (expenses.length === 0) {
    console.log('No expenses found.');
    return;
  }

  if (monthStr) {
    const month = parseInt(monthStr, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      console.log('Invalid month. Please provide a month between 1 and 12.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getFullYear() === currentYear && expDate.getMonth() + 1 === month;
    });

    const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    console.log(`Total expenses for ${monthNames[month - 1]}: $${total.toFixed(2)}`);
  } else {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    console.log(`Total expenses for all time: $${total.toFixed(2)}`);
  }
}

// Help message
function showHelp() {
  console.log(`
  Expense Tracker CLI - Usage Commands

    Add Expense:
      expense-tracker add --description "Lunch" --amount 20

    Update Expense:
      expense-tracker update --id 1 --description "Dinner" --amount 25
    
    Delete Expense:
      expense-tracker delete --id 1

    View All Expenses:
      expense-tracker list

    View Total Expense Summary:
      expense-tracker summary 

    View Monthly Expense Summary (Current Year):
      expense-tracker summary --month 8
  `);
}

// CLI Route handler
function main() {
  const args = process.argv.slice(2); // Fixed: args variable name
  const command = args[0];

  switch (command) {
    case 'add':
      addExpense(args);
      break;
    case 'update':
      updateExpense(args);
      break;
    case 'delete':
      deleteExpense(args);
      break;
    case 'list':
      viewExpense();
      break;
    case 'summary':
      showSummary(args);
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      showHelp();
      break;
  }
}

main();