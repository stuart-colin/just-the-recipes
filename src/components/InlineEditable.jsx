import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const InlineEditable = ({
  value,
  onSave,
  placeholder = "Click to edit",
  inputType = "text", // 'text', 'number', 'url', 'textarea'
  as: DisplayComponent = "span", // The component to render when not editing
  inputProps = {}, // Additional props for the input/textarea
  displayProps = {}, // Additional props for the display component
  className = "", // Applied to the wrapper or display component
  inputClassName = "", // Specific class for input
  displayClassName = "" // Specific class for display text
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    // Sync with external value changes if not currently editing
    if (!isEditing) {
      setCurrentValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select && (inputType === 'text' || inputType === 'url' || inputType === 'number')) {
        inputRef.current.select();
      }
    }
  }, [isEditing, inputType]);

  const handleSave = () => {
    if (currentValue !== value) { // Only save if there's a change
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputType !== 'textarea') { // For textarea, Enter usually means new line
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value); // Revert
      setIsEditing(false);
    }
  };

  const InputElement = inputType === 'textarea' ? Textarea : Input;

  if (isEditing) {
    return (
      <InputElement
        ref={inputRef}
        type={inputType === 'textarea' ? undefined : inputType}
        value={currentValue === null ? '' : currentValue} // Handle null for number inputs
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`p-0 h-auto bg-transparent border-primary border-dashed focus:border-solid focus:ring-1 focus:ring-primary ${inputClassName}`}
        {...(inputType === 'textarea' ? { rows: 2 } : {})}
        {...inputProps}
      />
    );
  }

  return (
    <DisplayComponent
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-muted/30 p-0 rounded min-h-[1.5em] inline-block ${className} ${displayClassName}`}
      title={`Click to edit ${placeholder.toLowerCase()}`}
      {...displayProps}
    >
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
    </DisplayComponent>
  );
};

export default InlineEditable;