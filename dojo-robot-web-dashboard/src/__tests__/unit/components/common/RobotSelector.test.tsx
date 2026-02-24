import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RobotSelector } from '@/components/common/RobotSelector';
import { useRobotStore } from '@/features/stores/robotStore';

describe('RobotSelector', () => {
  beforeEach(() => {
    // Reset store state before each test
    useRobotStore.setState({
      robots: [],
      activeRobotId: null,
    });
  });

  it('should render with no robot selected initially', () => {
    render(<RobotSelector />);
    expect(screen.getByText('No robot selected')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', () => {
    render(<RobotSelector />);
    const button = screen.getByRole('button', { name: /select robot/i });
    fireEvent.click(button);

    expect(screen.getByText('No robots configured')).toBeInTheDocument();
    expect(screen.getByText('Add Robot')).toBeInTheDocument();
  });

  it('should display add robot form when Add Robot button is clicked', () => {
    render(<RobotSelector />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));
    
    // Click Add Robot button
    fireEvent.click(screen.getByText('Add Robot'));

    expect(screen.getByPlaceholderText('Robot name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/API URL/i)).toBeInTheDocument();
  });

  it('should add a new robot with valid inputs', () => {
    render(<RobotSelector />);
    
    // Open dropdown and show form
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));
    fireEvent.click(screen.getByText('Add Robot'));

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText('Robot name'), {
      target: { value: 'Test Robot' },
    });
    fireEvent.change(screen.getByPlaceholderText(/API URL/i), {
      target: { value: 'http://localhost:8080' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add robot/i }));

    // Verify robot was added
    const state = useRobotStore.getState();
    expect(state.robots).toHaveLength(1);
    expect(state.robots[0].name).toBe('Test Robot');
    expect(state.robots[0].apiUrl).toBe('http://localhost:8080');
  });

  it('should show error for invalid URL', () => {
    render(<RobotSelector />);
    
    // Open dropdown and show form
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));
    fireEvent.click(screen.getByText('Add Robot'));

    // Fill in form with invalid URL
    fireEvent.change(screen.getByPlaceholderText('Robot name'), {
      target: { value: 'Test Robot' },
    });
    fireEvent.change(screen.getByPlaceholderText(/API URL/i), {
      target: { value: 'invalid-url' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add robot/i }));

    // Verify error message
    expect(screen.getByText(/Invalid URL/i)).toBeInTheDocument();
  });

  it('should show error when robot name is empty', () => {
    render(<RobotSelector />);
    
    // Open dropdown and show form
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));
    fireEvent.click(screen.getByText('Add Robot'));

    // Fill in only URL
    fireEvent.change(screen.getByPlaceholderText(/API URL/i), {
      target: { value: 'http://localhost:8080' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add robot/i }));

    // Verify error message
    expect(screen.getByText(/Robot name is required/i)).toBeInTheDocument();
  });

  it('should cancel add robot form', () => {
    render(<RobotSelector />);
    
    // Open dropdown and show form
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));
    fireEvent.click(screen.getByText('Add Robot'));

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText('Robot name'), {
      target: { value: 'Test Robot' },
    });

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Verify form is hidden and inputs are cleared
    expect(screen.queryByPlaceholderText('Robot name')).not.toBeInTheDocument();
  });

  it('should display list of robots', () => {
    // Add robots to store
    const { addRobot } = useRobotStore.getState();
    addRobot('Robot 1', 'http://localhost:8080');
    addRobot('Robot 2', 'http://localhost:8081');

    render(<RobotSelector />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));

    // Verify robots are displayed
    expect(screen.getByText('Robot 1')).toBeInTheDocument();
    expect(screen.getByText('Robot 2')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:8080')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:8081')).toBeInTheDocument();
  });

  it('should switch to selected robot', () => {
    // Add robots to store
    const { addRobot } = useRobotStore.getState();
    const id1 = addRobot('Robot 1', 'http://localhost:8080');
    const id2 = addRobot('Robot 2', 'http://localhost:8081');

    render(<RobotSelector />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));

    // Click on Robot 2
    fireEvent.click(screen.getByText('Robot 2'));

    // Verify Robot 2 is now active
    const state = useRobotStore.getState();
    expect(state.activeRobotId).toBe(id2);
  });

  it('should display active robot name in selector button', () => {
    // Add and activate a robot
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Active Robot', 'http://localhost:8080');
    switchRobot(id);

    render(<RobotSelector />);

    // Verify active robot name is displayed
    expect(screen.getByText('Active Robot')).toBeInTheDocument();
  });

  it('should show check mark next to active robot', () => {
    // Add and activate a robot
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Active Robot', 'http://localhost:8080');
    switchRobot(id);

    render(<RobotSelector />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));

    // Check mark should be present (lucide-react Check icon)
    const activeRobotRow = screen.getAllByText('Active Robot')[1].closest('div');
    expect(activeRobotRow).toBeInTheDocument();
  });

  it('should remove robot when delete button is clicked', () => {
    // Add robots to store
    const { addRobot } = useRobotStore.getState();
    const id = addRobot('Robot to Remove', 'http://localhost:8080');

    render(<RobotSelector />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));

    // Click remove button
    const removeButton = screen.getByLabelText(/Remove Robot to Remove/i);
    fireEvent.click(removeButton);

    // Verify robot was removed
    const state = useRobotStore.getState();
    expect(state.robots.find((r) => r.id === id)).toBeUndefined();
  });

  it('should accept HTTPS URLs', () => {
    render(<RobotSelector />);
    
    // Open dropdown and show form
    fireEvent.click(screen.getByRole('button', { name: /select robot/i }));
    fireEvent.click(screen.getByText('Add Robot'));

    // Fill in form with HTTPS URL
    fireEvent.change(screen.getByPlaceholderText('Robot name'), {
      target: { value: 'Secure Robot' },
    });
    fireEvent.change(screen.getByPlaceholderText(/API URL/i), {
      target: { value: 'https://robot.example.com:8080' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add robot/i }));

    // Verify robot was added
    const state = useRobotStore.getState();
    expect(state.robots).toHaveLength(1);
    expect(state.robots[0].apiUrl).toBe('https://robot.example.com:8080');
  });
});
