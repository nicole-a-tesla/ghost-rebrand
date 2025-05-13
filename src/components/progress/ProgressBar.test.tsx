import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('should render with 0% when no totalCount', () => {
    render(<ProgressBar completedCount={5} totalCount={null} />);
    
    expect(screen.getByText('0% complete')).toBeInTheDocument();
    expect(screen.queryByText(/posts processed/)).not.toBeInTheDocument();
  });

  it('should calculate percentage correctly', () => {
    render(<ProgressBar completedCount={30} totalCount={100} />);
    
    expect(screen.getByText('30% complete')).toBeInTheDocument();
    expect(screen.getByText('30 of 100 posts processed')).toBeInTheDocument();
  });

  it('should handle edge case of 0 totalCount', () => {
    render(<ProgressBar completedCount={0} totalCount={0} />);
    
    expect(screen.getByText('0% complete')).toBeInTheDocument();
  });
});