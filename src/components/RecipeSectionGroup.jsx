import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, XCircle } from 'lucide-react';
import InlineEditable from './InlineEditable';

const RecipeSectionGroup = ({
  group,
  onGroupNameChange,
  onRemoveGroup,
  onAddItem,
  addItemLabel,
  groupTitlePlaceholder,
  removeGroupAriaLabel,
  children, // This will contain the rendered items
}) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex-grow p-3 border rounded-md bg-muted/5">
        <InlineEditable
          value={group.title}
          onSave={(newName) => onGroupNameChange(group.id, group.title, newName)}
          placeholder={groupTitlePlaceholder}
          inputClassName="font-semibold text-md"
          displayClassName="font-semibold text-md mb-2 block"
        />
        {children}
        <Button type="button" size="icon" variant="ghost" onClick={() => onAddItem(group.id)} className="mt-2" aria-label={addItemLabel}>
          <PlusCircle className="h-3 w-3" />
        </Button>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveGroup(group.id)} aria-label={removeGroupAriaLabel} className="flex-shrink-0">
        <XCircle className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export default RecipeSectionGroup;