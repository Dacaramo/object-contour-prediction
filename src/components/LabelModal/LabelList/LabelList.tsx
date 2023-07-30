import { FC, useState, useContext } from 'react';
import AppContext from '../../../contexts/createContext';
import LabelListItem from './LabelListItem.tsx/LabelListItem';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { v4 as uuidv4 } from 'uuid';
import DeletionAlert from '../../DeletionAlert/DeletionAlert';

interface Props {}

const LabelList: FC<Props> = () => {
  const [newLabel, setNewLabel] = useState<string>('');
  const [indexToDelete, setIndexToDelete] = useState<number>(-1);
  const [isAlertShowing, setIsAlertShowing] = useState<boolean>(false);

  const {
    labels: {
      labels,
      addLabel,
      removeLabel,
      replaceLabel,
      currentLabel,
      setCurrentLabel,
    },
  } = useContext(AppContext)!;

  const handleClickOnAddLabel = () => {
    addLabel({
      id: uuidv4(),
      name: newLabel,
    });
    setNewLabel('');
  };

  const handleClickOnConfirmEdition = (index: number, label: string) => {
    replaceLabel(index, {
      id: labels[index].id,
      name: label,
    });

    if (currentLabel === labels[index].name) {
      setCurrentLabel(label);
    }
  };

  const handleClickOnConfirmDeletion = (index: number) => {
    removeLabel(index);
    setIsAlertShowing(false);

    if (currentLabel === labels[index].name) {
      setCurrentLabel('');
    }
  };

  const handleClickOnStartDeletion = (indexToDelete: number) => {
    setIndexToDelete(indexToDelete);
    setIsAlertShowing(true);
  };

  const handleClickOnDismissDeletion = () => {
    setIndexToDelete(-1);
    setIsAlertShowing(false);
  };

  return (
    <div className='d-flex flex-column justify-content-start align-items-center'>
      <Form className='w-100 mb-3 d-flex flex-row justify-content-between align-items-center'>
        <Form.Control
          className='w-50 border-secondary'
          type='text'
          placeholder='Label'
          onChange={(e) => setNewLabel(e.target.value)}
          value={newLabel}
        />
        <Button
          variant='outline-secondary'
          onClick={handleClickOnAddLabel}
          disabled={
            labels.map(({ name }) => name).includes(newLabel) || newLabel === ''
          }
        >
          Add new label
        </Button>
      </Form>
      {isAlertShowing && (
        <DeletionAlert
          itemToDeleteText={labels[indexToDelete].name}
          onClickConfirm={() => handleClickOnConfirmDeletion(indexToDelete)}
          onClickDismiss={handleClickOnDismissDeletion}
        />
      )}
      <div
        style={{ maxHeight: '400px', overflowY: 'auto' }}
        className='w-100'
      >
        {labels.map((label, i) => {
          return (
            <LabelListItem
              key={label.id}
              label={label.name}
              index={i}
              onClickConfirmEdition={handleClickOnConfirmEdition}
              onClickStartDeletion={handleClickOnStartDeletion}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LabelList;
