import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/expenseService';
import { EXPENSE_CATEGORIES } from '../utils/constants';

/**
 * ExpenseContext
 *
 * Global state layer for all expense data. Provides:
 *  - expenses[]         : Full list from backend (current month)
 *  - loading            : True during initial fetch
 *  - error              : String | null — last error message
 *  - totalSpent         : Sum of all expense amounts this month
 *  - categoryBreakdown  : [{ name, value, color }] — for charts
 *  - refresh()          : Re-fetch expenses from the API
 *  - addExpense(exp)    : Optimistically prepend a new expense
 *  - removeExpense(id)  : Optimistically remove an expense by id
 *  - updateExpense(exp) : Optimistically replace an expense in the list
 */

const ExpenseContext = createContext(null);

// ─── Normalise a raw expense from the API or an optimistic update ────────────
// Ensures category is always lowercase (matching EXPENSE_CATEGORIES ids)
// and id is always a string so comparisons work correctly.
function normaliseExpense(e) {
  return {
    ...e,
    id: e.id ?? (e._id ? String(e._id) : String(Date.now())),
    category: e.category ? e.category.toLowerCase() : 'other',
  };
}

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => {
    const value = expenses
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { name: cat.name, value, color: cat.color, id: cat.id };
  }).filter((c) => c.value > 0);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getAll();
      // Backend returns { status: 'success', data: { expenses: [...], pagination: {...} } }
      // Handle all response shapes gracefully:
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.expenses)) {
        // Primary shape from expense_controller.py → list_expenses()
        list = response.data.expenses;
      }
      // Normalise: category to lowercase, id to string
      list = list.map(normaliseExpense);
      setExpenses(list);
    } catch (err) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ─── Mutators (optimistic) ────────────────────────────────────────────────
  const addExpense = useCallback((expense) => {
    // Normalise before adding so it immediately matches the chart's category filter
    setExpenses((prev) => [normaliseExpense(expense), ...prev]);
  }, []);

  const removeExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => (e.id ?? e._id) !== id));
  }, []);

  const updateExpense = useCallback((updated) => {
    const norm = normaliseExpense(updated);
    setExpenses((prev) =>
      prev.map((e) => (e.id === norm.id ? norm : e)),
    );
  }, []);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        error,
        totalSpent,
        categoryBreakdown,
        refresh: fetchExpenses,
        addExpense,
        removeExpense,
        updateExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
