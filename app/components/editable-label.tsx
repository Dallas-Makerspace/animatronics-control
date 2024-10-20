import React, { use, useEffect, useState } from 'react';

interface EditableLabelProps {
  initialValue: string;
  onSave: (newValue: string) => void;
}

const EditableLabel = (props: EditableLabelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(props.initialValue);

  useEffect(() => {
    setValue(props.initialValue);
  }, [props.initialValue]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSaveClick = () => {
    props.onSave(value);
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <input type="text" value={value} onChange={handleInputChange} />
      ) : (
        <span onClick={handleEditClick}>{value}</span>
      )}
      {isEditing && <button onClick={handleSaveClick}>Save</button>}
    </div>
  );
};

export default EditableLabel;