import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * Testy jednostkowe dla komponentu LoginForm
 * Wykorzystują React Testing Library i MSW
 */

describe('LoginForm', () => {
  it('renderuje formularz logowania', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zaloguj/i })).toBeInTheDocument();
  });

  it('waliduje wymagane pola', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    await user.click(submitButton);
    
    // HTML5 validation lub własne komunikaty błędów
    await waitFor(() => {
      expect(screen.getByLabelText(/e-?mail/i)).toBeInvalid();
    });
  });

  it('wysyła dane logowania po wypełnieniu formularza', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    render(<LoginForm onSuccess={onSuccess} />);
    
    const emailInput = screen.getByLabelText(/e-?mail/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Test1234!');
    await user.click(submitButton);
    
    // MSW odpowie z sukcesem
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('wyświetla błąd przy niepowodzeniu logowania', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/e-?mail/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    // Sprawdź komunikat błędu (MSW zwróci błąd)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('wyłącza przycisk submit podczas wysyłania', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/e-?mail/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Test1234!');
    await user.click(submitButton);
    
    // Przycisk powinien być wyłączony podczas wysyłania
    expect(submitButton).toBeDisabled();
  });
});

