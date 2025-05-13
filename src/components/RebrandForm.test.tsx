import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import RebrandForm from './RebrandForm';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

describe('RebrandForm', () => { 
  const mockPush = vi.fn();
  const mockedUseRouter = useRouter as MockedFunction<typeof useRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/',
      route: '/',
      asPath: '/',
      query: {},
      isReady: true,
    } as any);
  });

  it('renders all form fields and labels', () => {
    render(<RebrandForm />);
    
    expect(screen.getByLabelText(/ghost site url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/admin api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/old name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('updates form data when inputs change', async () => {
    render(<RebrandForm />);

    const siteUrlInput = screen.getByLabelText(/ghost site url/i) as HTMLInputElement;
    const apiKeyInput = screen.getByLabelText(/admin api key/i) as HTMLInputElement;
    const oldNameInput = screen.getByLabelText(/old name/i) as HTMLInputElement;
    const newNameInput = screen.getByLabelText(/new name/i) as HTMLInputElement;

    fireEvent.change(siteUrlInput, { target: { value: 'https://example.ghost.io' } });
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    fireEvent.change(oldNameInput, { target: { value: 'Old Name' } });
    fireEvent.change(newNameInput, { target: { value: 'New Name' } });

    expect(siteUrlInput.value).toBe('https://example.ghost.io');
    expect(apiKeyInput.value).toBe('test-api-key');
    expect(oldNameInput.value).toBe('Old Name');
    expect(newNameInput.value).toBe('New Name');
  });

  it('does not submit if fields are missing', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue({ jobId: 'test-job-123' });
    render(<RebrandForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits form successfully and navs to progress page', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue({ jobId: 'test-job-123' });
    render(<RebrandForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/ghost site url/i), { target: { value: 'https://example.ghost.io' } });
    fireEvent.change(screen.getByLabelText(/admin api key/i), { target: { value: 'test-api-key' } });
    fireEvent.change(screen.getByLabelText(/old name/i), { target: { value: 'Old Name' } });
    fireEvent.change(screen.getByLabelText(/new name/i), { target: { value: 'New Name' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        siteUrl: 'https://example.ghost.io',
        apiKey: 'test-api-key',
        oldName: 'Old Name',
        newName: 'New Name',
      });
      expect(mockPush).toHaveBeenCalledWith('/progress/test-job-123');
    });
  });

  it('reports submission errors to user', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    
    render(<RebrandForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/ghost site url/i), { target: { value: 'https://example.ghost.io' } });
    fireEvent.change(screen.getByLabelText(/admin api key/i), { target: { value: 'test-api-key' } });
    fireEvent.change(screen.getByLabelText(/old name/i), { target: { value: 'Old Name' } });
    fireEvent.change(screen.getByLabelText(/new name/i), { target: { value: 'New Name' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred: Network error')).toBeInTheDocument();
    });
  });
})