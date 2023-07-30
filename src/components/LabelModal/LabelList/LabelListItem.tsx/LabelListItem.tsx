import { FC, useState } from 'react';
import { truncateStr } from '../../../../helpers/strings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { slate500 } from '../../../../constants/colors';
import {
  faCircleCheck,
  faCircleXmark,
  faPenToSquare,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import Form from 'react-bootstrap/Form';

type LabelAction = 'edition' | 'deletion' | 'none';

interface Props {
  label: string;
  index: number;
  onClickConfirmEdition: (index: number, label: string) => void;
  onClickStartDeletion: (indexToDelete: number) => void;
}

const LabelListItem: FC<Props> = ({
  label,
  index,
  onClickConfirmEdition: handleClickOnConfirmEdition,
  onClickStartDeletion: handleClickOnStartDeletion,
}) => {
  const [newLabel, setNewLabel] = useState<string>(label);
  const [action, setAction] = useState<LabelAction>('none');

  const iconSize = 'lg';
  const iconColor = slate500;

  const handleClickOnStartAction = (triggeredAction: LabelAction) => {
    setAction(triggeredAction);
    if (triggeredAction === 'deletion') {
      handleClickOnStartDeletion(index);
    }
  };

  const handleClickOnConfirmEdition2 = (index: number, label: string) => {
    handleClickOnConfirmEdition(index, label);
    setAction('none');
  };

  const handleClickOnDismissEdition = () => {
    setAction('none');
    setNewLabel(label);
  };

  return (
    <li
      className={`w-100 d-flex flex-row justify-content-start align-items-center border-secondary p-2 ${
        index === 0 ? 'border' : 'border-start border-end border-bottom'
      }`}
    >
      {action === 'none' || action === 'deletion' ? (
        <>
          <span>{truncateStr(label)}</span>
          <button
            className='ml-auto'
            onClick={() => handleClickOnStartAction('edition')}
          >
            <FontAwesomeIcon
              icon={faPenToSquare}
              size={iconSize}
              color={iconColor}
            />
          </button>
          <button
            className='ml-2'
            onClick={() => handleClickOnStartAction('deletion')}
          >
            <FontAwesomeIcon
              icon={faTrashCan}
              size={iconSize}
              color={iconColor}
            />
          </button>
        </>
      ) : (
        <>
          <Form.Control
            className='w-50 border-secondary'
            type='text'
            placeholder='Label'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button
            className='ml-auto'
            onClick={() => handleClickOnConfirmEdition2(index, newLabel)}
          >
            <FontAwesomeIcon
              icon={faCircleCheck}
              size={iconSize}
              color={iconColor}
            />
          </button>
          <button
            className='ml-2'
            onClick={handleClickOnDismissEdition}
          >
            <FontAwesomeIcon
              icon={faCircleXmark}
              size={iconSize}
              color={iconColor}
            />
          </button>
        </>
      )}
    </li>
  );
};

export default LabelListItem;
