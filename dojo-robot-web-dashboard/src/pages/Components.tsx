import { useNavigate } from 'react-router-dom';
import { ComponentTree } from '../components/components/ComponentTree';
import type { Component } from '../types/api';

export function Components() {
  const navigate = useNavigate();

  const handleComponentSelect = (component: Component) => {
    // Navigate to component detail page with topics tab as default
    navigate(`/components/${component.id}/topics`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Components</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and manage robot components organized by areas
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ComponentTree
          onComponentSelect={handleComponentSelect}
          showStatus={true}
          showSearch={true}
        />
      </div>
    </div>
  );
}
