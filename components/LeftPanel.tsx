import React, { useState } from 'react';
import { CanvasElement, ANIMATION_OPTIONS, CanvasAction } from '../types';
import { Icons } from './Icons';

interface LeftPanelProps {
  elements: CanvasElement[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onUpdateElement: (id: number, updates: Partial<CanvasElement>) => void;
  onDelete: (id: number) => void;
  customCss: string;
  setCustomCss: (css: string) => void;
  customJs: string;
  setCustomJs: (js: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  elements,
  selectedId,
  onSelect,
  onReorder,
  onUpdateElement,
  onDelete,
  customCss,
  setCustomCss,
  customJs,
  setCustomJs
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'code'>('layers');
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLayerIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedLayerIndex === null || draggedLayerIndex === index) return;
    onReorder(draggedLayerIndex, index);
    setDraggedLayerIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedLayerIndex(null);
  };

  const addAction = (element: CanvasElement) => {
    const newAction: CanvasAction = {
      id: Date.now().toString(),
      trigger: 'click',
      type: 'showHide',
      targetId: elements.find(e => e.id !== element.id)?.id || 0 // Default to first other element
    };
    onUpdateElement(element.id, { actions: [...(element.actions || []), newAction] });
  };

  const removeAction = (element: CanvasElement, actionId: string) => {
     onUpdateElement(element.id, { actions: element.actions?.filter(a => a.id !== actionId) });
  };

  const updateAction = (element: CanvasElement, actionId: string, updates: Partial<CanvasAction>) => {
    const newActions = element.actions?.map(a => a.id === actionId ? { ...a, ...updates } : a);
    onUpdateElement(element.id, { actions: newActions });
  };

  // Find selected element for animation panel
  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="w-80 bg-[#121212] border-r border-gray-800 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'layers' ? 'bg-[#181818] text-[#9500cb]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Icons.Layers size={16} /> Layers & Anim
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'code' ? 'bg-[#181818] text-[#9500cb]' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Icons.Code size={16} /> Custom Code
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'layers' && (
          <div className="space-y-6">
            
            {/* Layers List */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Layers Order (Top First)</h3>
              <div className="space-y-1">
                {[...elements].reverse().map((el, revIndex) => {
                  // Calculate actual index in original array
                  const originalIndex = elements.length - 1 - revIndex;
                  return (
                    <div
                      key={el.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, originalIndex)}
                      onDragOver={(e) => handleDragOver(e, originalIndex)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelect(el.id)}
                      className={`
                        group flex items-center justify-between p-2 rounded cursor-pointer border
                        ${selectedId === el.id 
                          ? 'bg-[#9500cb]/20 border-[#9500cb]/50' 
                          : 'bg-gray-800 border-transparent hover:bg-gray-700'}
                      `}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Icons.DragHandle size={14} className="text-gray-500 cursor-grab active:cursor-grabbing" />
                        <span className="text-xs font-mono text-gray-400">#{el.id}</span>
                        <span className="text-sm truncate font-medium text-gray-200">
                           {el.name || el.type}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  );
                })}
                {elements.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4 italic">No layers yet</p>
                )}
              </div>
            </div>

            {/* Animation Controls for Selected */}
            {selectedElement ? (
              <>
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Animation (#{selectedElement.id})
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                    <select
                      value={selectedElement.animation}
                      onChange={(e) => onUpdateElement(selectedElement.id, { animation: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#9500cb]"
                    >
                      {ANIMATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {selectedElement.animation && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Duration (s)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={selectedElement.animationDuration || (selectedElement.animation === 'custom-pulse' ? 2 : 1)}
                          onChange={(e) => onUpdateElement(selectedElement.id, { animationDuration: parseFloat(e.target.value) })}
                          className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#9500cb]"
                        />
                      </div>
                      {selectedElement.animation === 'custom-pulse' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Scale (e.g. 1.2)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1.0"
                            value={selectedElement.animationScale || 1.05}
                            onChange={(e) => onUpdateElement(selectedElement.id, { animationScale: parseFloat(e.target.value) })}
                            className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#9500cb]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="loopAnim"
                      checked={selectedElement.loopAnimation}
                      onChange={(e) => onUpdateElement(selectedElement.id, { loopAnimation: e.target.checked })}
                      className="rounded bg-[#181818] border-gray-700 text-[#9500cb] focus:ring-0 focus:ring-offset-0 accent-[#9500cb]"
                    />
                    <label htmlFor="loopAnim" className="text-sm text-gray-300 select-none">Loop Animation</label>
                  </div>
                </div>
              </div>

              {/* ACTIONS PANEL */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions / Interactions
                  </h3>
                  <button 
                    onClick={() => addAction(selectedElement)}
                    className="text-[10px] bg-gray-800 hover:bg-[#9500cb] text-white px-2 py-1 rounded transition-colors"
                  >
                    + Add
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(!selectedElement.actions || selectedElement.actions.length === 0) && (
                     <div className="text-xs text-gray-600 italic text-center">No actions configured</div>
                  )}

                  {selectedElement.actions?.map((action, idx) => (
                    <div key={action.id} className="bg-[#181818] border border-gray-700 rounded p-2 text-xs">
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-gray-400">Action {idx + 1}</span>
                           <button onClick={() => removeAction(selectedElement, action.id)} className="text-gray-500 hover:text-red-400">
                             <Icons.Trash size={12} />
                           </button>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-12">When:</span>
                                <div className="flex-1 bg-gray-800 rounded px-2 py-1 flex items-center gap-2 text-gray-300">
                                   <Icons.MousePointerClick size={12} /> Click
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-12">Do:</span>
                                <select 
                                   value={action.type}
                                   onChange={(e) => updateAction(selectedElement, action.id, { type: e.target.value as any })}
                                   className="flex-1 bg-gray-900 border border-gray-700 rounded px-1 py-1 focus:outline-none"
                                >
                                    <option value="showHide">Show/Hide (Toggle)</option>
                                    <option value="toggleFade">Fade In/Out</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 w-12">Target:</span>
                                <select 
                                   value={action.targetId}
                                   onChange={(e) => updateAction(selectedElement, action.id, { targetId: parseInt(e.target.value) })}
                                   className="flex-1 bg-gray-900 border border-gray-700 rounded px-1 py-1 focus:outline-none"
                                >
                                    {elements.map(el => (
                                        <option key={el.id} value={el.id}>
                                            #{el.id} - {el.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
            ) : (
              <div className="pt-4 border-t border-gray-800 text-center text-gray-500 text-sm">
                Select an element to edit animations & actions
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-semibold text-[#9500cb] uppercase tracking-wider mb-2 flex items-center gap-2">
                 CSS <span className="text-gray-500 normal-case font-normal">(Global)</span>
              </label>
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                className="flex-1 w-full bg-[#181818] border border-gray-700 rounded p-3 font-mono text-xs text-green-400 focus:outline-none focus:border-[#9500cb] resize-none"
                placeholder=".my-class { border: 2px solid red; }"
              />
            </div>
            <div className="flex-1 flex flex-col pt-4">
              <label className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 JavaScript <span className="text-gray-500 normal-case font-normal">(Runs immediately)</span>
              </label>
              <textarea
                value={customJs}
                onChange={(e) => setCustomJs(e.target.value)}
                className="flex-1 w-full bg-[#181818] border border-gray-700 rounded p-3 font-mono text-xs text-yellow-200 focus:outline-none focus:border-[#9500cb] resize-none"
                placeholder="console.log('Hello World');"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Note: JS runs in the builder context. Use caution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;