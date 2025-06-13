import React, { useState } from 'react';
import { Participant } from '../types';
import { useVideoStore } from '../store/videoStore';
import { UserPlus, Users, X, ChevronUp, ChevronDown } from 'lucide-react';

const ParticipantManager: React.FC = () => {
  const { participants, addParticipant, removeParticipant, updateParticipant } = useVideoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState<{
    name: string;
    position: 'left' | 'center' | 'right';
    emphasis: 'primary' | 'secondary' | 'background';
  }>({
    name: '',
    position: 'center',
    emphasis: 'primary'
  });

  const handleAddParticipant = () => {
    if (!newParticipant.name.trim()) return;
    
    addParticipant({
      id: `participant-${Date.now()}`,
      name: newParticipant.name,
      position: newParticipant.position,
      emphasis: newParticipant.emphasis
    });
    
    // Reset form
    setNewParticipant({
      name: '',
      position: 'center',
      emphasis: 'primary'
    });
  };

  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4 mt-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-400" />
          <h3 className="text-lg font-medium">Participants Manager</h3>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>
      
      {isOpen && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-4">
            Add key people to be featured in your thumbnail
          </p>
          
          {participants.length > 0 && (
            <div className="mb-4 space-y-2">
              <h4 className="text-sm font-medium text-white">Current Participants</h4>
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between bg-gray-700 bg-opacity-50 rounded-lg p-2">
                  <div>
                    <span className="font-medium">{participant.name}</span>
                    <div className="flex text-xs text-gray-400 mt-1">
                      <span className="mr-2">Position: {participant.position}</span>
                      <span>Emphasis: {participant.emphasis}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={participant.position}
                      onChange={(e) => updateParticipant(index, { position: e.target.value as 'left' | 'center' | 'right' })}
                      className="bg-gray-800 border border-gray-600 rounded-md text-xs px-2 py-1"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                    <select
                      value={participant.emphasis}
                      onChange={(e) => updateParticipant(index, { emphasis: e.target.value as 'primary' | 'secondary' | 'background' })}
                      className="bg-gray-800 border border-gray-600 rounded-md text-xs px-2 py-1"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="background">Background</option>
                    </select>
                    <button
                      onClick={() => removeParticipant(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Add New Participant</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                placeholder="Participant name"
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white flex-grow"
              />
              <select
                value={newParticipant.position}
                onChange={(e) => setNewParticipant({ ...newParticipant, position: e.target.value as 'left' | 'center' | 'right' })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
              <select
                value={newParticipant.emphasis}
                onChange={(e) => setNewParticipant({ ...newParticipant, emphasis: e.target.value as 'primary' | 'secondary' | 'background' })}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="background">Background</option>
              </select>
            </div>
            <button
              onClick={handleAddParticipant}
              disabled={!newParticipant.name.trim()}
              className="flex items-center justify-center w-full px-4 py-2 mt-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Participant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantManager; 