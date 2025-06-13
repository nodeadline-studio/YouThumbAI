import { atom } from 'jotai';
import React from 'react';

export type ControlCategory = 
  | 'generation' 
  | 'elements' 
  | 'participants' 
  | 'style' 
  | 'export';

export type ControlPriority = 'primary' | 'secondary' | 'advanced';

export interface Control {
  id: string;
  category: ControlCategory;
  label: string;
  description?: string;
  priority: ControlPriority;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  isFrequentlyUsed?: boolean;
}

// This will be populated with actual component imports when they're created
const CreativeDirectionControl = () => <div>Creative Direction Control</div>;
const ClickbaitIntensityControl = () => <div>Clickbait Intensity Control</div>;
const VariationCountControl = () => <div>Variation Count Control</div>;
const CostOptimizationControl = () => <div>Cost Optimization Control</div>;
const StyleConsistencyControl = () => <div>Style Consistency Control</div>;
const CustomKeywordsControl = () => <div>Custom Keywords Control</div>;
const CreatorTypeControl = () => <div>Creator Type Control</div>;
const ColorPaletteControl = () => <div>Color Palette Control</div>;
const ReferenceThumbnailsControl = () => <div>Reference Thumbnails Control</div>;

// Create a registry of all controls
export const controlsRegistry: Control[] = [
  // Generation controls
  {
    id: 'creative-direction',
    category: 'generation',
    label: 'Creative Direction',
    description: 'Choose the overall style approach',
    priority: 'primary',
    component: CreativeDirectionControl,
    isFrequentlyUsed: true
  },
  {
    id: 'clickbait-intensity',
    category: 'generation',
    label: 'Attention Level',
    description: 'Adjust how attention-grabbing the thumbnail should be',
    priority: 'primary',
    component: ClickbaitIntensityControl,
    isFrequentlyUsed: true
  },
  {
    id: 'variation-count',
    category: 'generation',
    label: 'Variation Count',
    description: 'Number of thumbnails to generate',
    priority: 'primary',
    component: VariationCountControl,
    isFrequentlyUsed: true
  },
  {
    id: 'cost-optimization',
    category: 'generation',
    label: 'Quality Level',
    description: 'Balance between cost and quality',
    priority: 'secondary',
    component: CostOptimizationControl
  },
  {
    id: 'style-consistency',
    category: 'generation',
    label: 'Style Consistency',
    description: 'How closely to match channel style',
    priority: 'secondary',
    component: StyleConsistencyControl
  },
  {
    id: 'custom-keywords',
    category: 'generation',
    label: 'Custom Keywords',
    description: 'Add specific terms to include in generation',
    priority: 'advanced',
    component: CustomKeywordsControl
  },
  
  // Style controls
  {
    id: 'creator-type',
    category: 'style',
    label: 'Creator Type',
    description: 'Select your content category',
    priority: 'primary',
    component: CreatorTypeControl,
    isFrequentlyUsed: true
  },
  {
    id: 'color-palette',
    category: 'style',
    label: 'Color Palette',
    description: 'Dominant colors from channel analysis',
    priority: 'secondary',
    component: ColorPaletteControl
  },
  {
    id: 'reference-thumbnails',
    category: 'style',
    label: 'Reference Thumbnails',
    description: 'Select thumbnails that match your style',
    priority: 'secondary',
    component: ReferenceThumbnailsControl
  },
  
  // Additional controls for other categories would be added here
];

// Store the expanded state for each control
export const expandedStateAtom = atom<Record<string, boolean>>({
  'creative-direction': true,
  'clickbait-intensity': true,
  'variation-count': true,
  'creator-type': true,
  // Default states for other controls
});

// Favorites system
export const favoritesAtom = atom<string[]>([
  'creative-direction', 
  'clickbait-intensity', 
  'variation-count'
]);

// Filter controls by category and priority
export const getControlsByCategory = (
  category: ControlCategory,
  priority?: ControlPriority
): Control[] => {
  return controlsRegistry.filter(
    control => control.category === category && 
    (priority ? control.priority === priority : true)
  );
};

// Get frequently used controls across all categories
export const getFrequentlyUsedControls = (): Control[] => {
  return controlsRegistry.filter(control => control.isFrequentlyUsed);
}; 