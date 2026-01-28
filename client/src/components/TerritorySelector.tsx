import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { TERRITORIES, getTerritoryDisplayName, calculateTerritoryPercentage } from '../../../shared/territories';

interface TerritorySelectorProps {
  selectedTerritories: string[];
  onChange: (territories: string[]) => void;
}

export default function TerritorySelector({ selectedTerritories, onChange }: TerritorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  const toggleRegion = (regionId: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionId)) {
      newExpanded.delete(regionId);
    } else {
      newExpanded.add(regionId);
    }
    setExpandedRegions(newExpanded);
  };

  const handleTerritoryToggle = (territoryId: string) => {
    // If selecting "worldwide", clear all others
    if (territoryId === 'worldwide') {
      onChange(['worldwide']);
      setIsOpen(false);
      return;
    }

    // Remove "worldwide" if selecting specific territories
    let newSelection = selectedTerritories.filter(id => id !== 'worldwide');

    // Toggle the selected territory
    if (newSelection.includes(territoryId)) {
      newSelection = newSelection.filter(id => id !== territoryId);
    } else {
      newSelection = [...newSelection, territoryId];
    }

    // If nothing selected, default to worldwide
    if (newSelection.length === 0) {
      newSelection = ['worldwide'];
    }

    onChange(newSelection);
  };

  const isSelected = (territoryId: string) => {
    return selectedTerritories.includes(territoryId);
  };

  const territoryPercentage = calculateTerritoryPercentage(selectedTerritories);
  const displayName = getTerritoryDisplayName(selectedTerritories);

  return (
    <div className="relative">
      <label className="block text-sm font-bold mb-2 text-gray-500">
        Territory / Region
      </label>
      
      {/* Selected Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          <span>{displayName}</span>
          <span className="text-[#58CC02] text-sm">({territoryPercentage}%)</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-h-96 overflow-y-auto">
          <div className="p-2">
            {TERRITORIES.map((territory) => (
              <div key={territory.id} className="mb-1">
                {/* Main Territory */}
                <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg">
                  <button
                    onClick={() => handleTerritoryToggle(territory.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <div className={`w-5 h-5 border-2 border-black rounded flex items-center justify-center ${
                      isSelected(territory.id) ? 'bg-[#58CC02]' : 'bg-white'
                    }`}>
                      {isSelected(territory.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold">{territory.name}</span>
                    <span className="text-sm text-gray-500">({territory.percentage}%)</span>
                  </button>
                  
                  {/* Expand/Collapse for regions with children */}
                  {territory.children && territory.children.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRegion(territory.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedRegions.has(territory.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Child Territories */}
                {territory.children && expandedRegions.has(territory.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {territory.children.map((child) => (
                      <div key={child.id} className="mb-1">
                        {/* Child Territory Button */}
                        <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg">
                          <button
                            onClick={() => handleTerritoryToggle(child.id)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <div className={`w-5 h-5 border-2 border-black rounded flex items-center justify-center ${
                              isSelected(child.id) ? 'bg-[#58CC02]' : 'bg-white'
                            }`}>
                              {isSelected(child.id) && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-medium">{child.name}</span>
                            <span className="text-sm text-gray-500">({child.percentage}%)</span>
                          </button>
                          
                          {/* Expand/Collapse for nested children (e.g., US states) */}
                          {child.children && child.children.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRegion(child.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {expandedRegions.has(child.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Nested Children (e.g., US States) */}
                        {child.children && expandedRegions.has(child.id) && (
                          <div className="ml-6 mt-1 space-y-1 max-h-48 overflow-y-auto border-l-2 border-gray-300 pl-2">
                            {child.children.map((grandchild) => (
                              <button
                                key={grandchild.id}
                                onClick={() => handleTerritoryToggle(grandchild.id)}
                                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg w-full text-left text-sm"
                              >
                                <div className={`w-4 h-4 border-2 border-black rounded flex items-center justify-center ${
                                  isSelected(grandchild.id) ? 'bg-[#58CC02]' : 'bg-white'
                                }`}>
                                  {isSelected(grandchild.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="font-normal">{grandchild.name}</span>
                                <span className="text-xs text-gray-500">({grandchild.percentage}%)</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer with percentage summary */}
          <div className="border-t-4 border-black p-3 bg-gray-50 sticky bottom-0">
            <div className="flex justify-between items-center font-bold">
              <span>Total Coverage:</span>
              <span className="text-[#58CC02] text-lg">{territoryPercentage}%</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 bg-[#58CC02] text-white py-2 px-4 rounded-lg font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
