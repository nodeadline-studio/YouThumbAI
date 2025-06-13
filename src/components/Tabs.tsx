import React, { ReactNode, useState, useEffect } from 'react';
import './Tabs.css';

interface TabsProps {
  activeTab?: string;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: ReactNode;
}

interface TabListProps {
  children: ReactNode;
}

interface TabProps {
  id: string;
  children: ReactNode;
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab: controlledActiveTab, defaultTab, onChange, children }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(defaultTab || '');
  
  // Determine if this is a controlled or uncontrolled component
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;
  
  // Initialize with defaultTab if provided
  useEffect(() => {
    if (defaultTab && !isControlled && !internalActiveTab) {
      setInternalActiveTab(defaultTab);
    }
  }, [defaultTab, isControlled, internalActiveTab]);
  
  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    if (!isControlled) {
      setInternalActiveTab(tabId);
    }
    if (onChange) {
      onChange(tabId);
    }
  };
  
  // Clone children to pass activeTab and onChange props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { activeTab, onChange: handleTabChange });
    }
    return child;
  });
  
  return <div className="tabs-container">{childrenWithProps}</div>;
};

export const TabList: React.FC<TabListProps & { activeTab?: string; onChange?: (tabId: string) => void }> = 
  ({ children, activeTab, onChange }) => {
  
  const tabs = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === Tab) {
      return React.cloneElement(child, { 
        active: child.props.id === activeTab,
        onClick: () => onChange && onChange(child.props.id)
      });
    }
    return null;
  });
  
  return <div className="tab-list">{tabs}</div>;
};

export const Tab: React.FC<TabProps & { active?: boolean; onClick?: () => void }> = 
  ({ id, children, active, onClick }) => {
  
  return (
    <div 
      className={`tab ${active ? 'active' : ''}`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      {children}
    </div>
  );
};

export const TabPanel: React.FC<TabPanelProps & { activeTab?: string }> = 
  ({ id, children, activeTab }) => {
  
  if (id !== activeTab) return null;
  
  return <div className="tab-panel" role="tabpanel">{children}</div>;
}; 