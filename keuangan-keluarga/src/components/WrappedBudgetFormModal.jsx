import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import BudgetFormModal from './BudgetFormModal';

const WrappedBudgetFormModal = () => {
  return <ErrorBoundary><BudgetFormModal /></ErrorBoundary>;
};

export default WrappedBudgetFormModal;