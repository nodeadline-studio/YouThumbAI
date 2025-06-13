import { useState, ReactNode } from 'react';
import './CollapsibleSection.css';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  id: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  defaultExpanded = false,
  id 
}) => {
  // Use localStorage to persist expanded state between sessions
  const savedState = localStorage.getItem(`section-${id}`);
  const [expanded, setExpanded] = useState(
    savedState !== null ? savedState === 'true' : defaultExpanded
  );
  
  const toggleExpanded = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem(`section-${id}`, String(newState));
  };
  
  return (
    <div className={`collapsible-section ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="section-header" onClick={toggleExpanded}>
        <h3>{title}</h3>
        <span className="toggle-icon">{expanded ? '−' : '+'}</span>
      </div>
      
      {expanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection; 