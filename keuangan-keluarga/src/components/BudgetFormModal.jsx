import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '../Button';
import { Form } from '../Form';

const BudgetFormModal = () => {
  const [appState, dispatch] = useAppContext();
  const [translation] = useTranslation();
  const [formData, setFormData] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initialize form data if needed
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    dispatch({ type: 'SAVE_BUDGET', payload: formData });
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={setIsOpen} title={translation('Budget Form')}>
      <Form onSubmit={handleSubmit}>
        {/* Form fields here */}
        <Button type="submit">{translation('Save')}</Button>
      </Form>
    </Modal>
  );
};

export default BudgetFormModal;