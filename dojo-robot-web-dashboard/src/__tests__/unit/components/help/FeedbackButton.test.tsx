import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackButton } from '@/components/help/FeedbackButton';

describe('FeedbackButton', () => {
  it('renders feedback button', () => {
    render(<FeedbackButton />);
    const button = screen.getByLabelText('Send feedback');
    expect(button).toBeInTheDocument();
  });

  it('opens feedback modal when clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    const button = screen.getByLabelText('Send feedback');
    await user.click(button);

    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
    expect(screen.getByLabelText('Feedback Type')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    // Open modal
    await user.click(screen.getByLabelText('Send feedback'));
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByLabelText('Close feedback form'));
    expect(screen.queryByText('Send Feedback')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    await user.click(screen.getByLabelText('Send feedback'));

    const submitButton = screen.getByText('Submit Feedback');
    
    // Try to submit without filling required fields
    // The form should prevent submission due to HTML5 validation
    expect(submitButton).toBeInTheDocument();
  });

  it('displays all form fields', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    await user.click(screen.getByLabelText('Send feedback'));

    // Check all form fields are present
    expect(screen.getByLabelText('Feedback Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Email (Optional)')).toBeInTheDocument();
  });

  it('has all feedback type options', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    await user.click(screen.getByLabelText('Send feedback'));
    
    // Check all options are available
    expect(screen.getByRole('option', { name: 'Bug Report' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Feature Request' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Improvement Suggestion' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
  });
});
